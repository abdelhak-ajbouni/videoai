import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Get user's current subscription
export const getSubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
  },
});

// Get all subscriptions for a user (including inactive)
export const getAllSubscriptions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Create new subscription
export const createSubscription = mutation({
  args: {
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
    planId: v.union(
      v.literal("starter"),
      v.literal("pro"),
      v.literal("business")
    ),
  },
  handler: async (ctx, { userId, stripeSubscriptionId, planId }) => {
    // Get plan from database
    const plan = await ctx.runQuery(api.subscriptionPlans.getPlanById, {
      planId,
    });
    if (!plan) {
      throw new Error(`Subscription plan not found: ${planId}`);
    }

    // Get Stripe subscription details
    const stripe = new (await import("stripe")).default(
      process.env.STRIPE_SECRET_KEY!
    );
    const subscription =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);

    // Create subscription record
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId,
      stripeSubscriptionId,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      tier: planId,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start * 1000,
      currentPeriodEnd: subscription.current_period_end * 1000,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      monthlyCredits: plan.monthlyCredits,
      creditsGrantedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update user's subscription tier
    await ctx.db.patch(userId, {
      subscriptionTier: planId,
      subscriptionStatus: subscription.status,
      stripeSubscriptionId,
      subscriptionStartDate: subscription.current_period_start * 1000,
      subscriptionEndDate: subscription.current_period_end * 1000,
    });

    // Grant initial monthly credits
    await ctx.runMutation(api.credits.grantSubscriptionCredits, {
      userId,
      amount: plan.monthlyCredits,
      description: `Monthly credits for ${planId} subscription`,
      subscriptionId: subscriptionId,
    });

    return subscriptionId;
  },
});

// Update subscription status
export const updateSubscription = mutation({
  args: {
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("incomplete"),
      v.literal("incomplete_expired"),
      v.literal("unpaid")
    ),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (
    ctx,
    { userId, stripeSubscriptionId, status, cancelAtPeriodEnd }
  ) => {
    // Update subscription record
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription_id", (q) =>
        q.eq("stripeSubscriptionId", stripeSubscriptionId)
      )
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        status,
        cancelAtPeriodEnd,
        updatedAt: Date.now(),
      });
    }

    // Update user's subscription status
    await ctx.db.patch(userId, {
      subscriptionStatus: status,
    });

    return subscription?._id;
  },
});

// Cancel subscription
export const cancelSubscription = mutation({
  args: {
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, { userId, stripeSubscriptionId }) => {
    // Update subscription record
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription_id", (q) =>
        q.eq("stripeSubscriptionId", stripeSubscriptionId)
      )
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        status: "canceled",
        cancelAtPeriodEnd: true,
        canceledAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Update user's subscription status
    await ctx.db.patch(userId, {
      subscriptionStatus: "canceled",
    });

    return subscription?._id;
  },
});

// Allocate monthly credits for subscription
export const allocateMonthlyCredits = mutation({
  args: {
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, { userId, stripeSubscriptionId }) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription_id", (q) =>
        q.eq("stripeSubscriptionId", stripeSubscriptionId)
      )
      .first();

    if (!subscription || subscription.status !== "active") {
      throw new Error("No active subscription found");
    }

    // Check if credits were already granted this period
    const now = Date.now();
    if (
      subscription.creditsGrantedAt &&
      subscription.creditsGrantedAt > subscription.currentPeriodStart
    ) {
      console.log("Credits already granted for this period");
      return;
    }

    // Grant monthly credits
    await ctx.runMutation(api.credits.grantSubscriptionCredits, {
      userId,
      amount: subscription.monthlyCredits,
      description: `Monthly credits for ${subscription.tier} subscription`,
      subscriptionId: subscription._id,
    });

    // Update subscription record
    await ctx.db.patch(subscription._id, {
      creditsGrantedAt: now,
      updatedAt: now,
    });
  },
});

// Get subscription usage statistics
export const getSubscriptionStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!subscription) {
      return {
        hasActiveSubscription: false,
        tier: null,
        monthlyCredits: 0,
        creditsUsedThisPeriod: 0,
        creditsRemaining: 0,
        nextBillingDate: null,
        cancelAtPeriodEnd: false,
      };
    }

    // Calculate credits used this period
    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), periodStart),
          q.lte(q.field("createdAt"), periodEnd),
          q.eq(q.field("type"), "video_generation")
        )
      )
      .collect();

    const creditsUsedThisPeriod = transactions.reduce(
      (total, tx) => total + Math.abs(tx.amount),
      0
    );

    return {
      hasActiveSubscription: true,
      tier: subscription.tier,
      monthlyCredits: subscription.monthlyCredits,
      creditsUsedThisPeriod,
      creditsRemaining: subscription.monthlyCredits - creditsUsedThisPeriod,
      nextBillingDate: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  },
});

// Get subscription history
export const getSubscriptionHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});
