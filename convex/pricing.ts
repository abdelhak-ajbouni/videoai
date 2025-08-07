import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";

// Security and business limits
const PRICING_LIMITS = {
  MAX_CREDITS_PER_VIDEO: 5000, // Maximum credits per single video generation
  MAX_DURATION_SECONDS: 120, // 2 minutes maximum duration (was configurable)
  MIN_DURATION_SECONDS: 1, // 1 second minimum duration
  MAX_COST_PER_SECOND: 5.0, // Maximum USD cost per second
} as const;

// Simple credit conversion rate based on average package pricing
const CREDITS_PER_USD = 85; // Approximately 85 credits per USD (includes profit margin)

// Validation functions for pricing integrity
function validatePricingInputs(
  modelId: string,
  duration: number,
  resolution?: string
) {
  if (!modelId || typeof modelId !== "string" || modelId.trim() === "") {
    throw new Error("Invalid model ID provided");
  }

  if (
    !duration ||
    typeof duration !== "number" ||
    duration < PRICING_LIMITS.MIN_DURATION_SECONDS
  ) {
    throw new Error(
      `Duration must be at least ${PRICING_LIMITS.MIN_DURATION_SECONDS} second(s)`
    );
  }

  if (duration > PRICING_LIMITS.MAX_DURATION_SECONDS) {
    throw new Error(
      `Duration cannot exceed ${PRICING_LIMITS.MAX_DURATION_SECONDS} seconds`
    );
  }

  if (resolution && typeof resolution !== "string") {
    throw new Error("Invalid resolution format");
  }
}


function validateCostPerSecond(costPerSecond: number) {
  if (costPerSecond < 0 || costPerSecond > PRICING_LIMITS.MAX_COST_PER_SECOND) {
    throw new Error(
      `Cost per second must be between $0 and $${PRICING_LIMITS.MAX_COST_PER_SECOND}`
    );
  }
}

// Helper function to calculate credit cost based on model and model costs
async function calculateCreditCost(
  ctx: QueryCtx,
  modelId: string,
  duration: number,
  resolution?: string
): Promise<number> {
  // Validate inputs for security and business constraints
  validatePricingInputs(modelId, duration, resolution);

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

  if (!resolution) {
    throw new Error("Resolution is required");
  }

  // Get model cost for specific resolution
  const resolutionCost = await ctx.db
    .query("modelCosts")
    .withIndex("by_model_and_resolution", (q) =>
      q.eq("modelId", modelId).eq("resolution", resolution)
    )
    .first();

  if (!resolutionCost || !resolutionCost.isActive) {
    throw new Error(
      `No pricing information found for model "${modelId}" with resolution "${resolution}". Please contact support.`
    );
  }

  // Validate cost per second to prevent pricing manipulation
  validateCostPerSecond(resolutionCost.costPerSecond);

  // Calculate total USD cost
  const totalCostUSD = resolutionCost.costPerSecond * duration;

  // Convert directly to credits using our conversion rate
  const credits = Math.ceil(totalCostUSD * CREDITS_PER_USD);

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
    if (!args.modelId || args.modelId.trim() === "") {
      throw new Error("Invalid model ID provided");
    }

    if (!args.resolution || args.resolution.trim() === "") {
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
