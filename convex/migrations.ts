import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Migration 1: Populate modelParameters for existing videos
export const migrateVideoParameters = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    parametersCreated: v.number(),
    alreadyExists: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx) => {
    console.log("Starting video parameters migration...");

    let parametersCreated = 0;
    let alreadyExists = 0;
    let errors = 0;

    try {
      const videos = await ctx.db.query("videos").collect();

      for (const video of videos) {
        try {
          // Check if modelParameters already exists for this video
          const existingParams = await ctx.db
            .query("modelParameters")
            .withIndex("by_video_id", (q) => q.eq("videoId", video._id))
            .first();

          if (existingParams) {
            alreadyExists++;
            continue;
          }

          // Create parameters based on video data and model type
          const frontendParams = {
            prompt: video.prompt,
            duration: video.duration,
            quality: video.quality,
            ...(video.generationSettings || {}),
          };

          // Map parameters using inline logic
          const apiParameters: Record<string, unknown> = {
            prompt: video.prompt,
          };

          if (video.model.includes("google/veo")) {
            apiParameters.resolution = frontendParams.resolution || "720p";
            if (frontendParams.startImageUrl) {
              apiParameters.image = frontendParams.startImageUrl;
            }
            apiParameters.seed = Math.floor(Math.random() * 1000000);
          } else if (video.model.includes("seedance")) {
            apiParameters.duration = parseInt(video.duration);
            apiParameters.aspect_ratio = frontendParams.aspectRatio || "16:9";
            apiParameters.resolution = frontendParams.resolution || "480p";
            apiParameters.seed = Math.floor(Math.random() * 1000000);
            if (frontendParams.cameraPosition) {
              apiParameters.camera_position = frontendParams.cameraPosition;
            }
          } else {
            apiParameters.duration = parseInt(video.duration);
            apiParameters.resolution = frontendParams.resolution || "768p";
          }

          // Create modelParameters record
          await ctx.db.insert("modelParameters", {
            videoId: video._id,
            modelId: video.model,
            parameters: apiParameters,
            parameterMapping: {
              frontendParameters: frontendParams,
              mappingLog: [`Parameters mapped for ${video.model}`],
            },
            createdAt: video.createdAt,
          });

          parametersCreated++;
        } catch (error) {
          console.error(`Error processing video ${video._id}: ${error}`);
          errors++;
        }
      }
    } catch (error) {
      console.error(`Migration failed: ${error}`);
      return {
        success: false,
        parametersCreated,
        alreadyExists,
        errors: errors + 1,
      };
    }

    console.log(
      `Migration completed: ${parametersCreated} created, ${alreadyExists} already existed, ${errors} errors`
    );

    return {
      success: true,
      parametersCreated,
      alreadyExists,
      errors,
    };
  },
});

// Migration 2: Remove deprecated fields from videos
export const cleanupVideoFields = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    thumbnailFieldsRemoved: v.number(),
    titleFieldsRemoved: v.number(),
    cdnFieldsRemoved: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx) => {
    console.log("Starting video fields cleanup...");

    let thumbnailFieldsRemoved = 0;
    let titleFieldsRemoved = 0;
    let cdnFieldsRemoved = 0;
    let errors = 0;

    try {
      const videos = await ctx.db.query("videos").collect();

      for (const video of videos) {
        try {
          let hasChanges = false;
          const updates: Record<string, unknown> = { updatedAt: Date.now() };

          // Check for old thumbnail fields
          if ((video as any).thumbnailFileId || (video as any).thumbnailUrl) {
            thumbnailFieldsRemoved++;
            hasChanges = true;
          }

          // Check for old title field
          if ((video as any).title !== undefined) {
            titleFieldsRemoved++;
            hasChanges = true;
          }

          // Check for deprecated CDN fields
          if (
            (video as any).videoCdnUrl ||
            (video as any).videoCdnUrlExpiresAt
          ) {
            cdnFieldsRemoved++;
            hasChanges = true;
          }

          if (hasChanges) {
            await ctx.db.patch(video._id, updates);
          }
        } catch (error) {
          console.error(`Error cleaning up video ${video._id}: ${error}`);
          errors++;
        }
      }
    } catch (error) {
      console.error(`Cleanup failed: ${error}`);
      return {
        success: false,
        thumbnailFieldsRemoved,
        titleFieldsRemoved,
        cdnFieldsRemoved,
        errors: errors + 1,
      };
    }

    console.log(
      `Cleanup completed: ${thumbnailFieldsRemoved} thumbnail fields, ${titleFieldsRemoved} title fields, ${cdnFieldsRemoved} CDN fields, ${errors} errors`
    );

    return {
      success: true,
      thumbnailFieldsRemoved,
      titleFieldsRemoved,
      cdnFieldsRemoved,
      errors,
    };
  },
});

// Migration 3: Restructure modelParameters and create videoParameters
export const migrateParameterStructure = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    migratedRecords: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx) => {
    console.log("Starting parameter structure migration...");

    let migratedRecords = 0;
    let errors = 0;

    try {
      // Step 1: Move existing modelParameters data to videoParameters
      const existingModelParams = await ctx.db
        .query("modelParameters")
        .collect();

      // Check if this is the old structure that needs migration
      const hasOldStructure =
        existingModelParams.length > 0 &&
        existingModelParams.some((param) => param.videoId && param.parameters);

      if (hasOldStructure) {
        for (const param of existingModelParams) {
          try {
            if (param.videoId && param.parameters) {
              // Insert into videoParameters
              await ctx.db.insert("videoParameters", {
                videoId: param.videoId,
                modelId: param.modelId,
                parameters: param.parameters,
                parameterMapping: param.parameterMapping,
                createdAt: param.createdAt,
              });
              migratedRecords++;
            }

            // Delete from old table
            await ctx.db.delete(param._id);
          } catch (error) {
            console.error(`Error migrating parameter ${param._id}: ${error}`);
            errors++;
          }
        }
      } else {
        console.log("No old structure found to migrate");
      }
    } catch (error) {
      console.error(`Parameter structure migration failed: ${error}`);
      return {
        success: false,
        migratedRecords,
        errors: errors + 1,
      };
    }

    console.log(
      `Parameter structure migration completed: ${migratedRecords} records migrated, ${errors} errors`
    );

    return {
      success: true,
      migratedRecords,
      errors,
    };
  },
});

// Migration 4: Analyze storage distribution
export const analyzeStorageDistribution = internalQuery({
  args: {},
  returns: v.object({
    r2StorageVideos: v.number(),
    convexStorageVideos: v.number(),
    totalVideos: v.number(),
  }),
  handler: async (ctx) => {
    console.log("Analyzing video storage distribution...");

    const videos = await ctx.db
      .query("videos")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    let r2StorageVideos = 0;
    let convexStorageVideos = 0;

    for (const video of videos) {
      if (video.r2FileKey) {
        r2StorageVideos++;
      } else if (video.convexFileId) {
        convexStorageVideos++;
      }
    }

    console.log(
      `Storage analysis: ${r2StorageVideos} videos in R2, ${convexStorageVideos} videos still in Convex storage`
    );

    return {
      r2StorageVideos,
      convexStorageVideos,
      totalVideos: videos.length,
    };
  },
});

// Migration 5: Ensure modelParameters table is properly populated
export const ensureModelParametersPopulated = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    modelsProcessed: v.number(),
    parametersCreated: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx) => {
    console.log("Ensuring modelParameters table is populated...");

    let modelsProcessed = 0;
    let parametersCreated = 0;
    let errors = 0;

    try {
      const now = Date.now();

      // Get all models
      const models = await ctx.db.query("models").collect();

      // Check which models already have parameters
      const existingParams = await ctx.db.query("modelParameters").collect();
      const existingModelIds = new Set(existingParams.map((p) => p.modelId));

      // Find models that need parameters
      const modelsNeedingParams = models.filter(
        (model) => !existingModelIds.has(model.modelId)
      );

      for (const model of modelsNeedingParams) {
        try {
          const parameterDefinitions = getModelParameterDefinitions(model);
          const mappingRules = getModelMappingRules(model);
          const constraints = getModelConstraints(model);

          await ctx.db.insert("modelParameters", {
            modelId: model.modelId,
            parameterDefinitions,
            mappingRules,
            constraints,
            parameterCategories: ["basic", "advanced"],
            createdAt: now,
            updatedAt: now,
          });

          parametersCreated++;
        } catch (error) {
          console.error(
            `Error creating parameters for model ${model.modelId}: ${error}`
          );
          errors++;
        }
        modelsProcessed++;
      }
    } catch (error) {
      console.error(`ModelParameters population failed: ${error}`);
      return {
        success: false,
        modelsProcessed,
        parametersCreated,
        errors: errors + 1,
      };
    }

    console.log(
      `ModelParameters population completed: ${modelsProcessed} models processed, ${parametersCreated} parameters created, ${errors} errors`
    );

    return {
      success: true,
      modelsProcessed,
      parametersCreated,
      errors,
    };
  },
});

// Helper functions for model parameter definitions
function getModelParameterDefinitions(model: {
  modelType: string;
}): Record<string, unknown> {
  const baseParams = {
    prompt: {
      type: "string",
      required: true,
      description: "Text description of the video to generate",
      maxLength: 1000,
    },
    duration: {
      type: "number",
      required: true,
      description: "Duration of the video in seconds",
      minValue: 1,
      maxValue: 60,
    },
  };

  switch (model.modelType) {
    case "google_veo":
      return {
        ...baseParams,
        resolution: {
          type: "string",
          required: false,
          description: "Video resolution",
          allowedValues: ["720p", "1080p"],
          defaultValue: "720p",
        },
        startImageUrl: {
          type: "string",
          required: false,
          description: "URL of starting image for video generation",
        },
      };
    case "luma_ray":
      return {
        ...baseParams,
        aspectRatio: {
          type: "string",
          required: false,
          description: "Aspect ratio of the video",
          allowedValues: ["16:9", "9:16", "1:1"],
          defaultValue: "16:9",
        },
        resolution: {
          type: "string",
          required: false,
          description: "Video resolution",
          allowedValues: ["480p", "720p", "1080p"],
          defaultValue: "480p",
        },
        cameraPosition: {
          type: "string",
          required: false,
          description: "Camera position for 3D scenes",
          allowedValues: ["front", "side", "back", "top"],
        },
      };
    case "stability_ai":
      return {
        ...baseParams,
        resolution: {
          type: "string",
          required: false,
          description: "Video resolution",
          allowedValues: ["768p", "1024p"],
          defaultValue: "768p",
        },
      };
    default:
      return baseParams;
  }
}

function getModelMappingRules(model: {
  modelType: string;
  parameterMappings?: Record<string, string>;
}): Record<string, unknown> {
  const baseRules = {
    prompt: "prompt",
    duration: "duration",
  };

  switch (model.modelType) {
    case "google_veo":
      return {
        ...baseRules,
        resolution: "resolution",
        startImageUrl: "image",
      };
    case "luma_ray":
      return {
        ...baseRules,
        aspectRatio: "aspect_ratio",
        resolution: "resolution",
        cameraPosition: "camera_position",
      };
    case "stability_ai":
      return {
        ...baseRules,
        resolution: "resolution",
      };
    default:
      return baseRules;
  }
}

function getModelConstraints(model: {
  modelType: string;
}): Record<string, unknown> {
  const baseConstraints = {
    prompt: {
      maxLength: 1000,
    },
    duration: {
      minValue: 1,
      maxValue: 60,
    },
  };

  switch (model.modelType) {
    case "google_veo":
      return {
        ...baseConstraints,
        resolution: {
          allowedValues: ["720p", "1080p"],
        },
      };
    case "luma_ray":
      return {
        ...baseConstraints,
        aspectRatio: {
          allowedValues: ["16:9", "9:16", "1:1"],
        },
        resolution: {
          allowedValues: ["480p", "720p", "1080p"],
        },
        cameraPosition: {
          allowedValues: ["front", "side", "back", "top"],
        },
      };
    case "stability_ai":
      return {
        ...baseConstraints,
        resolution: {
          allowedValues: ["768p", "1024p"],
        },
      };
    default:
      return baseConstraints;
  }
}
