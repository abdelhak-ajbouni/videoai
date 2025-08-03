import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Simplified model parameter helpers
 *
 * This replaces the complex modelParameterHelpers.ts with a much simpler approach.
 * Instead of complex nested structures, we return simple, flat objects that the frontend can easily use.
 */

// Simple interface for model capabilities
export interface ModelCapabilities {
  // Basic info
  modelId: string;
  tierName: string; // Budget, Quality, Pro

  // Duration options
  supportedDurations: number[];

  // Simple parameter options (only show what's actually configurable)
  hasResolutionOptions: boolean;
  resolutionOptions?: string[];

  hasAspectRatioOptions: boolean;
  aspectRatioOptions?: string[];

  // Defaults
  defaultDuration: number;
  defaultResolution?: string;
  defaultAspectRatio?: string;
}

/**
 * Get simplified model capabilities for frontend
 */
export const getModelCapabilities = query({
  args: { modelId: v.string() },
  handler: async (ctx, { modelId }): Promise<ModelCapabilities | null> => {
    // Get model info
    const model = await ctx.db
      .query("models")
      .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
      .first();

    if (!model) return null;

    // Get parameter info
    const params = await ctx.db
      .query("modelParameters")
      .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
      .first();

    if (!params) return null;

    // Extract durations
    const supportedDurations = params.parameterDefinitions.duration
      ?.allowedValues || [5];
    const defaultDuration = supportedDurations[0];

    // Check for resolution options
    const resolutionDef = params.parameterDefinitions.resolution;
    const hasResolutionOptions = !!resolutionDef;
    const resolutionOptions = resolutionDef?.allowedValues;
    const defaultResolution = resolutionDef?.defaultValue;

    // Check for aspect ratio options
    const aspectRatioDef = params.parameterDefinitions.aspectRatio;
    const hasAspectRatioOptions = !!aspectRatioDef;
    const aspectRatioOptions = aspectRatioDef?.allowedValues;
    const defaultAspectRatio = aspectRatioDef?.defaultValue;

    return {
      modelId,
      tierName: model.name, // "Budget Tier", "Quality Tier", "Pro Tier"
      supportedDurations,
      hasResolutionOptions,
      resolutionOptions,
      hasAspectRatioOptions,
      aspectRatioOptions,
      defaultDuration,
      defaultResolution,
      defaultAspectRatio,
    };
  },
});

/**
 * Get all model capabilities (for model selection)
 */
export const getAllModelCapabilities = query({
  args: {},
  handler: async (ctx): Promise<ModelCapabilities[]> => {
    const models = await ctx.db
      .query("models")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const capabilities: ModelCapabilities[] = [];

    for (const model of models) {
      // Get parameter info
      const params = await ctx.db
        .query("modelParameters")
        .withIndex("by_model_id", (q) => q.eq("modelId", model.modelId))
        .first();

      if (!params) continue;

      // Extract durations
      const supportedDurations = params.parameterDefinitions.duration
        ?.allowedValues || [5];
      const defaultDuration = supportedDurations[0];

      // Check for resolution options
      const resolutionDef = params.parameterDefinitions.resolution;
      const hasResolutionOptions = !!resolutionDef;
      const resolutionOptions = resolutionDef?.allowedValues;
      const defaultResolution = resolutionDef?.defaultValue;

      // Check for aspect ratio options
      const aspectRatioDef = params.parameterDefinitions.aspectRatio;
      const hasAspectRatioOptions = !!aspectRatioDef;
      const aspectRatioOptions = aspectRatioDef?.allowedValues;
      const defaultAspectRatio = aspectRatioDef?.defaultValue;

      capabilities.push({
        modelId: model.modelId,
        tierName: model.name, // "Budget Tier", "Quality Tier", "Pro Tier"
        supportedDurations,
        hasResolutionOptions,
        resolutionOptions,
        hasAspectRatioOptions,
        aspectRatioOptions,
        defaultDuration,
        defaultResolution,
        defaultAspectRatio,
      });
    }

    return capabilities.sort((a, b) => {
      // Sort by tier: Budget, Quality, Pro
      const tierOrder = { "Budget Tier": 1, "Quality Tier": 2, "Pro Tier": 3 };
      return (
        (tierOrder[a.tierName as keyof typeof tierOrder] || 99) -
        (tierOrder[b.tierName as keyof typeof tierOrder] || 99)
      );
    });
  },
});

/**
 * Simple parameter mapping for API calls
 */
export function mapToApiParameters(
  modelId: string,
  frontendParams: {
    prompt: string;
    duration: number;
    resolution?: string;
    aspectRatio?: string;
  },
  modelTier: "budget" | "quality" | "pro"
): any {
  // Base parameters that all models need
  const apiParams: any = {
    prompt: frontendParams.prompt,
  };

  // Model-specific mapping based on explicit model tier
  if (modelTier === "budget") {
    // Budget tier (Hailuo)
    apiParams.duration = frontendParams.duration;
    if (frontendParams.resolution) {
      apiParams.resolution = frontendParams.resolution;
    }
  } else if (modelTier === "quality") {
    // Quality tier (Kling)
    apiParams.duration = frontendParams.duration;
    if (frontendParams.aspectRatio) {
      apiParams.aspect_ratio = frontendParams.aspectRatio;
    }
  } else if (modelTier === "pro") {
    // Pro tier (Google Veo) - fixed 8s duration
    if (frontendParams.resolution) {
      apiParams.resolution = frontendParams.resolution;
    }
    // Add random seed for variation
    apiParams.seed = Math.floor(Math.random() * 1000000);
  }

  return apiParams;
}

/**
 * Simple validation
 */
export function validateParameters(
  modelTier: "budget" | "quality" | "pro",
  params: { duration: number; resolution?: string; aspectRatio?: string }
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Duration validation based on explicit model tier
  if (modelTier === "budget") {
    if (![6, 10].includes(params.duration)) {
      errors.push("Budget tier supports 6s or 10s videos");
    }
  } else if (modelTier === "quality") {
    if (![5, 10].includes(params.duration)) {
      errors.push("Quality tier supports 5s or 10s videos");
    }
  } else if (modelTier === "pro") {
    if (params.duration !== 8) {
      errors.push("Pro tier only supports 8s videos");
    }
  }

  // Aspect ratio validation
  if (params.aspectRatio && modelTier === "quality") {
    if (!["16:9", "9:16", "1:1"].includes(params.aspectRatio)) {
      errors.push("Invalid aspect ratio for Quality tier");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
