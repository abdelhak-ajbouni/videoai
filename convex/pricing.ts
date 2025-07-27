import { v } from "convex/values";
import { query } from "./_generated/server";

// Helper function to calculate credit cost based on Replicate pricing
function calculateCreditCost(
  model: "google/veo-3" | "luma/ray-2-720p",
  quality: "standard" | "high" | "ultra",
  duration: "5" | "8" | "9"
): number {
  // Model-specific pricing (cost per second in USD)
  const modelPricing = {
    "google/veo-3": {
      costPerSecond: 0.75, // $0.75 per second
      name: "Google Veo-3",
      description: "High-quality video generation",
      fixedDuration: 8, // Google Veo-3 has fixed 8-second duration
    },
    "luma/ray-2-720p": {
      costPerSecond: 0.18, // $0.18 per second
      name: "Luma Ray-2-720p",
      description: "Fast, cost-effective video generation",
      supportedDurations: [5, 9], // Only supports 5s and 9s
    },
  };

  // Business configuration
  const config = {
    profitMargin: 1.32, // 32% markup
    creditsPerDollar: 50, // $0.02 per credit
    qualityMultipliers: {
      standard: 1.0,
      high: 1.2, // 20% premium for high quality
      ultra: 1.5, // 50% premium for ultra quality
    },
  };

  const durationInSeconds = parseInt(duration);
  const modelCost = modelPricing[model];

  // Calculate base cost
  const baseCostUSD = modelCost.costPerSecond * durationInSeconds;

  // Apply quality multiplier and profit margin
  const totalCostUSD =
    baseCostUSD * config.qualityMultipliers[quality] * config.profitMargin;

  // Convert to credits
  const credits = Math.ceil(totalCostUSD * config.creditsPerDollar);

  return credits;
}

// Convex query to calculate credit cost
export const getCreditCost = query({
  args: {
    model: v.union(v.literal("google/veo-3"), v.literal("luma/ray-2-720p")),
    quality: v.union(
      v.literal("standard"),
      v.literal("high"),
      v.literal("ultra")
    ),
    duration: v.union(v.literal("5"), v.literal("8"), v.literal("9")),
  },
  handler: async (ctx, args) => {
    return calculateCreditCost(args.model, args.quality, args.duration);
  },
});

// Convex query to get pricing matrix for all combinations
export const getPricingMatrix = query({
  args: {},
  handler: async (ctx) => {
    const models = ["google/veo-3", "luma/ray-2-720p"] as const;
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
            matrix[model][quality][duration] = calculateCreditCost(
              model,
              quality,
              duration
            );
          } else if (
            model === "luma/ray-2-720p" &&
            (duration === "5" || duration === "9")
          ) {
            matrix[model][quality][duration] = calculateCreditCost(
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
    };
  },
});

// Export the helper function for use in other Convex files
export { calculateCreditCost };
