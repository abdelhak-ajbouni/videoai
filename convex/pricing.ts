import { v } from "convex/values";
import { query } from "./_generated/server";

// Helper function to calculate credit cost based on configuration
async function calculateCreditCost(
  ctx: any,
  model: "google/veo-3" | "luma/ray-2-720p" | "luma/ray-flash-2-540p",
  quality: "standard" | "high" | "ultra",
  duration: "5" | "8" | "9"
): Promise<number> {
  // Get business configuration from database
  const profitMargin = await ctx.db
    .query("configurations")
    .withIndex("by_key", (q: any) => q.eq("key", "profit_margin"))
    .first();

  const creditsPerDollar = await ctx.db
    .query("configurations")
    .withIndex("by_key", (q: any) => q.eq("key", "credits_per_dollar"))
    .first();

  const qualityMultipliers = await ctx.db
    .query("configurations")
    .withIndex("by_key", (q: any) => q.eq("key", "quality_multipliers"))
    .first();

  const modelConfigs = await ctx.db
    .query("configurations")
    .withIndex("by_key", (q: any) => q.eq("key", "model_configs"))
    .first();

  // Use default values if configurations not found
  const businessConfig = {
    profitMargin: (profitMargin?.value as number) || 1.32,
    creditsPerDollar: (creditsPerDollar?.value as number) || 50,
    qualityMultipliers: (qualityMultipliers?.value as Record<
      string,
      number
    >) || {
      standard: 1.0,
      high: 1.2,
      ultra: 1.5,
    },
  };

  const allModelConfigs = (modelConfigs?.value as Record<string, any>) || {
    "google/veo-3": {
      costPerSecond: 0.75,
    },
    "luma/ray-2-720p": {
      costPerSecond: 0.18,
    },
    "luma/ray-flash-2-540p": {
      costPerSecond: 0.12,
    },
  };

  const durationInSeconds = parseInt(duration);
  const modelConfig = allModelConfigs[model];

  if (!modelConfig) {
    throw new Error(`Model configuration not found for ${model}`);
  }

  // Calculate base cost
  const baseCostUSD = modelConfig.costPerSecond * durationInSeconds;

  // Apply quality multiplier and profit margin
  const totalCostUSD =
    baseCostUSD *
    businessConfig.qualityMultipliers[quality] *
    businessConfig.profitMargin;

  // Convert to credits
  const credits = Math.ceil(totalCostUSD * businessConfig.creditsPerDollar);

  return credits;
}

// Convex query to calculate credit cost
export const getCreditCost = query({
  args: {
    model: v.union(
      v.literal("google/veo-3"),
      v.literal("luma/ray-2-720p"),
      v.literal("luma/ray-flash-2-540p")
    ),
    quality: v.union(
      v.literal("standard"),
      v.literal("high"),
      v.literal("ultra")
    ),
    duration: v.union(v.literal("5"), v.literal("8"), v.literal("9")),
  },
  handler: async (ctx, args) => {
    return await calculateCreditCost(
      ctx,
      args.model,
      args.quality,
      args.duration
    );
  },
});

// Convex query to get pricing matrix for all combinations
export const getPricingMatrix = query({
  args: {},
  handler: async (ctx) => {
    const models = [
      "google/veo-3",
      "luma/ray-2-720p",
      "luma/ray-flash-2-540p",
    ] as const;
    const qualities = ["standard", "high", "ultra"] as const;
    const durations = ["5", "8", "9"] as const;

    const matrix: Record<string, Record<string, Record<string, number>>> = {};

    for (const model of models) {
      matrix[model] = {};
      for (const quality of qualities) {
        matrix[model][quality] = {};
        for (const duration of durations) {
          // Only calculate for valid combinations
          if (model === "google/veo-3" && duration === "8") {
            matrix[model][quality][duration] = await calculateCreditCost(
              ctx,
              model,
              quality,
              duration
            );
          } else if (
            (model === "luma/ray-2-720p" ||
              model === "luma/ray-flash-2-540p") &&
            (duration === "5" || duration === "9")
          ) {
            matrix[model][quality][duration] = await calculateCreditCost(
              ctx,
              model,
              quality,
              duration
            );
          }
        }
      }
    }

    return matrix;
  },
});

// Convex query to get model information
export const getModelInfo = query({
  args: {},
  handler: async (ctx) => {
    const modelConfigs = await ctx.db
      .query("configurations")
      .withIndex("by_key", (q: any) => q.eq("key", "model_configs"))
      .first();

    if (
      !modelConfigs ||
      !modelConfigs.value ||
      typeof modelConfigs.value !== "object"
    ) {
      // Return default model configurations if not found in database
      return {
        "google/veo-3": {
          name: "Google Veo-3",
          description: "High-quality video generation",
          costPerSecond: 0.75,
          fixedDuration: 8,
          supportedDurations: [8],
          isPremium: true,
        },
        "luma/ray-2-720p": {
          name: "Luma Ray-2-720p",
          description: "Fast, cost-effective video generation",
          costPerSecond: 0.18,
          supportedDurations: [5, 9],
          isPremium: false,
        },
        "luma/ray-flash-2-540p": {
          name: "Luma Ray Flash 2-540p",
          description: "Ultra-fast, ultra-cheap video generation",
          costPerSecond: 0.12,
          supportedDurations: [5, 9],
          isPremium: false,
          isDefault: true,
        },
      };
    }

    return modelConfigs.value as Record<string, any>;
  },
});

// Export the helper function for use in other Convex files
export { calculateCreditCost };
