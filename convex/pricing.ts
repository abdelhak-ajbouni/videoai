import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";

// Security and business limits
const PRICING_LIMITS = {
  MAX_CREDITS_PER_VIDEO: 5000, // Maximum credits per single video generation
  MAX_DURATION_SECONDS: 300, // 5 minutes maximum duration
  MIN_DURATION_SECONDS: 1, // 1 second minimum duration
  MAX_COST_PER_SECOND: 5.0, // Maximum USD cost per second
  MIN_PROFIT_MARGIN: 1.1, // Minimum 10% profit margin
  MAX_PROFIT_MARGIN: 5.0, // Maximum 400% markup
  MIN_CREDITS_PER_DOLLAR: 10, // Minimum credits per dollar
  MAX_CREDITS_PER_DOLLAR: 200, // Maximum credits per dollar
} as const;

// Validation functions for pricing integrity
function validatePricingInputs(modelId: string, duration: number, resolution?: string) {
  if (!modelId || typeof modelId !== 'string' || modelId.trim() === '') {
    throw new Error("Invalid model ID provided");
  }

  if (!duration || typeof duration !== 'number' || duration < PRICING_LIMITS.MIN_DURATION_SECONDS) {
    throw new Error(`Duration must be at least ${PRICING_LIMITS.MIN_DURATION_SECONDS} second(s)`);
  }

  if (duration > PRICING_LIMITS.MAX_DURATION_SECONDS) {
    throw new Error(`Duration cannot exceed ${PRICING_LIMITS.MAX_DURATION_SECONDS} seconds`);
  }

  if (resolution && typeof resolution !== 'string') {
    throw new Error("Invalid resolution format");
  }
}

function validateBusinessConfig(profitMargin: number, creditsPerDollar: number) {
  if (profitMargin < PRICING_LIMITS.MIN_PROFIT_MARGIN || profitMargin > PRICING_LIMITS.MAX_PROFIT_MARGIN) {
    throw new Error(`Profit margin must be between ${PRICING_LIMITS.MIN_PROFIT_MARGIN} and ${PRICING_LIMITS.MAX_PROFIT_MARGIN}`);
  }

  if (creditsPerDollar < PRICING_LIMITS.MIN_CREDITS_PER_DOLLAR || creditsPerDollar > PRICING_LIMITS.MAX_CREDITS_PER_DOLLAR) {
    throw new Error(`Credits per dollar must be between ${PRICING_LIMITS.MIN_CREDITS_PER_DOLLAR} and ${PRICING_LIMITS.MAX_CREDITS_PER_DOLLAR}`);
  }
}

function validateCostPerSecond(costPerSecond: number) {
  if (costPerSecond < 0 || costPerSecond > PRICING_LIMITS.MAX_COST_PER_SECOND) {
    throw new Error(`Cost per second must be between $0 and $${PRICING_LIMITS.MAX_COST_PER_SECOND}`);
  }
}

// Helper function to calculate credit cost based on model and configuration
async function calculateCreditCost(
  ctx: QueryCtx,
  modelId: string,
  duration: number,
  resolution?: string
): Promise<number> {
  // Validate inputs for security and business constraints
  validatePricingInputs(modelId, duration, resolution);

  // Get business configuration from database
  const profitMargin = await ctx.db
    .query("configurations")
    .withIndex("by_key", (q) => q.eq("key", "profit_margin"))
    .first();

  const creditsPerDollar = await ctx.db
    .query("configurations")
    .withIndex("by_key", (q) => q.eq("key", "credits_per_dollar"))
    .first();

  // Get model from models table
  const model = await ctx.db
    .query("models")
    .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
    .first();

  if (!model || !model.isActive) {
    throw new Error(
      `Model "${modelId}" not found or inactive. Please select a valid model.`
    );
  }

  // Use default values if configurations not found
  const businessConfig = {
    profitMargin: (profitMargin?.value as number) || 1.32,
    creditsPerDollar: (creditsPerDollar?.value as number) || 50,
  };

  // Validate business configuration to prevent manipulation
  validateBusinessConfig(businessConfig.profitMargin, businessConfig.creditsPerDollar);

  let costPerSecond = 0;

  if (resolution) {
    // First try to get the specific resolution cost
    const resolutionCost = await ctx.db
      .query("modelCosts")
      .withIndex("by_model_and_resolution", (q) =>
        q.eq("modelId", modelId).eq("resolution", resolution)
      )
      .first();

    if (resolutionCost && resolutionCost.isActive) {
      costPerSecond = resolutionCost.costPerSecond;
    } else {
      // Fallback: get any available cost for this model and apply resolution multiplier
      const defaultCost = await ctx.db
        .query("modelCosts")
        .withIndex("by_model_and_resolution", (q) => q.eq("modelId", modelId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();

      if (!defaultCost) {
        throw new Error(
          `No pricing information found for model "${modelId}". Please contact support.`
        );
      }

      // Apply resolution multipliers if no specific cost found
      const resolutionMultipliers = await ctx.db
        .query("configurations")
        .withIndex("by_key", (q) => q.eq("key", "resolution_multipliers"))
        .first();

      const resolutionMultipliersConfig = resolutionMultipliers?.value;

      if (!resolutionMultipliersConfig || !resolutionMultipliersConfig[resolution]) {
        throw new Error(
          `No pricing information found for model "${modelId}" with resolution "${resolution}". Please contact support.`
        );
      }

      const multiplier = resolutionMultipliersConfig[resolution];
      costPerSecond = defaultCost.costPerSecond * multiplier;
    }
  }

  // Validate cost per second to prevent pricing manipulation
  validateCostPerSecond(costPerSecond);

  // Calculate base cost
  const baseCostUSD = costPerSecond * duration;

  // Apply profit margin
  const totalCostUSD = baseCostUSD * businessConfig.profitMargin;

  // Convert to credits
  const credits = Math.ceil(totalCostUSD * businessConfig.creditsPerDollar);

  // Final security check: prevent excessive credit costs
  if (credits > PRICING_LIMITS.MAX_CREDITS_PER_VIDEO) {
    throw new Error(
      `Credit cost too high (${credits} credits). Maximum allowed: ${PRICING_LIMITS.MAX_CREDITS_PER_VIDEO} credits per video. ` +
      `Please reduce duration or choose a different model/resolution.`
    );
  }

  // Ensure non-negative result
  if (credits < 0) {
    throw new Error("Invalid credit calculation result");
  }

  return credits;
}

// Convex query to calculate credit cost
export const getCreditCost = query({
  args: {
    modelId: v.string(),
    duration: v.number(),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Return 0 if modelId is empty or undefined
    if (!args.modelId || args.modelId.trim() === "") {
      return 0;
    }

    return await calculateCreditCost(
      ctx,
      args.modelId,
      args.duration,
      args.resolution
    );
  },
});

export { calculateCreditCost, PRICING_LIMITS };


// Mutation to add or update resolution cost for a model
export const updateModelResolutionCost = mutation({
  args: {
    modelId: v.string(),
    resolution: v.string(),
    costPerSecond: v.number(),
    isActive: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate inputs for security
    if (!args.modelId || args.modelId.trim() === '') {
      throw new Error("Invalid model ID provided");
    }

    if (!args.resolution || args.resolution.trim() === '') {
      throw new Error("Invalid resolution provided");
    }

    // Validate cost per second
    validateCostPerSecond(args.costPerSecond);

    // Additional validation for notes length
    if (args.notes && args.notes.length > 500) {
      throw new Error("Notes cannot exceed 500 characters");
    }
    // Check if resolution cost already exists
    const existing = await ctx.db
      .query("modelCosts")
      .withIndex("by_model_and_resolution", (q) =>
        q.eq("modelId", args.modelId).eq("resolution", args.resolution)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        costPerSecond: args.costPerSecond,
        isActive: args.isActive,
        notes: args.notes,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new record
      return await ctx.db.insert("modelCosts", {
        modelId: args.modelId,
        resolution: args.resolution,
        costPerSecond: args.costPerSecond,
        isActive: args.isActive,
        notes: args.notes,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
