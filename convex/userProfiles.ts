import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { 
  createAuthError, 
  createNotFoundError, 
  createValidationError,
  createInsufficientCreditsError,
  handleError 
} from "./lib/errors";

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
      .withIndex("by_key", (q) => q.eq("key", "free_tier_credits"))
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
    // USER PROFILE CHECK
    // ============================================================================

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // ============================================================================
    // CREDIT CHECK
    // ============================================================================

    // Validate user has sufficient credits for subtraction
    if (operation === "subtract" && profile.credits < creditAmount) {
      throw new Error("Insufficient credits for this operation");
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

// Add credits to user account with validation
export const addCredits = mutation({
  args: {
    clerkId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, { clerkId, amount }) => {
    try {
      if (amount <= 0) {
        throw createValidationError("Amount must be positive", "amount");
      }

      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();

      if (!profile) {
        throw createNotFoundError("User profile", clerkId);
      }

      const newCredits = profile.credits + amount;

      // Prevent integer overflow
      if (newCredits > Number.MAX_SAFE_INTEGER) {
        throw createValidationError("Credit amount too large", "amount");
      }

      await ctx.db.patch(profile._id, {
        credits: newCredits,
        updatedAt: Date.now(),
      });

      console.log(`Credits added for ${clerkId}: ${amount} credits (balance: ${newCredits})`);
      return newCredits;
    } catch (error) {
      return handleError(error, { function: 'addCredits', clerkId, amount });
    }
  },
});

// Subtract credits from user account with atomic validation
export const subtractCredits = mutation({
  args: {
    clerkId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, { clerkId, amount }) => {
    try {
      if (amount <= 0) {
        throw createValidationError("Amount must be positive", "amount");
      }

      const profile = await ctx.db
        .query("userProfiles")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();

      if (!profile) {
        throw createNotFoundError("User profile", clerkId);
      }

      // Validate sufficient credits BEFORE deduction
      if (profile.credits < amount) {
        throw createInsufficientCreditsError(amount, profile.credits);
      }

      const newCredits = profile.credits - amount;
      const newTotalCreditsUsed = profile.totalCreditsUsed + amount;

      // Atomic update with validation
      await ctx.db.patch(profile._id, {
        credits: newCredits,
        totalCreditsUsed: newTotalCreditsUsed,
        updatedAt: Date.now(),
      });

      console.log(`Credits deducted for ${clerkId}: ${amount} credits (balance: ${newCredits})`);
      return newCredits;
    } catch (error) {
      return handleError(error, { function: 'subtractCredits', clerkId, amount });
    }
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
