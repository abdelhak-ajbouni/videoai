import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user's current credit balance
export const getCredits = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user?.credits || 0;
  },
});

// Get credit transaction history
export const getCreditHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("creditTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Add credits to user account
export const addCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    videoId: v.optional(v.id("videos")),
  },
  handler: async (
    ctx,
    { userId, amount, description, stripePaymentIntentId, videoId }
  ) => {
    console.log("addCredits called:", {
      userId,
      amount,
      description,
      stripePaymentIntentId,
    });

    const user = await ctx.db.get(userId);
    if (!user) {
      console.error("User not found:", userId);
      throw new Error("User not found");
    }

    const balanceBefore = user.credits;
    const balanceAfter = balanceBefore + amount;

    console.log("Credit balance update:", {
      userId,
      balanceBefore,
      amount,
      balanceAfter,
    });

    // Update user's credit balance
    await ctx.db.patch(userId, {
      credits: balanceAfter,
      totalCreditsUsed: user.totalCreditsUsed, // Keep existing value
    });

    console.log("User credit balance updated successfully");

    // Create credit transaction record
    const transactionId = await ctx.db.insert("creditTransactions", {
      userId,
      type: "purchase",
      amount,
      description,
      stripePaymentIntentId,
      videoId,
      balanceBefore,
      balanceAfter,
      createdAt: Date.now(),
    });

    console.log("Credit transaction recorded:", transactionId);

    return balanceAfter;
  },
});

// Deduct credits from user account
export const deductCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    videoId: v.optional(v.id("videos")),
  },
  handler: async (ctx, { userId, amount, description, videoId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    if (user.credits < amount) {
      throw new Error("Insufficient credits");
    }

    const balanceBefore = user.credits;
    const balanceAfter = balanceBefore - amount;

    // Update user's credit balance
    await ctx.db.patch(userId, {
      credits: balanceAfter,
      totalCreditsUsed: user.totalCreditsUsed + amount,
    });

    // Create credit transaction record
    await ctx.db.insert("creditTransactions", {
      userId,
      type: "video_generation",
      amount: -amount, // Negative for deduction
      description,
      videoId,
      balanceBefore,
      balanceAfter,
      createdAt: Date.now(),
    });

    return balanceAfter;
  },
});

// Refund credits for failed video generation
export const refundCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    videoId: v.id("videos"),
  },
  handler: async (ctx, { userId, amount, description, videoId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const balanceBefore = user.credits;
    const balanceAfter = balanceBefore + amount;

    // Update user's credit balance
    await ctx.db.patch(userId, {
      credits: balanceAfter,
      totalCreditsUsed: user.totalCreditsUsed - amount, // Reduce total used
    });

    // Create credit transaction record
    await ctx.db.insert("creditTransactions", {
      userId,
      type: "refund",
      amount,
      description,
      videoId,
      balanceBefore,
      balanceAfter,
      createdAt: Date.now(),
    });

    return balanceAfter;
  },
});

// Grant subscription credits
export const grantSubscriptionCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    subscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, { userId, amount, description, subscriptionId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const balanceBefore = user.credits;
    const balanceAfter = balanceBefore + amount;

    // Update user's credit balance
    await ctx.db.patch(userId, {
      credits: balanceAfter,
    });

    // Create credit transaction record
    await ctx.db.insert("creditTransactions", {
      userId,
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

// Get credit usage statistics
export const getCreditStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const stats = {
      totalPurchased: 0,
      totalUsed: 0,
      totalRefunded: 0,
      totalGranted: 0,
      currentBalance: 0,
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

    const user = await ctx.db.get(userId);
    stats.currentBalance = user?.credits || 0;

    // Calculate average monthly usage (based on user's account age)
    if (user?.createdAt) {
      const accountAgeInMonths = Math.max(
        1,
        (now - user.createdAt) / (1000 * 60 * 60 * 24 * 30)
      );
      stats.averagePerMonth = Math.round(stats.totalUsed / accountAgeInMonths);
    }

    return stats;
  },
});
