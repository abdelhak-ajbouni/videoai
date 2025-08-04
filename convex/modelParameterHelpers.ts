import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

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
  loop?: boolean;
  startImageUrl?: string;
  endImageUrl?: string;
  quality?: string;
}

// Interface for parameter mapping results
export interface ParameterMapping {
  apiParameters: ApiParameters; // Parameters to send to Replicate API
  frontendParameters: FrontendParameters; // Original frontend form values
  mappingLog: string[]; // Log of parameter transformations
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
      defaultValues: {
        duration: params.duration?.defaultValue,
        resolution: params.resolution?.defaultValue,
        aspectRatio: params.aspectRatio?.defaultValue,

        cameraPosition: params.cameraPosition?.defaultValue,
        loop: params.loop?.defaultValue,
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
 * Reusable function to apply parameter mappings and log transformations
 */
function applyParameterMappings(
  mappings: Record<string, string>,
  frontendParams: FrontendParameters,
  apiParameters: ApiParameters,
  mappingLog: string[]
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
          mappingLog.push(
            `Mapped ${frontendKey}: ${frontendValue} -> ${apiKey}: ${durationValue}`
          );
          break;

        case "loop":
          const loopValue = Boolean(frontendValue);
          (apiParameters as unknown as Record<string, unknown>)[apiKey] =
            loopValue;
          mappingLog.push(
            `Mapped ${frontendKey}: ${frontendValue} -> ${apiKey}: ${loopValue}`
          );
          break;

        default:
          (apiParameters as unknown as Record<string, unknown>)[apiKey] =
            frontendValue;
          mappingLog.push(
            `Mapped ${frontendKey}: ${frontendValue} -> ${apiKey}: ${frontendValue}`
          );
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
  const mappingLog: string[] = [];
  const apiParameters: ApiParameters = {
    prompt: frontendParams.prompt,
  };

  mappingLog.push(`Starting parameter mapping for model: ${modelId}`);

  // Get model with capabilities from database
  const model = await ctx.db
    .query("models")
    .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
    .first();

  if (!model) {
    mappingLog.push("Model not found, using basic mapping");
    // Fallback to basic duration mapping
    if (frontendParams.duration) {
      apiParameters.duration = parseInt(frontendParams.duration.toString());
      mappingLog.push(
        `Mapped duration: ${frontendParams.duration} -> ${apiParameters.duration}`
      );
    }
    return {
      apiParameters,
      frontendParameters: frontendParams,
      mappingLog,
    };
  }

  mappingLog.push(`Found model with type: ${model.modelType}`);

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
      apiParameters,
      mappingLog
    );
  } else if (model.parameterMappings) {
    // Fallback to model.parameterMappings if modelParameters not found
    applyParameterMappings(
      model.parameterMappings,
      frontendParams,
      apiParameters,
      mappingLog
    );
  }

  // Add model-specific defaults based on model type
  if (model.modelType === "google_veo") {
    // Add random seed for variation in Veo models
    apiParameters.seed = Math.floor(Math.random() * 1000000);
    mappingLog.push(`Generated seed: ${apiParameters.seed}`);
    mappingLog.push("Duration fixed at 8s for Veo model (no parameter needed)");
  }

  mappingLog.push(`Final API parameters: ${JSON.stringify(apiParameters)}`);

  return {
    apiParameters,
    frontendParameters: frontendParams,
    mappingLog,
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
    parameterMapping: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("videoParameters", {
      videoId: args.videoId,
      modelId: args.modelId,
      parameters: args.parameters,
      parameterMapping: args.parameterMapping,
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

/**
 * Validate parameters against model capabilities
 * Note: This function is deprecated in favor of the database-driven validation
 * in convex/lib/validation.ts. Consider using validateModelCapabilities instead.
 */
export function validateParametersForModel(
  model: Doc<"models">,
  frontendParams: FrontendParameters
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Note: Duration validation should now use the validateModelCapabilities 
  // function with modelParameters data for proper validation

  return {
    isValid: errors.length === 0,
    errors,
  };
}
