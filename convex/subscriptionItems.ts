import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get subscription items for a subscription
export const getSubscriptionItems = query({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, { subscriptionId }) => {
    return await ctx.db
      .query("subscriptionItems")
      .withIndex("by_subscription_id", (q) => q.eq("subscriptionId", subscriptionId))
      .collect();
  },
});

// Get subscription items by Stripe subscription ID
export const getSubscriptionItemsByStripeId = query({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, { stripeSubscriptionId }) => {
    return await ctx.db
      .query("subscriptionItems")
      .withIndex("by_stripe_subscription_id", (q) => q.eq("stripeSubscriptionId", stripeSubscriptionId))
      .collect();
  },
});

// Get a specific subscription item by Stripe item ID
export const getSubscriptionItemByStripeItemId = query({
  args: { stripeSubscriptionItemId: v.string() },
  handler: async (ctx, { stripeSubscriptionItemId }) => {
    return await ctx.db
      .query("subscriptionItems")
      .withIndex("by_stripe_subscription_item_id", (q) => q.eq("stripeSubscriptionItemId", stripeSubscriptionItemId))
      .first();
  },
});

// Create a subscription item
export const createSubscriptionItem = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    stripeSubscriptionId: v.string(),
    stripeSubscriptionItemId: v.string(),
    stripePriceId: v.string(),
    quantity: v.number(),
    priceData: v.object({
      unitAmount: v.number(),
      currency: v.string(),
      recurring: v.optional(v.object({
        interval: v.union(v.literal("day"), v.literal("week"), v.literal("month"), v.literal("year")),
        intervalCount: v.number()
      }))
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subscriptionItems", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Update a subscription item
export const updateSubscriptionItem = mutation({
  args: {
    stripeSubscriptionItemId: v.string(),
    quantity: v.optional(v.number()),
    stripePriceId: v.optional(v.string()),
    priceData: v.optional(v.object({
      unitAmount: v.number(),
      currency: v.string(),
      recurring: v.optional(v.object({
        interval: v.union(v.literal("day"), v.literal("week"), v.literal("month"), v.literal("year")),
        intervalCount: v.number()
      }))
    })),
  },
  handler: async (ctx, { stripeSubscriptionItemId, quantity, stripePriceId, priceData }) => {
    const item = await ctx.db
      .query("subscriptionItems")
      .withIndex("by_stripe_subscription_item_id", (q) => q.eq("stripeSubscriptionItemId", stripeSubscriptionItemId))
      .first();

    if (!item) {
      throw new Error("Subscription item not found");
    }

    const updates: any = { updatedAt: Date.now() };
    if (quantity !== undefined) updates.quantity = quantity;
    if (stripePriceId !== undefined) updates.stripePriceId = stripePriceId;
    if (priceData !== undefined) updates.priceData = priceData;

    await ctx.db.patch(item._id, updates);
    return item._id;
  },
});

// Delete subscription items for a subscription
export const deleteSubscriptionItems = mutation({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, { subscriptionId }) => {
    const items = await ctx.db
      .query("subscriptionItems")
      .withIndex("by_subscription_id", (q) => q.eq("subscriptionId", subscriptionId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    return items.length;
  },
});

// Delete a specific subscription item
export const deleteSubscriptionItem = mutation({
  args: { stripeSubscriptionItemId: v.string() },
  handler: async (ctx, { stripeSubscriptionItemId }) => {
    const item = await ctx.db
      .query("subscriptionItems")
      .withIndex("by_stripe_subscription_item_id", (q) => q.eq("stripeSubscriptionItemId", stripeSubscriptionItemId))
      .first();

    if (item) {
      await ctx.db.delete(item._id);
      return item._id;
    }

    return null;
  },
});