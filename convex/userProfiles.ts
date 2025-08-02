import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import {
  validateCreditTransaction,
  validateUserCredits,
  throwValidationError,
  logValidationWarnings,
  sanitizeString,
} from "./lib/validation";

// Create or get user profile
export const createUserProfile = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingProfile) {
      return existingProfile._id;
    }

    // Get free tier credits from configuration
    const freeTierCredits = await ctx.db
      .query("configurations")
      .withIndex("by_key", (q: any) => q.eq("key", "free_tier_credits"))
      .first();

    const initialCredits = (freeTierCredits?.value as number) || 40; // Default to 40 if not configured

    // Create new user profile with default values
    const profileId = await ctx.db.insert("userProfiles", {
      clerkId: args.clerkId,
      credits: initialCredits,
      totalCreditsUsed: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return profileId;
  },
});

// Get user profile by clerkId
export const getUserProfile = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();
  },
});

// Get current user profile using Clerk auth
export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

// Update user credits
export const updateCredits = mutation({
  args: {
    clerkId: v.string(),
    creditAmount: v.number(),
    operation: v.union(v.literal("add"), v.literal("subtract")),
  },
  handler: async (ctx, { clerkId, creditAmount, operation }) => {
    // ============================================================================
    // INPUT VALIDATION
    // ============================================================================

    const sanitizedArgs = {
      clerkId: sanitizeString(clerkId, 100),
      amount: creditAmount,
      operation,
    };

    // Validate credit transaction parameters
    const validation = validateCreditTransaction(sanitizedArgs);
    if (!validation.isValid) {
      throwValidationError(
        validation.errors,
        "Credit transaction validation failed"
      );
    }

    // Log warnings if any
    logValidationWarnings(validation.warnings || [], "Credit transaction");

    // ============================================================================
    // USER PROFILE VALIDATION
    // ============================================================================

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", sanitizedArgs.clerkId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // ============================================================================
    // CREDIT VALIDATION
    // ============================================================================

    // Validate user has sufficient credits for subtraction
    if (operation === "subtract") {
      const creditValidation = validateUserCredits(
        profile.credits,
        creditAmount
      );
      if (!creditValidation.isValid) {
        throwValidationError(
          creditValidation.errors,
          "Credit validation failed"
        );
      }
    }

    const newCredits =
      operation === "add"
        ? profile.credits + creditAmount
        : profile.credits - creditAmount;

    const newTotalCreditsUsed =
      operation === "subtract"
        ? profile.totalCreditsUsed + creditAmount
        : profile.totalCreditsUsed;

    // Additional safety check
    if (newCredits < 0) {
      throw new Error("Insufficient credits");
    }

    await ctx.db.patch(profile._id, {
      credits: newCredits,
      totalCreditsUsed: newTotalCreditsUsed,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      newBalance: newCredits,
      totalUsed: newTotalCreditsUsed,
    };
  },
});

// Add credits to user account
export const addCredits = mutation({
  args: {
    clerkId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, { clerkId, amount }) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const newCredits = profile.credits + amount;

    await ctx.db.patch(profile._id, {
      credits: newCredits,
      updatedAt: Date.now(),
    });

    return newCredits;
  },
});

// Subtract credits from user account
export const subtractCredits = mutation({
  args: {
    clerkId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, { clerkId, amount }) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const newCredits = profile.credits - amount;
    const newTotalCreditsUsed = profile.totalCreditsUsed + amount;

    if (newCredits < 0) {
      throw new Error("Insufficient credits");
    }

    await ctx.db.patch(profile._id, {
      credits: newCredits,
      totalCreditsUsed: newTotalCreditsUsed,
      updatedAt: Date.now(),
    });

    return newCredits;
  },
});

// Get user credit balance
export const getCreditBalance = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    return profile
      ? {
          credits: profile.credits,
          totalCreditsUsed: profile.totalCreditsUsed,
        }
      : null;
  },
});

// Get all user profiles (admin function)
export const getAllUserProfiles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userProfiles").collect();
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    clerkId: v.string(),
    updates: v.object({
      credits: v.optional(v.number()),
      totalCreditsUsed: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { clerkId, updates }) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    await ctx.db.patch(profile._id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return profile._id;
  },
});

// Grant subscription credits with transaction record
export const grantSubscriptionCredits = mutation({
  args: {
    clerkId: v.string(),
    amount: v.number(),
    description: v.string(),
    subscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, amount, description, subscriptionId }) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const balanceBefore = profile.credits;
    const balanceAfter = balanceBefore + amount;

    // Update user's credit balance
    await ctx.db.patch(profile._id, {
      credits: balanceAfter,
      updatedAt: Date.now(),
    });

    // Create credit transaction record
    await ctx.db.insert("creditTransactions", {
      clerkId,
      type: "subscription_grant",
      amount,
      description,
      subscriptionId,
      balanceBefore,
      balanceAfter,
      createdAt: Date.now(),
    });

    return balanceAfter;
  },
});

// Add credits with transaction record (for purchases)
export const addCreditsWithTransaction = mutation({
  args: {
    clerkId: v.string(),
    amount: v.number(),
    description: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    videoId: v.optional(v.id("videos")),
  },
  handler: async (
    ctx,
    { clerkId, amount, description, stripePaymentIntentId, videoId }
  ) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const balanceBefore = profile.credits;
    const balanceAfter = balanceBefore + amount;

    // Update user's credit balance
    await ctx.db.patch(profile._id, {
      credits: balanceAfter,
      updatedAt: Date.now(),
    });

    // Create credit transaction record
    await ctx.db.insert("creditTransactions", {
      clerkId,
      type: "purchase",
      amount,
      description,
      stripePaymentIntentId,
      videoId,
      balanceBefore,
      balanceAfter,
      createdAt: Date.now(),
    });

    return balanceAfter;
  },
});

// Get credit transaction history
export const getCreditHistory = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("creditTransactions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .order("desc")
      .collect();
  },
});

// Get credit usage statistics
export const getCreditStats = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .collect();

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    const stats = {
      totalPurchased: 0,
      totalUsed: 0,
      totalRefunded: 0,
      totalGranted: 0,
      currentBalance: profile?.credits || 0,
      monthlyUsage: 0,
      averagePerMonth: 0,
    };

    // Calculate current month usage
    const now = Date.now();
    const currentMonthStart = new Date(now);
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthTimestamp = currentMonthStart.getTime();

    transactions.forEach((tx) => {
      if (tx.type === "purchase") {
        stats.totalPurchased += tx.amount;
      } else if (tx.type === "video_generation") {
        stats.totalUsed += Math.abs(tx.amount);
        // Calculate monthly usage
        if (tx.createdAt >= currentMonthTimestamp) {
          stats.monthlyUsage += Math.abs(tx.amount);
        }
      } else if (tx.type === "refund") {
        stats.totalRefunded += tx.amount;
      } else if (tx.type === "subscription_grant") {
        stats.totalGranted += tx.amount;
      }
    });

    // Calculate average monthly usage (based on user's account age)
    if (profile?.createdAt) {
      const accountAgeInMonths = Math.max(
        1,
        (now - profile.createdAt) / (1000 * 60 * 60 * 24 * 30)
      );
      stats.averagePerMonth = Math.round(stats.totalUsed / accountAgeInMonths);
    }

    return stats;
  },
});

// Get current user's credit history (using auth)
export const getCurrentUserCreditHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("creditTransactions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .order("desc")
      .take(limit);
  },
});
