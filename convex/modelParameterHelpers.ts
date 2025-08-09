import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";

/**
 * Helper functions for managing model-specific parameters
 */

// Define specific interfaces for type safety
export interface ApiParameters {
  prompt: string;
  duration?: number;
  resolution?: string;
  aspectRatio?: string; // Use camelCase consistently
  loop?: boolean;
  camera_fixed?: boolean;
  start_image?: string;
  end_image?: string;
  image?: string;
  seed?: number;
  duration_seconds?: number;
  camera_position?: string;
}

export interface FrontendParameters {
  prompt: string;
  duration: number | string;
  resolution?: string;
  aspectRatio?: string;
  cameraPosition?: string;
  cameraFixed?: boolean;
  loop?: boolean;
  startImageUrl?: string;
  endImageUrl?: string;
  quality?: string;
}

// Interface for parameter mapping results
export interface ParameterMapping {
  apiParameters: ApiParameters; // Parameters to send to Replicate API
  frontendParameters: FrontendParameters; // Original frontend form values
}

/**
 * Get model parameters (possible parameters for a model)
 */
export const getModelParameters = query({
  args: { modelId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("modelParameters")
      .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
      .first();
  },
});

/**
 * Get model parameters with enhanced frontend support
 */
export const getModelParametersForForm = query({
  args: { modelId: v.string() },
  handler: async (ctx, args) => {
    const modelParams = await ctx.db
      .query("modelParameters")
      .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
      .first();

    if (!modelParams || !modelParams.parameterDefinitions) {
      return null;
    }

    // Extract useful data for the frontend form
    const params = modelParams.parameterDefinitions;

    const result = {
      supportedDurations: params.duration?.allowedValues || [],
      supportedResolutions: params.resolution?.allowedValues || [],
      supportedAspectRatios: params.aspectRatio?.allowedValues || [],

      supportedCameraPositions: params.cameraPosition?.allowedValues || [],
      supportsLoop: !!params.loop,
      supportsCameraFixed: !!params.cameraFixed,
      defaultValues: {
        duration: params.duration?.defaultValue,
        resolution: params.resolution?.defaultValue,
        aspectRatio: params.aspectRatio?.defaultValue,

        cameraPosition: params.cameraPosition?.defaultValue,
        loop: params.loop?.defaultValue,
        cameraFixed: params.cameraFixed?.defaultValue,
      },
      constraints: modelParams.constraints || {},
    };

    return result;
  },
});

/**
 * Get all model parameters for all models
 */
export const getAllModelParameters = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("modelParameters").collect();
  },
});

/**
 * Get video parameters for a video (historical parameters used)
 */
export const getVideoParameters = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videoParameters")
      .withIndex("by_video_id", (q) => q.eq("videoId", args.videoId))
      .first();
  },
});

/**
 * Reusable function to apply parameter mappings
 */
function applyParameterMappings(
  mappings: Record<string, string>,
  frontendParams: FrontendParameters,
  apiParameters: ApiParameters
): void {
  for (const [frontendKey, apiKey] of Object.entries(mappings)) {
    const frontendValue =
      frontendParams[frontendKey as keyof FrontendParameters];

    if (frontendValue !== undefined && frontendValue !== null) {
      // Special handling for different parameter types
      switch (frontendKey) {
        case "duration":
          const durationValue = parseInt(frontendValue as string);
          (apiParameters as unknown as Record<string, unknown>)[apiKey] =
            durationValue;
          break;

        case "loop":
          const loopValue = Boolean(frontendValue);
          (apiParameters as unknown as Record<string, unknown>)[apiKey] =
            loopValue;
          break;

        case "cameraFixed":
          const cameraFixedValue = Boolean(frontendValue);
          (apiParameters as unknown as Record<string, unknown>)[apiKey] =
            cameraFixedValue;
          break;

        default:
          (apiParameters as unknown as Record<string, unknown>)[apiKey] =
            frontendValue;
      }
    }
  }
}

/**
 * Maps frontend form values to API parameters using database-driven capabilities
 */
export async function mapParametersForModel(
  ctx: QueryCtx,
  modelId: string,
  frontendParams: FrontendParameters
): Promise<ParameterMapping> {
  const apiParameters: ApiParameters = {
    prompt: frontendParams.prompt,
  };

  // Get model with capabilities from database
  const model = await ctx.db
    .query("models")
    .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
    .first();

  if (!model) {
    // Fallback to basic duration mapping
    if (frontendParams.duration) {
      apiParameters.duration = parseInt(frontendParams.duration.toString());
    }
    return {
      apiParameters,
      frontendParameters: frontendParams,
    };
  }

  // Get model parameters from the new modelParameters table
  const modelParams = await ctx.db
    .query("modelParameters")
    .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
    .first();

  if (modelParams && modelParams.mappingRules) {
    // Use mapping rules from modelParameters table
    applyParameterMappings(
      modelParams.mappingRules,
      frontendParams,
      apiParameters
    );
  }

  // Add model-specific defaults based on model type
  if (model.modelType === "google_veo") {
    // Add random seed for variation in Veo models
    apiParameters.seed = Math.floor(Math.random() * 1000000);
  }

  return {
    apiParameters,
    frontendParameters: frontendParams,
  };
}

/**
 * Store video parameters for a video
 */
export const storeVideoParameters = mutation({
  args: {
    videoId: v.id("videos"),
    modelId: v.string(),
    parameters: v.any(),
    frontendParameters: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("videoParameters", {
      videoId: args.videoId,
      modelId: args.modelId,
      parameters: args.parameters,
      parameterMapping: args.frontendParameters,
      createdAt: now,
    });
  },
});

/**
 * Get parameter statistics for a model (for analytics)
 */
export const getModelParameterStats = query({
  args: { modelId: v.string() },
  handler: async (ctx, args) => {
    const parameters = await ctx.db
      .query("videoParameters")
      .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
      .collect();

    return {
      totalGenerations: parameters.length,
      modelId: args.modelId,
      // Add more analytics as needed
    };
  },
});
