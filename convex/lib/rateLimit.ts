import {
  RateLimiter,
  MINUTE,
  HOUR,
  RunMutationCtx,
} from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";
import { AppError, ErrorCode, ErrorSeverity } from "./errors";

/**
 * Official Convex rate limiter instance
 * Generous limits focused purely on abuse prevention - normal users should never hit these
 */
const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Video generation - generous limit to prevent rapid automation abuse
  videoGeneration: {
    kind: "fixed window",
    rate: 100, // 100 videos per hour - very generous for normal use
    period: HOUR,
  },

  // Financial operations - prevent rapid purchase attempts
  creditPurchase: {
    kind: "token bucket",
    rate: 20, // 20 purchases per minute - generous for normal use
    period: MINUTE,
    capacity: 10,
  },

  // API rate limits - prevent API abuse
  apiCallPerUser: {
    kind: "token bucket",
    rate: 1000, // 1000 calls per minute per user - very generous
    period: MINUTE,
    capacity: 100,
  },
  apiCallPerIp: {
    kind: "token bucket",
    rate: 500, // 500 calls per minute per IP - prevents scraping
    period: MINUTE,
    capacity: 50,
  },

  // Security rate limits - prevent brute force attacks
  authAttempt: {
    kind: "fixed window",
    rate: 50, // 50 auth attempts per 15 minutes - generous for normal use
    period: 15 * MINUTE,
  },
});

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(operation: string, retryAfter?: number) {
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
  ctx: RunMutationCtx,
  userId: string
) {
  const status = await rateLimiter.limit(ctx, "videoGeneration", {
    key: userId,
    throws: false,
  });

  if (!status.ok) {
    throw new RateLimitError("video generation", status.retryAfter);
  }

  return status;
}

/**
 * Helper function to apply credit purchase rate limits
 */
export async function applyCreditPurchaseRateLimit(
  ctx: RunMutationCtx,
  userId: string
) {
  const status = await rateLimiter.limit(ctx, "creditPurchase", {
    key: userId,
    throws: false,
  });

  if (!status.ok) {
    throw new RateLimitError("credit purchase", status.retryAfter);
  }

  return status;
}

/**
 * Helper function to apply IP-based rate limits
 */
export async function applyIpRateLimit(
  ctx: RunMutationCtx,
  ipAddress: string,
  operation: string = "api_call"
) {
  const status = await rateLimiter.limit(ctx, "apiCallPerIp", {
    key: ipAddress,
    throws: false,
  });

  if (!status.ok) {
    throw new RateLimitError(`${operation} (IP-based)`, status.retryAfter);
  }

  return status;
}

/**
 * Helper function to apply user-based API rate limits
 */
export async function applyUserRateLimit(
  ctx: RunMutationCtx,
  userId: string,
  operation: string = "api_call"
) {
  const status = await rateLimiter.limit(ctx, "apiCallPerUser", {
    key: userId,
    throws: false,
  });

  if (!status.ok) {
    throw new RateLimitError(`${operation} (user-based)`, status.retryAfter);
  }

  return status;
}

/**
 * Helper function to apply authentication attempt rate limits
 */
export async function applyAuthAttemptRateLimit(
  ctx: RunMutationCtx,
  ipAddress: string
) {
  const status = await rateLimiter.limit(ctx, "authAttempt", {
    key: ipAddress,
    throws: false,
  });

  if (!status.ok) {
    throw new RateLimitError("authentication attempt", status.retryAfter);
  }

  return status;
}

/**
 * Reset a specific rate limit (admin function)
 */
export async function resetRateLimit(
  ctx: RunMutationCtx,
  operation: string,
  key: string
) {
  // Use the rate limiter's reset method
  await rateLimiter.reset(ctx, operation, { key });
}
