import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Clerk user ID
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),

    // Credit system
    credits: v.number(),
    totalCreditsUsed: v.number(),

    // Subscription info
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("business")
    ),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("inactive")
    ),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStartDate: v.optional(v.number()),
    subscriptionEndDate: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_stripe_customer_id", ["stripeCustomerId"])
    .index("by_subscription_status", ["subscriptionStatus"]),

  videos: defineTable({
    // User relationship
    userId: v.id("users"),

    // Video metadata
    title: v.string(),
    prompt: v.string(),

    // Generation settings
    quality: v.union(v.literal("standard"), v.literal("high")),
    duration: v.union(v.literal("5"), v.literal("10")),

    // Status and processing
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("canceled")
    ),

    // Replicate integration
    replicateJobId: v.optional(v.string()),
    replicateWebhookId: v.optional(v.string()),

    // File storage
    videoUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    convexFileId: v.optional(v.id("_storage")),

    // Processing details
    errorMessage: v.optional(v.string()),
    processingStartedAt: v.optional(v.number()),
    processingCompletedAt: v.optional(v.number()),
    estimatedCompletionTime: v.optional(v.number()),

    // Cost tracking
    creditsCost: v.number(),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_replicate_job_id", ["replicateJobId"])
    .index("by_created_at", ["createdAt"]),

  creditTransactions: defineTable({
    // User relationship
    userId: v.id("users"),

    // Transaction details
    type: v.union(
      v.literal("purchase"),
      v.literal("subscription_grant"),
      v.literal("video_generation"),
      v.literal("refund"),
      v.literal("bonus")
    ),
    amount: v.number(), // Positive for credits added, negative for credits used
    description: v.string(),

    // Related entities
    videoId: v.optional(v.id("videos")),
    stripePaymentIntentId: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),

    // Balance tracking
    balanceBefore: v.number(),
    balanceAfter: v.number(),

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_video", ["videoId"])
    .index("by_created_at", ["createdAt"]),

  subscriptions: defineTable({
    // User relationship
    userId: v.id("users"),

    // Stripe data
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    stripePriceId: v.string(),

    // Subscription details
    tier: v.union(
      v.literal("starter"),
      v.literal("pro"),
      v.literal("business")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("incomplete"),
      v.literal("incomplete_expired"),
      v.literal("unpaid")
    ),

    // Billing cycle
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    canceledAt: v.optional(v.number()),

    // Credits
    monthlyCredits: v.number(),
    creditsGrantedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_subscription_id", ["stripeSubscriptionId"])
    .index("by_stripe_customer_id", ["stripeCustomerId"])
    .index("by_status", ["status"])
    .index("by_current_period_end", ["currentPeriodEnd"]),

  generationJobs: defineTable({
    // User and video relationship
    userId: v.id("users"),
    videoId: v.id("videos"),

    // Job details
    replicateJobId: v.string(),
    status: v.union(
      v.literal("starting"),
      v.literal("processing"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("canceled")
    ),

    // Progress tracking
    progress: v.optional(v.number()), // 0-100
    logs: v.optional(v.array(v.string())),

    // Results
    output: v.optional(v.any()), // Replicate output data
    error: v.optional(v.string()),

    // Timing
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_video", ["videoId"])
    .index("by_replicate_job_id", ["replicateJobId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),
});
