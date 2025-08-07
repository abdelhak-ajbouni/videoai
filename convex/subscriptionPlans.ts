import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Get all active subscription plans
export const getActivePlans = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .collect();
  },
});

// Get a specific subscription plan by ID
export const getPlanById = query({
  args: { planId: v.string() },
  handler: async (ctx, { planId }) => {
    return await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_plan_id", (q) => q.eq("planId", planId))
      .first();
  },
});

// Create a new subscription plan
export const createPlan = mutation({
  args: {
    planId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    currency: v.string(),
    monthlyCredits: v.number(),
    features: v.array(v.string()),
    isActive: v.boolean(),
    isPopular: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("subscriptionPlans", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a subscription plan
export const updatePlan = mutation({
  args: {
    planId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    monthlyCredits: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    isPopular: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { planId, ...updates } = args;

    const plan = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_plan_id", (q) => q.eq("planId", planId))
      .first();

    if (!plan) {
      throw new Error("Plan not found");
    }

    await ctx.db.patch(plan._id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return plan._id;
  },
});

// Delete a subscription plan
export const deletePlan = mutation({
  args: { planId: v.string() },
  handler: async (ctx, { planId }) => {
    const plan = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_plan_id", (q) => q.eq("planId", planId))
      .first();

    if (!plan) {
      throw new Error("Plan not found");
    }

    await ctx.db.delete(plan._id);
    return plan._id;
  },
});

// Create Stripe products and prices for subscription plans
export const createStripeProducts = action({
  args: {},
  handler: async (
    ctx
  ): Promise<
    Array<{
      planId: string;
      name: string;
      priceId?: string;
      productId?: string;
      status: string;
      error?: string;
    }>
  > => {
    const { getSecureConfig } = await import("../lib/env");
    const stripe = new (await import("stripe")).default(
      getSecureConfig().stripe.secretKey
    );

    // Get all active subscription plans
    const plans = await ctx.runQuery(api.subscriptionPlans.getActivePlans);
    const results: Array<{
      planId: string;
      name: string;
      priceId?: string;
      productId?: string;
      status: string;
      error?: string;
    }> = [];

    for (const plan of plans) {
      try {
        // Create or get product
        let product;
        const existingProducts = await stripe.products.list({
          limit: 100,
        });

        const existingProduct = existingProducts.data.find(
          (p) => p.name === `${plan.monthlyCredits} Credits - ${plan.name} Plan`
        );

        if (existingProduct) {
          product = existingProduct;
        } else {
          product = await stripe.products.create({
            name: `${plan.monthlyCredits} Credits - ${plan.name} Plan`,
            description:
              plan.description ||
              `Monthly subscription for ${plan.monthlyCredits} credits`,
          });
        }

        // Create or get price
        let price;
        const existingPrices = await stripe.prices.list({
          product: product.id,
          limit: 100,
        });

        const existingPrice = existingPrices.data.find(
          (p) =>
            p.unit_amount === plan.price && p.recurring?.interval === "month"
        );

        if (existingPrice) {
          price = existingPrice;
        } else {
          price = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.price,
            currency: plan.currency,
            recurring: {
              interval: "month",
            },
          });
        }

        // Note: We no longer store priceId in the database
        // Stripe prices are created/retrieved dynamically

        results.push({
          planId: plan.planId,
          name: plan.name,
          priceId: price.id,
          productId: product.id,
          status: "success",
        });
      } catch (error) {
        console.error(`Error creating Stripe product for ${plan.name}:`, error);
        results.push({
          planId: plan.planId,
          name: plan.name,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  },
});

// Get or create Stripe price for a plan dynamically
export const getOrCreateStripePrice = action({
  args: { planId: v.string() },
  handler: async (ctx, { planId }): Promise<string> => {
    const { getSecureConfig } = await import("../lib/env");
    const stripe = new (await import("stripe")).default(
      getSecureConfig().stripe.secretKey
    );

    // Get plan from database
    const plan = await ctx.runQuery(api.subscriptionPlans.getPlanById, {
      planId,
    });
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    // Create or get product
    let product;
    const existingProducts = await stripe.products.list({ limit: 100 });
    const existingProduct = existingProducts.data.find(
      (p) => p.name === `${plan.monthlyCredits} Credits - ${plan.name} Plan`
    );

    if (existingProduct) {
      product = existingProduct;
    } else {
      product = await stripe.products.create({
        name: `${plan.monthlyCredits} Credits - ${plan.name} Plan`,
        description:
          plan.description ||
          `Monthly subscription for ${plan.monthlyCredits} credits`,
      });
    }

    // Create or get price
    let price;
    const existingPrices = await stripe.prices.list({
      product: product.id,
      limit: 100,
    });

    const existingPrice = existingPrices.data.find(
      (p) => p.unit_amount === plan.price && p.recurring?.interval === "month"
    );

    if (existingPrice) {
      price = existingPrice;
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: plan.currency,
        recurring: {
          interval: "month",
        },
      });
    }

    return price.id;
  },
});
