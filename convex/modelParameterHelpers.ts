import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Helper functions for managing model-specific parameters
 */

// Interface for parameter mapping results
export interface ParameterMapping {
  apiParameters: any; // Parameters to send to Replicate API
  frontendParameters: any; // Original frontend form values
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

    return {
      supportedDurations: params.duration?.allowedValues || [],
      supportedResolutions: params.resolution?.allowedValues || [],
      supportedAspectRatios: params.aspectRatio?.allowedValues || [],
      supportedCameraConcepts: params.cameraConcept?.allowedValues || [],
      supportsLoop: !!params.loop,
      defaultValues: {
        duration: params.duration?.defaultValue,
        resolution: params.resolution?.defaultValue,
        aspectRatio: params.aspectRatio?.defaultValue,
        cameraConcept: params.cameraConcept?.defaultValue,
        loop: params.loop?.defaultValue,
      },
      constraints: modelParams.constraints || {},
    };
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
 * Maps frontend form values to API parameters using database-driven capabilities
 */
export async function mapParametersForModel(
  ctx: any,
  modelId: string,
  frontendParams: any
): Promise<ParameterMapping> {
  const mappingLog: string[] = [];
  let apiParameters: any = {
    prompt: frontendParams.prompt,
  };

  mappingLog.push(`Starting parameter mapping for model: ${modelId}`);

  // Get model with capabilities from database
  const model = await ctx.db
    .query("models")
    .withIndex("by_model_id", (q: any) => q.eq("modelId", modelId))
    .first();

  if (!model) {
    mappingLog.push("Model not found, using basic mapping");
    // Fallback to basic duration mapping
    if (frontendParams.duration) {
      apiParameters.duration = parseInt(frontendParams.duration);
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
    .withIndex("by_model_id", (q: any) => q.eq("modelId", modelId))
    .first();

  if (modelParams && modelParams.mappingRules) {
    // Use mapping rules from modelParameters table
    const mappings = modelParams.mappingRules;

    for (const [frontendKey, apiKey] of Object.entries(mappings)) {
      const frontendValue = frontendParams[frontendKey];

      if (frontendValue !== undefined && frontendValue !== null) {
        // Special handling for different parameter types
        switch (frontendKey) {
          case "duration":
            apiParameters[apiKey as string] = parseInt(frontendValue);
            mappingLog.push(
              `Mapped ${frontendKey}: ${frontendValue} -> ${apiKey}: ${apiParameters[apiKey as string]}`
            );
            break;

          case "cameraConcept":
            if (frontendValue !== "none") {
              // Concepts are mapped as array for Luma Ray models
              apiParameters[apiKey as string] = [frontendValue];
              mappingLog.push(
                `Mapped ${frontendKey}: ${frontendValue} -> ${apiKey}: [${frontendValue}]`
              );
            }
            break;

          case "loop":
            apiParameters[apiKey as string] = Boolean(frontendValue);
            mappingLog.push(
              `Mapped ${frontendKey}: ${frontendValue} -> ${apiKey}: ${Boolean(frontendValue)}`
            );
            break;

          default:
            apiParameters[apiKey as string] = frontendValue;
            mappingLog.push(
              `Mapped ${frontendKey}: ${frontendValue} -> ${apiKey}: ${frontendValue}`
            );
        }
      }
    }
  } else {
    // Fallback to model.parameterMappings if modelParameters not found
    if (model.parameterMappings) {
      const mappings = model.parameterMappings;

      for (const [frontendKey, apiKey] of Object.entries(mappings)) {
        const frontendValue = frontendParams[frontendKey];

        if (frontendValue !== undefined && frontendValue !== null) {
          // Special handling for different parameter types
          switch (frontendKey) {
            case "duration":
              apiParameters[apiKey as string] = parseInt(frontendValue);
              mappingLog.push(
                `Mapped ${frontendKey}: ${frontendValue} -> ${apiKey}: ${apiParameters[apiKey as string]}`
              );
              break;

            case "cameraConcept":
              if (frontendValue !== "none") {
                // Concepts are mapped as array for Luma Ray models
                apiParameters[apiKey as string] = [frontendValue];
                mappingLog.push(
                  `Mapped ${frontendKey}: ${frontendValue} -> ${apiKey}: [${frontendValue}]`
                );
              }
              break;

            case "loop":
              apiParameters[apiKey as string] = Boolean(frontendValue);
              mappingLog.push(
                `Mapped ${frontendKey}: ${frontendValue} -> ${apiKey}: ${Boolean(frontendValue)}`
              );
              break;

            default:
              apiParameters[apiKey as string] = frontendValue;
              mappingLog.push(
                `Mapped ${frontendKey}: ${frontendValue} -> ${apiKey}: ${frontendValue}`
              );
          }
        }
      }
    }
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
  frontendParams: any
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate duration (basic validation only for backward compatibility)
  if (model.fixedDuration) {
    if (parseInt(frontendParams.duration) !== model.fixedDuration) {
      errors.push(`Model only supports ${model.fixedDuration}s duration`);
    }
  }
  // Note: For variable duration models, validation should now use the
  // validateModelCapabilities function with modelParameters data

  return {
    isValid: errors.length === 0,
    errors,
  };
}
