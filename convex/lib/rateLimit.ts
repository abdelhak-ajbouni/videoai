import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { AppError, ErrorCode, ErrorSeverity } from "./errors";

/**
 * Rate limit configurations for different operations
 */
export const RATE_LIMIT_CONFIGS = {
  // Video generation limits
  video_generation: {
    free_tier: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
    starter_tier: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
    pro_tier: { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
    max_tier: { maxRequests: 200, windowMs: 60 * 60 * 1000 }, // 200 per hour
  },
  // Credit purchase limits (prevent rapid purchases)
  credit_purchase: {
    all_tiers: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 per minute
  },
  // API call limits (general protection)
  api_call: {
    per_ip: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute per IP
    per_user: { maxRequests: 200, windowMs: 60 * 1000 }, // 200 per minute per user
  },
  // Authentication attempts
  auth_attempt: {
    per_ip: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 per 15 minutes per IP
  }
} as const;

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(
    operation: string,
    windowMs: number,
    maxRequests: number,
    resetTime: number
  ) {
    const resetTimeString = new Date(resetTime).toLocaleTimeString();
    super(
      ErrorCode.RESOURCE_EXHAUSTED,
      `Rate limit exceeded for ${operation}: ${maxRequests} requests per ${windowMs}ms`,
      `Too many requests. Please try again after ${resetTimeString}.`,
      ErrorSeverity.LOW,
      { operation, windowMs, maxRequests, resetTime }
    );
  }
}

/**
 * Check and update rate limit for a given identifier and operation
 */
export const checkRateLimit = mutation({
  args: {
    identifier: v.string(),
    identifierType: v.string(),
    operation: v.string(),
    maxRequests: v.number(),
    windowMs: v.number(),
    metadata: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = Math.floor(now / args.windowMs) * args.windowMs;

    // Find existing rate limit record for this window
    const existingLimit = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier_and_operation", (q) => 
        q.eq("identifier", args.identifier).eq("operation", args.operation)
      )
      .filter((q) => q.eq(q.field("windowStart"), windowStart))
      .first();

    if (existingLimit) {
      // Check if limit is exceeded
      if (existingLimit.requestCount >= args.maxRequests) {
        const resetTime = windowStart + args.windowMs;
        throw new RateLimitError(args.operation, args.windowMs, args.maxRequests, resetTime);
      }

      // Update the existing record
      const newRequestCount = existingLimit.requestCount + 1;
      await ctx.db.patch(existingLimit._id, {
        requestCount: newRequestCount,
        lastRequestAt: now,
        updatedAt: now,
        metadata: args.metadata
      });

      return {
        allowed: true,
        requestCount: newRequestCount,
        maxRequests: args.maxRequests,
        resetTime: windowStart + args.windowMs,
        windowStart
      };
    } else {
      // Create new rate limit record
      await ctx.db.insert("rateLimits", {
        identifier: args.identifier,
        identifierType: args.identifierType,
        operation: args.operation,
        windowStart,
        windowDurationMs: args.windowMs,
        requestCount: 1,
        lastRequestAt: now,
        maxRequests: args.maxRequests,
        metadata: args.metadata,
        createdAt: now,
        updatedAt: now
      });

      return {
        allowed: true,
        requestCount: 1,
        maxRequests: args.maxRequests,
        resetTime: windowStart + args.windowMs,
        windowStart
      };
    }
  },
});

/**
 * Get current rate limit status for an identifier and operation
 */
export const getRateLimitStatus = query({
  args: {
    identifier: v.string(),
    operation: v.string(),
    windowMs: v.number()
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = Math.floor(now / args.windowMs) * args.windowMs;

    const rateLimit = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier_and_operation", (q) => 
        q.eq("identifier", args.identifier).eq("operation", args.operation)
      )
      .filter((q) => q.eq(q.field("windowStart"), windowStart))
      .first();

    if (!rateLimit) {
      return {
        requestCount: 0,
        maxRequests: 0,
        resetTime: windowStart + args.windowMs,
        windowStart
      };
    }

    return {
      requestCount: rateLimit.requestCount,
      maxRequests: rateLimit.maxRequests,
      resetTime: windowStart + args.windowMs,
      windowStart
    };
  },
});

/**
 * Clean up old rate limit records (run via cron)
 */
export const cleanupOldRateLimits = mutation({
  args: {
    olderThanHours: v.number()
  },
  handler: async (ctx, { olderThanHours }) => {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    const oldRecords = await ctx.db
      .query("rateLimits")
      .filter((q) => q.lt(q.field("windowStart"), cutoffTime))
      .collect();

    let deletedCount = 0;
    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
      deletedCount++;
    }

    console.log(`Cleaned up ${deletedCount} old rate limit records older than ${olderThanHours} hours`);
    return deletedCount;
  },
});

/**
 * Helper function to apply video generation rate limits based on subscription tier
 */
export async function applyVideoGenerationRateLimit(
  ctx: any,
  userId: string,
  subscriptionTier: string = "free"
) {
  const tierKey = `${subscriptionTier}_tier` as keyof typeof RATE_LIMIT_CONFIGS.video_generation;
  const config = RATE_LIMIT_CONFIGS.video_generation[tierKey] || RATE_LIMIT_CONFIGS.video_generation.free_tier;

  await ctx.runMutation(checkRateLimit, {
    identifier: userId,
    identifierType: "user",
    operation: "video_generation",
    maxRequests: config.maxRequests,
    windowMs: config.windowMs,
    metadata: { subscriptionTier }
  });
}

/**
 * Helper function to apply credit purchase rate limits
 */
export async function applyCreditPurchaseRateLimit(ctx: any, userId: string) {
  const config = RATE_LIMIT_CONFIGS.credit_purchase.all_tiers;

  await ctx.runMutation(checkRateLimit, {
    identifier: userId,
    identifierType: "user",
    operation: "credit_purchase",
    maxRequests: config.maxRequests,
    windowMs: config.windowMs,
    metadata: { operation_type: "credit_purchase" }
  });
}

/**
 * Helper function to apply IP-based rate limits
 */
export async function applyIpRateLimit(
  ctx: any,
  ipAddress: string,
  operation: string = "api_call"
) {
  const config = RATE_LIMIT_CONFIGS.api_call.per_ip;

  await ctx.runMutation(checkRateLimit, {
    identifier: ipAddress,
    identifierType: "ip",
    operation,
    maxRequests: config.maxRequests,
    windowMs: config.windowMs,
    metadata: { operation_type: operation }
  });
}

/**
 * Get rate limit statistics for monitoring
 */
export const getRateLimitStats = query({
  args: {
    timeRangeHours: v.optional(v.number())
  },
  handler: async (ctx, { timeRangeHours = 24 }) => {
    const cutoffTime = Date.now() - (timeRangeHours * 60 * 60 * 1000);
    
    const rateLimits = await ctx.db
      .query("rateLimits")
      .filter((q) => q.gte(q.field("createdAt"), cutoffTime))
      .collect();

    const stats = {
      totalRequests: 0,
      uniqueUsers: new Set<string>(),
      uniqueIPs: new Set<string>(),
      operationCounts: {} as Record<string, number>,
      rateLimitedOperations: {} as Record<string, number>,
      topUsers: {} as Record<string, number>,
      topOperations: [] as Array<{ operation: string; count: number; rateLimited: number }>
    };

    for (const limit of rateLimits) {
      stats.totalRequests += limit.requestCount;
      
      if (limit.identifierType === "user") {
        stats.uniqueUsers.add(limit.identifier);
        stats.topUsers[limit.identifier] = (stats.topUsers[limit.identifier] || 0) + limit.requestCount;
      } else if (limit.identifierType === "ip") {
        stats.uniqueIPs.add(limit.identifier);
      }

      stats.operationCounts[limit.operation] = (stats.operationCounts[limit.operation] || 0) + limit.requestCount;
      
      // Count rate limited requests (those at or near the limit)
      if (limit.requestCount >= limit.maxRequests * 0.9) {
        stats.rateLimitedOperations[limit.operation] = (stats.rateLimitedOperations[limit.operation] || 0) + 1;
      }
    }

    // Convert to arrays for easier consumption
    stats.topOperations = Object.entries(stats.operationCounts).map(([operation, count]) => ({
      operation,
      count,
      rateLimited: stats.rateLimitedOperations[operation] || 0
    })).sort((a, b) => b.count - a.count);

    return {
      ...stats,
      uniqueUsers: stats.uniqueUsers.size,
      uniqueIPs: stats.uniqueIPs.size,
      topUsers: Object.entries(stats.topUsers)
        .map(([user, count]) => ({ user, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
  },
});