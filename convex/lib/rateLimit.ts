import { MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { AppError, ErrorCode, ErrorSeverity } from "./errors";

/**
 * Simple rate limiter using database storage
 * Stores rate limit data in a temporary collection that gets auto-cleaned
 */
async function checkAndUpdateRateLimit(
  ctx: any,
  operation: string,
  config: { rate: number; period: number },
  key: string = 'default'
): Promise<{ ok: boolean; retryAfter?: number }> {
  const now = Date.now();
  const windowStart = Math.floor(now / config.period) * config.period;
  const identifier = `${operation}:${key}`;

  // Try to get existing rate limit for this window
  const existing = await ctx.db
    .query("processedWebhooks") // Reusing existing table temporarily
    .filter((q) => 
      q.and(
        q.eq(q.field("eventId"), identifier),
        q.eq(q.field("source"), "rate_limit"),
        q.gte(q.field("createdAt"), windowStart)
      )
    )
    .first();

  if (existing) {
    // Parse the current count from metadata
    const currentCount = existing.metadata?.count || 0;
    
    if (currentCount >= config.rate) {
      // Rate limit exceeded
      const resetTime = windowStart + config.period;
      return {
        ok: false,
        retryAfter: resetTime - now
      };
    }

    // Update the count
    await ctx.db.patch(existing._id, {
      metadata: { ...existing.metadata, count: currentCount + 1 },
      processedAt: now
    });
  } else {
    // Create new rate limit record
    await ctx.db.insert("processedWebhooks", {
      eventId: identifier,
      eventType: operation,
      source: "rate_limit",
      processed: true,
      processedAt: now,
      errorMessage: undefined,
      metadata: { count: 1, windowStart },
      createdAt: now
    });
  }

  return { ok: true };
}

/**
 * Rate limit configurations
 */
const RATE_LIMIT_CONFIGS = {
  videoGeneration: { rate: 3, period: HOUR },
  videoGenerationStarter: { rate: 10, period: HOUR },
  videoGenerationPro: { rate: 50, period: HOUR },
  videoGenerationMax: { rate: 200, period: HOUR },
  creditPurchase: { rate: 5, period: MINUTE },
  apiCallPerUser: { rate: 200, period: MINUTE },
  apiCallPerIp: { rate: 100, period: MINUTE },
  authAttempt: { rate: 10, period: 15 * MINUTE },
};

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(
    operation: string,
    retryAfter?: number
  ) {
    const resetMessage = retryAfter 
      ? `Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`
      : "Please try again later.";
    
    super(
      ErrorCode.RESOURCE_EXHAUSTED,
      `Rate limit exceeded for ${operation}`,
      `Too many requests. ${resetMessage}`,
      ErrorSeverity.LOW,
      { operation, retryAfter }
    );
  }
}

/**
 * Helper function to apply video generation rate limits based on subscription tier
 */
export async function applyVideoGenerationRateLimit(
  ctx: any,
  userId: string,
  subscriptionTier: string = "free"
) {
  let configKey: keyof typeof RATE_LIMIT_CONFIGS;
  
  switch (subscriptionTier) {
    case "starter":
      configKey = "videoGenerationStarter";
      break;
    case "pro":
      configKey = "videoGenerationPro";
      break;
    case "max":
      configKey = "videoGenerationMax";
      break;
    default:
      configKey = "videoGeneration"; // Free tier
  }

  const config = RATE_LIMIT_CONFIGS[configKey];
  const status = await checkAndUpdateRateLimit(ctx, configKey, config, userId);
  
  if (!status.ok) {
    throw new RateLimitError("video generation", status.retryAfter);
  }

  return status;
}

/**
 * Helper function to apply credit purchase rate limits
 */
export async function applyCreditPurchaseRateLimit(ctx: any, userId: string) {
  const config = RATE_LIMIT_CONFIGS.creditPurchase;
  const status = await checkAndUpdateRateLimit(ctx, "creditPurchase", config, userId);
  
  if (!status.ok) {
    throw new RateLimitError("credit purchase", status.retryAfter);
  }

  return status;
}

/**
 * Helper function to apply IP-based rate limits
 */
export async function applyIpRateLimit(
  ctx: any,
  ipAddress: string,
  operation: string = "api_call"
) {
  const config = RATE_LIMIT_CONFIGS.apiCallPerIp;
  const status = await checkAndUpdateRateLimit(ctx, "apiCallPerIp", config, ipAddress);
  
  if (!status.ok) {
    throw new RateLimitError(`${operation} (IP-based)`, status.retryAfter);
  }

  return status;
}

/**
 * Helper function to apply user-based API rate limits
 */
export async function applyUserRateLimit(
  ctx: any,
  userId: string,
  operation: string = "api_call"
) {
  const config = RATE_LIMIT_CONFIGS.apiCallPerUser;
  const status = await checkAndUpdateRateLimit(ctx, "apiCallPerUser", config, userId);
  
  if (!status.ok) {
    throw new RateLimitError(`${operation} (user-based)`, status.retryAfter);
  }

  return status;
}

/**
 * Helper function to apply authentication attempt rate limits
 */
export async function applyAuthAttemptRateLimit(
  ctx: any,
  ipAddress: string
) {
  const config = RATE_LIMIT_CONFIGS.authAttempt;
  const status = await checkAndUpdateRateLimit(ctx, "authAttempt", config, ipAddress);
  
  if (!status.ok) {
    throw new RateLimitError("authentication attempt", status.retryAfter);
  }

  return status;
}

/**
 * Check current rate limit status without consuming a request
 */
export async function checkRateLimitStatus(
  ctx: any,
  operation: string,
  key: string
) {
  const now = Date.now();
  const config = RATE_LIMIT_CONFIGS[operation as keyof typeof RATE_LIMIT_CONFIGS];
  if (!config) return { ok: true };
  
  const windowStart = Math.floor(now / config.period) * config.period;
  const identifier = `${operation}:${key}`;

  const existing = await ctx.db
    .query("processedWebhooks")
    .filter((q) => 
      q.and(
        q.eq(q.field("eventId"), identifier),
        q.eq(q.field("source"), "rate_limit"),
        q.gte(q.field("createdAt"), windowStart)
      )
    )
    .first();

  if (existing) {
    const currentCount = existing.metadata?.count || 0;
    const resetTime = windowStart + config.period;
    
    return {
      ok: currentCount < config.rate,
      retryAfter: resetTime - now
    };
  }
  
  return { ok: true };
}

/**
 * Reset a specific rate limit (admin function)
 */
export async function resetRateLimit(
  ctx: any,
  operation: string,
  key: string
) {
  const identifier = `${operation}:${key}`;
  
  // Find and delete all rate limit records for this identifier
  const rateLimitRecords = await ctx.db
    .query("processedWebhooks")
    .filter((q) => 
      q.and(
        q.eq(q.field("eventId"), identifier),
        q.eq(q.field("source"), "rate_limit")
      )
    )
    .collect();

  for (const record of rateLimitRecords) {
    await ctx.db.delete(record._id);
  }
}