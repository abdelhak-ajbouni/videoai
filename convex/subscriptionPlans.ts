import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    priceId: v.string(),
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
    priceId: v.optional(v.string()),
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

// Initialize default subscription plans
export const initializeDefaultPlans = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const defaultPlans = [
      {
        planId: "starter",
        name: "Starter",
        description: "Perfect for getting started with video generation",
        priceId: process.env.STRIPE_STARTER_PRICE_ID!,
        price: 999, // $9.99
        currency: "usd",
        monthlyCredits: 100,
        features: [
          "100 credits per month",
          "HD video quality",
          "Standard support",
          "Personal video library",
        ],
        isActive: true,
        isPopular: false,
      },
      {
        planId: "pro",
        name: "Pro",
        description: "For creators who need more power and features",
        priceId: process.env.STRIPE_PRO_PRICE_ID!,
        price: 2999, // $29.99
        currency: "usd",
        monthlyCredits: 500,
        features: [
          "500 credits per month",
          "HD + Ultra video quality",
          "Priority processing",
          "Advanced analytics",
          "Priority support",
        ],
        isActive: true,
        isPopular: true,
      },
      {
        planId: "business",
        name: "Business",
        description: "Enterprise-grade features for teams and businesses",
        priceId: process.env.STRIPE_BUSINESS_PRICE_ID!,
        price: 9999, // $99.99
        currency: "usd",
        monthlyCredits: 2000,
        features: [
          "2000 credits per month",
          "4K video quality",
          "API access",
          "Team management",
          "Dedicated support",
          "Custom integrations",
        ],
        isActive: true,
        isPopular: false,
      },
    ];

    const planIds = [];

    for (const plan of defaultPlans) {
      // Check if plan already exists
      const existingPlan = await ctx.db
        .query("subscriptionPlans")
        .withIndex("by_plan_id", (q) => q.eq("planId", plan.planId))
        .first();

      if (!existingPlan) {
        const planId = await ctx.db.insert("subscriptionPlans", {
          ...plan,
          createdAt: now,
          updatedAt: now,
        });
        planIds.push(planId);
      }
    }

    return planIds;
  },
});
