import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Migration to add discovery fields to existing models
 */
export const migrateModelsForDiscovery = mutation({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db.query("models").collect();
    let updated = 0;

    for (const model of models) {
      const updateData: any = {};
      let needsUpdate = false;

      // Add discovery metadata if missing
      if (model.discoveredAt === undefined) {
        updateData.discoveredAt = model.createdAt; // Use creation time as discovery time for existing models
        needsUpdate = true;
      }

      if (model.lastValidatedAt === undefined) {
        updateData.lastValidatedAt = model.updatedAt || model.createdAt;
        needsUpdate = true;
      }

      if (model.schemaVersion === undefined) {
        updateData.schemaVersion = model.version || "1.0";
        needsUpdate = true;
      }

      if (model.confidence === undefined) {
        // Set high confidence for existing models since they were manually added
        updateData.confidence = 95;
        needsUpdate = true;
      }

      // Add enhanced metadata if missing
      if (model.supportedInputTypes === undefined) {
        updateData.supportedInputTypes = ["text", "image"];
        needsUpdate = true;
      }

      if (model.supportedOutputFormats === undefined) {
        updateData.supportedOutputFormats = ["mp4"];
        needsUpdate = true;
      }

      if (model.estimatedProcessingTime === undefined) {
        // Estimate based on cost per second
        const costPerSecond = model.costPerSecond || 0.25;
        updateData.estimatedProcessingTime = Math.max(30, costPerSecond * 100); // Rough heuristic
        needsUpdate = true;
      }

      // Add health monitoring fields if missing
      if (model.isHealthy === undefined) {
        updateData.isHealthy = true; // Assume healthy for existing models
        needsUpdate = true;
      }

      if (model.healthStatus === undefined) {
        updateData.healthStatus = "unknown";
        needsUpdate = true;
      }

      if (model.healthIssues === undefined) {
        updateData.healthIssues = [];
        needsUpdate = true;
      }

      if (needsUpdate) {
        updateData.updatedAt = Date.now();
        await ctx.db.patch(model._id, updateData);
        updated++;
      }
    }

    return {
      totalModels: models.length,
      updated,
      message: `Updated ${updated} models with discovery metadata`,
    };
  },
});

/**
 * Migration to populate input schemas for known models
 */
export const populateKnownModelSchemas = mutation({
  args: {},
  handler: async (ctx) => {
    const knownSchemas = {
      "google/veo-3": {
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Text prompt for video generation",
              maxLength: 500,
            },
            duration_seconds: {
              type: "number",
              enum: [8],
              default: 8,
              description: "Duration of the generated video in seconds",
            },
            aspect_ratio: {
              type: "string",
              enum: ["16:9", "9:16", "1:1"],
              default: "16:9",
              description: "Aspect ratio of the generated video",
            },
            seed: {
              type: "integer",
              minimum: 0,
              maximum: 1000000,
              description: "Random seed for reproducible results",
            },
          },
          required: ["prompt"],
        },
        supportedInputTypes: ["text"],
        supportedOutputFormats: ["mp4"],
        estimatedProcessingTime: 180, // 3 minutes average
      },
      "luma/ray-2-720p": {
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Text prompt for video generation",
              maxLength: 500,
            },
            duration_seconds: {
              type: "number",
              enum: [5, 9],
              default: 5,
              description: "Duration of the generated video in seconds",
            },
            aspect_ratio: {
              type: "string",
              enum: ["1:1", "3:4", "4:3", "9:16", "16:9", "9:21", "21:9"],
              default: "16:9",
              description: "Aspect ratio of the generated video",
            },
            loop: {
              type: "boolean",
              default: false,
              description: "Whether to create a looping video",
            },
            camera_concept: {
              type: "string",
              enum: ["pan_right", "pan_left", "zoom_in", "zoom_out", "aerial_drone", "truck_left", "truck_right", "low_angle", "high_angle"],
              description: "Camera movement concept",
            },
          },
          required: ["prompt"],
        },
        supportedInputTypes: ["text", "image"],
        supportedOutputFormats: ["mp4"],
        estimatedProcessingTime: 120, // 2 minutes average
      },
      "luma/ray-flash-2-540p": {
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Text prompt for video generation",
              maxLength: 500,
            },
            duration_seconds: {
              type: "number",
              enum: [5, 9],
              default: 5,
              description: "Duration of the generated video in seconds",
            },
            aspect_ratio: {
              type: "string",
              enum: ["1:1", "3:4", "4:3", "9:16", "16:9", "9:21", "21:9"],
              default: "16:9",
              description: "Aspect ratio of the generated video",
            },
            loop: {
              type: "boolean",
              default: false,
              description: "Whether to create a looping video",
            },
            camera_concept: {
              type: "string",
              enum: ["pan_right", "pan_left", "zoom_in", "zoom_out", "aerial_drone", "truck_left", "truck_right", "low_angle", "high_angle"],
              description: "Camera movement concept",
            },
          },
          required: ["prompt"],
        },
        supportedInputTypes: ["text", "image"],
        supportedOutputFormats: ["mp4"],
        estimatedProcessingTime: 90, // 1.5 minutes average
      },
    };

    let updated = 0;

    for (const [modelId, schemaData] of Object.entries(knownSchemas)) {
      const model = await ctx.db
        .query("models")
        .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
        .first();

      if (model) {
        await ctx.db.patch(model._id, {
          inputSchema: schemaData.inputSchema,
          supportedInputTypes: schemaData.supportedInputTypes,
          supportedOutputFormats: schemaData.supportedOutputFormats,
          estimatedProcessingTime: schemaData.estimatedProcessingTime,
          lastValidatedAt: Date.now(),
          updatedAt: Date.now(),
        });
        updated++;
      }
    }

    return {
      updated,
      message: `Updated ${updated} known models with detailed schemas`,
    };
  },
});

/**
 * Clean up old discovery logs
 */
export const cleanupOldDiscoveryLogs = mutation({
  args: {
    maxAgedays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxAge = (args.maxAgedays || 30) * 24 * 60 * 60 * 1000; // Default 30 days
    const cutoffTime = Date.now() - maxAge;

    const oldLogs = await ctx.db
      .query("modelDiscoveryLogs")
      .withIndex("by_started_at", (q) => q.lt("startedAt", cutoffTime))
      .collect();

    let deleted = 0;
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
      deleted++;
    }

    return {
      deleted,
      message: `Deleted ${deleted} old discovery logs`,
    };
  },
});