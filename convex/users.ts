import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Create user (now redirects to userProfiles)
export const createUser = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Redirect to userProfiles creation
    return await ctx.runMutation(api.userProfiles.createUserProfile, {
      clerkId: args.clerkId,
    });
  },
});

// Update user (deprecated - user profile data now handled by Clerk)
export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // User profile data (name, email, imageUrl) is now handled by Clerk
    // Only create userProfile if it doesn't exist
    return await ctx.runMutation(api.userProfiles.createUserProfile, {
      clerkId: args.clerkId,
    });
  },
});

// Deprecated - Stripe customer IDs now stored in subscriptions table
export const updateUserStripeCustomerId = mutation({
  args: {
    clerkId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    // No-op: Stripe customer IDs are now managed in subscriptions table
    // This function is kept for backward compatibility
    console.log(`updateUserStripeCustomerId called for ${args.clerkId}, but no action needed`);
    return null;
  },
});

// Get current user (now returns userProfile + Clerk data)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get user profile from userProfiles table
    const userProfile = await ctx.runQuery(api.userProfiles.getUserProfile, {
      clerkId: identity.subject,
    });

    if (!userProfile) {
      return null;
    }

    // Combine userProfile data with Clerk identity data
    return {
      _id: userProfile._id,
      clerkId: userProfile.clerkId,
      email: identity.email || "",
      name: identity.name || "",
      imageUrl: identity.pictureUrl || "",
      credits: userProfile.credits,
      totalCreditsUsed: userProfile.totalCreditsUsed,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
    };
  },
});

// Get user by profile ID (now uses userProfiles)
export const getUser = query({
  args: { userId: v.id("userProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user by Clerk ID (now uses userProfiles)
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(api.userProfiles.getUserProfile, {
      clerkId: args.clerkId,
    });
  },
});

// Get user by Stripe customer ID (now searches subscriptions table)
export const getUserByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    // Find subscription with this customer ID
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer_id", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();

    if (!subscription) {
      return null;
    }

    // Return the user profile for this clerkId
    return await ctx.runQuery(api.userProfiles.getUserProfile, {
      clerkId: subscription.clerkId,
    });
  },
});
