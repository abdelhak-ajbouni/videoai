import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Simplified user profiles - only app-specific data
  userProfiles: defineTable({
    clerkId: v.string(),           // Link to Clerk user
    credits: v.number(),           // Current credit balance
    totalCreditsUsed: v.number(),  // Lifetime usage tracking
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"]),

  videos: defineTable({
    // User relationship
    clerkId: v.string(),

    // Video metadata
    title: v.optional(v.string()),
    prompt: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),

    // Generation settings
    model: v.string(), // Accept any model ID string
    quality: v.union(
      v.literal("standard"),
      v.literal("high"),
      v.literal("ultra")
    ),
    duration: v.string(), // Accept any duration string

    // Model-specific options
    resolution: v.optional(v.string()), // e.g., "720p", "1080p"
    aspectRatio: v.optional(v.string()), // e.g., "16:9", "9:16", "1:1"
    loop: v.optional(v.boolean()), // For Luma Ray models
    cameraConcept: v.optional(v.string()), // Camera movement concept
    startImageUrl: v.optional(v.string()), // Start frame image URL
    endImageUrl: v.optional(v.string()), // End frame image URL

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
    .index("by_clerk_id", ["clerkId"])
    .index("by_status", ["status"])
    .index("by_clerk_id_and_status", ["clerkId", "status"])
    .index("by_replicate_job_id", ["replicateJobId"]),

  creditTransactions: defineTable({
    // User relationship
    clerkId: v.string(),

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
    .index("by_clerk_id", ["clerkId"]),

  creditPackages: defineTable({
    // Package identification
    packageId: v.string(), // "small", "medium", "large", "xlarge"
    name: v.string(), // "Small", "Medium", "Large", "X-Large"
    description: v.optional(v.string()),

    // Pricing
    price: v.number(), // Price in cents
    currency: v.string(), // "usd"

    // Credits
    credits: v.number(), // Number of credits in this package

    // Package configuration
    isActive: v.boolean(),
    isPopular: v.optional(v.boolean()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_package_id", ["packageId"])
    .index("by_active", ["isActive"]),

  subscriptionPlans: defineTable({
    // Plan identification
    planId: v.string(), // "starter", "pro", "max"
    name: v.string(), // "Starter", "Pro", "Max"
    description: v.optional(v.string()),

    // Pricing
    price: v.number(), // Price in cents
    currency: v.string(), // "usd"

    // Features
    monthlyCredits: v.number(),
    features: v.array(v.string()), // ["HD video quality", "Priority processing", etc.]

    // Plan configuration
    isActive: v.boolean(),
    isPopular: v.optional(v.boolean()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_plan_id", ["planId"])
    .index("by_active", ["isActive"]),

  subscriptions: defineTable({
    // User relationship
    clerkId: v.string(),

    // Stripe data
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    stripePriceId: v.string(),

    // Subscription details
    tier: v.string(), // Now references planId from subscriptionPlans
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
    .index("by_clerk_id", ["clerkId"])
    .index("by_stripe_subscription_id", ["stripeSubscriptionId"])
    .index("by_stripe_customer_id", ["stripeCustomerId"])
    .index("by_status", ["status"])
    .index("by_current_period_end", ["currentPeriodEnd"]),


  configurations: defineTable({
    // Configuration identification
    key: v.string(), // Unique configuration key
    category: v.string(), // "pricing", "models", "business", "features", "limits"
    name: v.string(), // Human-readable name
    description: v.optional(v.string()), // Description of what this config controls

    // Configuration value (supports different types)
    value: v.union(
      v.string(),
      v.number(),
      v.boolean(),
      v.array(v.string()),
      v.array(v.number()),
      v.any() // Use v.any() for complex objects
    ),

    // Configuration metadata
    dataType: v.union(
      v.literal("string"),
      v.literal("number"),
      v.literal("boolean"),
      v.literal("array"),
      v.literal("object")
    ),
    isActive: v.boolean(),
    isEditable: v.boolean(), // Whether this can be changed via admin interface

    // Validation and constraints
    minValue: v.optional(v.number()),
    maxValue: v.optional(v.number()),
    allowedValues: v.optional(v.array(v.string())),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_category_and_active", ["category", "isActive"]),

  models: defineTable({
    // Model identification
    modelId: v.string(), // "google/veo-3", "luma/ray-2-720p", etc.
    name: v.string(), // "Google Veo-3", "Luma Ray-2-720p", etc.
    description: v.string(), // Human-readable description
    version: v.optional(v.string()), // Model version for tracking

    // Model capabilities
    costPerSecond: v.number(), // Cost in USD per second
    supportedDurations: v.array(v.number()), // [5, 8, 9] etc.
    supportedQualities: v.array(v.string()), // ["standard", "high", "ultra"]
    maxDuration: v.optional(v.number()), // Maximum supported duration
    fixedDuration: v.optional(v.number()), // For models with fixed duration only

    // Model characteristics
    isPremium: v.boolean(), // Premium model flag
    isFast: v.boolean(), // Fast model flag
    isActive: v.boolean(), // Whether model is available for use
    isDefault: v.boolean(), // Default model for new users
    isDeprecated: v.boolean(), // Deprecated model flag

    // Model metadata
    provider: v.string(), // "Google", "Luma", etc.
    category: v.optional(v.string()), // "premium", "budget", "experimental"
    tags: v.optional(v.array(v.string())), // ["fast", "high-quality", "cost-effective"]

    // Technical details
    replicateModelId: v.string(), // Full Replicate model identifier
    modelParameters: v.optional(v.any()), // Model-specific parameters
    requirements: v.optional(v.any()), // System requirements or constraints

    // Model-specific options
    supportedResolutions: v.optional(v.array(v.string())), // ["720p", "1080p"]
    defaultResolution: v.optional(v.string()), // Default resolution
    supportedAspectRatios: v.optional(v.array(v.string())), // ["16:9", "9:16", "1:1"]
    defaultAspectRatio: v.optional(v.string()), // Default aspect ratio
    supportsLoop: v.optional(v.boolean()), // Supports looping videos
    supportsCameraConcepts: v.optional(v.boolean()), // Supports camera movements
    cameraConcepts: v.optional(v.array(v.string())), // Available camera concepts
    supportsStartEndImages: v.optional(v.boolean()), // Supports start/end frame images
    supportsAudio: v.optional(v.boolean()), // Supports audio generation

    // Usage statistics
    totalGenerations: v.optional(v.number()), // Total generations using this model
    averageGenerationTime: v.optional(v.number()), // Average generation time in seconds
    successRate: v.optional(v.number()), // Success rate percentage

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    deprecatedAt: v.optional(v.number()),
  })
    .index("by_model_id", ["modelId"])
    .index("by_active", ["isActive"])
    .index("by_premium", ["isPremium"])
    .index("by_default", ["isDefault"])
    .index("by_provider", ["provider"])
    .index("by_category", ["category"])
    .index("by_active_and_premium", ["isActive", "isPremium"]),

});
