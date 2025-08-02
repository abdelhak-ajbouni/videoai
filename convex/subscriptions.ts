import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import {
  validateSubscription,
  throwValidationError,
  logValidationWarnings,
  sanitizeString,
} from "./lib/validation";

// Get user's current subscription
export const getSubscription = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
  },
});

// Get subscription by Stripe customer ID
export const getSubscriptionByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer_id", (q) =>
        q.eq("stripeCustomerId", stripeCustomerId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
  },
});

// Get all subscriptions for a user (including inactive)
export const getAllSubscriptions = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .order("desc")
      .collect();
  },
});

// Create new subscription (called from webhook)
export const createSubscription = mutation({
  args: {
    clerkId: v.string(),
    stripeSubscriptionId: v.string(),
    planId: v.union(v.literal("starter"), v.literal("pro"), v.literal("max")),
    stripeCustomerId: v.string(),
    stripePriceId: v.string(),
    subscriptionStatus: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (
    ctx,
    {
      clerkId,
      stripeSubscriptionId,
      planId,
      stripeCustomerId,
      stripePriceId,
      subscriptionStatus,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    }
  ) => {
    // ============================================================================
    // INPUT VALIDATION
    // ============================================================================

    const sanitizedArgs = {
      clerkId: sanitizeString(clerkId, 100),
      planId,
      stripeCustomerId: sanitizeString(stripeCustomerId, 100),
      stripeSubscriptionId: sanitizeString(stripeSubscriptionId, 100),
    };

    // Validate subscription parameters
    const validation = validateSubscription(sanitizedArgs);
    if (!validation.isValid) {
      throwValidationError(validation.errors, "Subscription validation failed");
    }

    // Log warnings if any
    logValidationWarnings(validation.warnings || [], "Subscription creation");

    // Validate date ranges
    if (currentPeriodStart >= currentPeriodEnd) {
      throw new Error("Invalid period: start must be before end");
    }

    // Validate subscription status
    const validStatuses = [
      "active",
      "canceled",
      "past_due",
      "trialing",
      "incomplete",
      "incomplete_expired",
      "unpaid",
    ];
    if (!validStatuses.includes(subscriptionStatus)) {
      throw new Error(`Invalid subscription status: ${subscriptionStatus}`);
    }

    // ============================================================================
    // PLAN VALIDATION
    // ============================================================================

    // Get plan from database - inline to avoid circular dependency
    const plan = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_plan_id", (q) => q.eq("planId", planId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    if (!plan) {
      throw new Error(`Subscription plan not found: ${planId}`);
    }

    // Create subscription record
    const subscriptionId = await ctx.db.insert("subscriptions", {
      clerkId,
      stripeSubscriptionId,
      stripeCustomerId,
      stripePriceId,
      tier: planId,
      status: subscriptionStatus as
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid",
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      monthlyCredits: plan.monthlyCredits,
      creditsGrantedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Map Stripe status to user schema status
    let userStatus:
      | "active"
      | "canceled"
      | "past_due"
      | "trialing"
      | "inactive";
    switch (subscriptionStatus) {
      case "active":
      case "trialing":
        userStatus = subscriptionStatus;
        break;
      case "canceled":
      case "past_due":
        userStatus = subscriptionStatus;
        break;
      case "incomplete":
      case "incomplete_expired":
      case "unpaid":
        userStatus = "inactive";
        break;
      default:
        userStatus = "inactive";
    }

    // Note: User subscription tier is now managed via subscriptions table only
    // No need to update user profile with subscription details

    // Grant initial monthly credits - inline to avoid circular dependency
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const balanceBefore = profile.credits;
    const balanceAfter = balanceBefore + plan.monthlyCredits;

    // Update user's credit balance
    await ctx.db.patch(profile._id, {
      credits: balanceAfter,
      updatedAt: Date.now(),
    });

    // Create credit transaction record
    await ctx.db.insert("creditTransactions", {
      clerkId,
      type: "subscription_grant",
      amount: plan.monthlyCredits,
      description: `Monthly credits for ${planId} subscription`,
      subscriptionId: subscriptionId,
      balanceBefore,
      balanceAfter,
      createdAt: Date.now(),
    });

    return subscriptionId;
  },
});

// Update subscription status
export const updateSubscription = mutation({
  args: {
    clerkId: v.string(),
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
    { clerkId, stripeSubscriptionId, status, cancelAtPeriodEnd }
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

    // Update user's subscription status (map Stripe status to user schema status)
    let userStatus:
      | "active"
      | "canceled"
      | "past_due"
      | "trialing"
      | "inactive";
    switch (status) {
      case "active":
      case "trialing":
        userStatus = status;
        break;
      case "canceled":
      case "past_due":
        userStatus = status;
        break;
      case "incomplete":
      case "incomplete_expired":
      case "unpaid":
        userStatus = "inactive";
        break;
      default:
        userStatus = "inactive";
    }

    // Note: User subscription status is now managed via subscriptions table only

    return subscription?._id;
  },
});

// Cancel subscription
export const cancelSubscription = mutation({
  args: {
    clerkId: v.string(),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, { clerkId, stripeSubscriptionId }) => {
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

    // Note: User subscription status is now managed via subscriptions table only

    return subscription?._id;
  },
});

// Cancel subscription at period end (user keeps existing credits)
export const cancelSubscriptionAtPeriodEnd = mutation({
  args: {
    clerkId: v.string(),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, { clerkId, stripeSubscriptionId }) => {
    // Get the subscription record
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription_id", (q) =>
        q.eq("stripeSubscriptionId", stripeSubscriptionId)
      )
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (
      subscription.status !== "active" &&
      subscription.status !== "trialing"
    ) {
      throw new Error("Subscription is not active");
    }

    // Update subscription to cancel at period end
    await ctx.db.patch(subscription._id, {
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
    });

    // Note: User subscription status is now managed via subscriptions table only

    return subscription._id;
  },
});

// Reactivate subscription (remove cancel at period end)
export const reactivateSubscription = mutation({
  args: {
    clerkId: v.string(),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, { clerkId, stripeSubscriptionId }) => {
    // Get the subscription record
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription_id", (q) =>
        q.eq("stripeSubscriptionId", stripeSubscriptionId)
      )
      .first();

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    if (
      subscription.status !== "active" &&
      subscription.status !== "trialing"
    ) {
      throw new Error("Subscription is not active");
    }

    // Remove cancel at period end flag
    await ctx.db.patch(subscription._id, {
      cancelAtPeriodEnd: false,
      updatedAt: Date.now(),
    });

    // Note: User subscription status is now managed via subscriptions table only

    return subscription._id;
  },
});

// Allocate monthly credits for subscription
export const allocateMonthlyCredits = mutation({
  args: {
    clerkId: v.string(),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, { clerkId, stripeSubscriptionId }) => {
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
      return;
    }

    // Grant monthly credits
    await ctx.runMutation(api.userProfiles.grantSubscriptionCredits, {
      clerkId,
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
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
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
        monthlyPrice: 0,
      };
    }

    // Get subscription plan details for pricing - inline to avoid circular dependency
    const plan = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_plan_id", (q) => q.eq("planId", subscription.tier))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    // Calculate credits used this period
    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
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
      monthlyPrice: plan?.price || 0,
    };
  },
});

// Get subscription history
export const getSubscriptionHistory = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .order("desc")
      .collect();
  },
});

// Get current subscription with cancellation details
export const getCurrentSubscription = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!subscription) {
      return null;
    }

    // Get subscription plan details for pricing - inline to avoid circular dependency
    const plan = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_plan_id", (q) => q.eq("planId", subscription.tier))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return {
      ...subscription,
      planDetails: plan,
    };
  },
});

// Change subscription plan (deactivates old, creates new)
export const changeSubscriptionPlan = mutation({
  args: {
    clerkId: v.string(),
    newPlanId: v.union(
      v.literal("starter"),
      v.literal("pro"),
      v.literal("max")
    ),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    stripePriceId: v.string(),
    subscriptionStatus: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (
    ctx,
    {
      clerkId,
      newPlanId,
      stripeSubscriptionId,
      stripeCustomerId,
      stripePriceId,
      subscriptionStatus,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    }
  ) => {
    // Get new plan from database - inline to avoid circular dependency
    const newPlan = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_plan_id", (q) => q.eq("planId", newPlanId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    if (!newPlan) {
      throw new Error(`Subscription plan not found: ${newPlanId}`);
    }

    // Deactivate all existing active subscriptions for this user
    const existingSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "trialing")
        )
      )
      .collect();

    // Mark existing subscriptions as canceled
    for (const existingSub of existingSubscriptions) {
      await ctx.db.patch(existingSub._id, {
        status: "canceled",
        cancelAtPeriodEnd: true,
        updatedAt: Date.now(),
      });
    }

    // Create new subscription record
    const newSubscriptionId = await ctx.db.insert("subscriptions", {
      clerkId,
      stripeSubscriptionId,
      stripeCustomerId,
      stripePriceId,
      tier: newPlanId,
      status: subscriptionStatus as
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid",
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      monthlyCredits: newPlan.monthlyCredits,
      creditsGrantedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Map Stripe status to user schema status
    let userStatus:
      | "active"
      | "canceled"
      | "past_due"
      | "trialing"
      | "inactive";
    switch (subscriptionStatus) {
      case "active":
      case "trialing":
        userStatus = subscriptionStatus;
        break;
      case "canceled":
      case "past_due":
        userStatus = subscriptionStatus;
        break;
      case "incomplete":
      case "incomplete_expired":
      case "unpaid":
        userStatus = "inactive";
        break;
      default:
        userStatus = "inactive";
    }

    // Note: User subscription tier is now managed via subscriptions table only

    // Grant initial monthly credits for new plan - inline to avoid circular dependency
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const balanceBefore = profile.credits;
    const balanceAfter = balanceBefore + newPlan.monthlyCredits;

    // Update user's credit balance
    await ctx.db.patch(profile._id, {
      credits: balanceAfter,
      updatedAt: Date.now(),
    });

    // Create credit transaction record
    await ctx.db.insert("creditTransactions", {
      clerkId,
      type: "subscription_grant",
      amount: newPlan.monthlyCredits,
      description: `Plan change to ${newPlanId} - monthly credits`,
      subscriptionId: newSubscriptionId,
      balanceBefore,
      balanceAfter,
      createdAt: Date.now(),
    });

    return newSubscriptionId;
  },
});
