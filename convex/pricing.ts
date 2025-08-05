import { v } from "convex/values";
import { query, QueryCtx } from "./_generated/server";

// Helper function to calculate credit cost based on model and configuration
async function calculateCreditCost(
  ctx: QueryCtx,
  modelId: string,
  duration: number
): Promise<number> {
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

  // Calculate base cost
  const baseCostUSD = model.costPerSecond * duration;

  // Apply quality multiplier and profit margin
  const totalCostUSD =
    baseCostUSD *
    businessConfig.profitMargin;

  // Convert to credits
  const credits = Math.ceil(totalCostUSD * businessConfig.creditsPerDollar);

  return credits;
}

// Convex query to calculate credit cost
export const getCreditCost = query({
  args: {
    modelId: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    // Return 0 if modelId is empty or undefined
    if (!args.modelId || args.modelId.trim() === "") {
      return 0;
    }

    return await calculateCreditCost(
      ctx,
      args.modelId,
      args.duration
    );
  },
});

export { calculateCreditCost };
