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
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),

    // Generation settings
    model: v.optional(
      v.union(
        v.literal("google/veo-3"),
        v.literal("luma/ray-2-720p"),
        v.literal("luma/ray-flash-2-540p")
      )
    ),
    quality: v.union(
      v.literal("standard"),
      v.literal("high"),
      v.literal("ultra")
    ),
    duration: v.union(v.literal("5"), v.literal("8"), v.literal("9")),

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
    thumbnailFileId: v.optional(v.id("_storage")),

    // Video file metadata
    fileSize: v.optional(v.number()), // in bytes
    actualDuration: v.optional(v.number()), // actual video duration in seconds
    dimensions: v.optional(
      v.object({
        width: v.number(),
        height: v.number(),
      })
    ),
    format: v.optional(v.string()), // e.g., "mp4", "webm"
    codec: v.optional(v.string()), // e.g., "h264", "vp9"
    bitrate: v.optional(v.number()), // in kbps

    // Analytics and engagement
    viewCount: v.optional(v.number()),
    lastViewedAt: v.optional(v.number()),
    downloadCount: v.optional(v.number()),
    shareCount: v.optional(v.number()),

    // Processing details
    errorMessage: v.optional(v.string()),
    processingStartedAt: v.optional(v.number()),
    processingCompletedAt: v.optional(v.number()),
    estimatedCompletionTime: v.optional(v.number()),
    processingDuration: v.optional(v.number()), // total processing time in ms

    // Performance metrics
    generationMetrics: v.optional(
      v.object({
        queueTime: v.number(), // time spent in queue
        processingTime: v.number(), // actual generation time
        downloadTime: v.optional(v.number()), // time to download and store
        totalTime: v.number(), // total end-to-end time
      })
    ),

    // Cost tracking
    creditsCost: v.number(),

    // Content management
    isPublic: v.optional(v.boolean()),
    isFavorite: v.optional(v.boolean()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_replicate_job_id", ["replicateJobId"])
    .index("by_created_at", ["createdAt"])
    .index("by_user_and_created_at", ["userId", "createdAt"])
    .index("by_user_and_favorite", ["userId", "isFavorite"])
    .index("by_user_and_public", ["userId", "isPublic"])
    .index("by_user_and_view_count", ["userId", "viewCount"])
    .index("by_tags", ["tags"])
    .index("by_file_size", ["fileSize"])
    .index("by_last_viewed", ["lastViewedAt"]),

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
