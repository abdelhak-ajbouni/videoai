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
    .index("by_active", ["isActive"])
    .index("by_price", ["price"]),

  subscriptionPlans: defineTable({
    // Plan identification
    planId: v.string(), // "starter", "pro", "business"
    name: v.string(), // "Starter", "Pro", "Business"
    description: v.optional(v.string()),

    // Pricing
    priceId: v.string(), // Stripe price ID
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
    .index("by_active", ["isActive"])
    .index("by_price", ["price"]),

  subscriptions: defineTable({
    // User relationship
    userId: v.id("users"),

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

    // Health monitoring (added for performance monitoring)
    lastHealthCheck: v.optional(v.number()), // Last health check timestamp
    avgResponseTime: v.optional(v.number()), // Average response time in milliseconds
    isHealthy: v.optional(v.boolean()), // Current health status
    healthStatus: v.optional(v.string()), // 'healthy', 'degraded', 'critical', 'unknown'
    healthIssues: v.optional(v.array(v.string())), // List of current health issues

    // Discovery metadata (added for model discovery)
    discoveredAt: v.optional(v.number()), // When the model was first discovered
    lastValidatedAt: v.optional(v.number()), // Last time model schema was validated
    schemaVersion: v.optional(v.string()), // Version of the model schema
    inputSchema: v.optional(v.any()), // OpenAPI schema for inputs
    outputSchema: v.optional(v.any()), // OpenAPI schema for outputs
    confidence: v.optional(v.number()), // Confidence score (0-100) that this is a video model

    // Enhanced model metadata
    supportedInputTypes: v.optional(v.array(v.string())), // Types of inputs supported
    supportedOutputFormats: v.optional(v.array(v.string())), // Output formats supported
    maxInputSize: v.optional(v.number()), // Maximum input size in bytes
    estimatedProcessingTime: v.optional(v.number()), // Estimated processing time per second

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
    .index("by_active_and_premium", ["isActive", "isPremium"])
    .index("by_provider", ["provider"])
    .index("by_version", ["version"])
    .index("by_health", ["lastHealthCheck"])
    .index("by_discovery", ["discoveredAt"]),

  replicateMetrics: defineTable({
    // Model and operation identification
    modelId: v.string(), // Model that was used
    operation: v.string(), // "create_prediction", "get_prediction", "list_models", etc.

    // Performance metrics
    duration: v.number(), // Operation duration in milliseconds
    success: v.boolean(), // Whether the operation succeeded

    // Error information (for failed operations)
    errorType: v.optional(v.string()), // ReplicateErrorType enum value
    errorMessage: v.optional(v.string()), // Error message
    errorStatus: v.optional(v.number()), // HTTP status code

    // Additional context
    context: v.optional(v.any()), // Additional context data

    // Timestamp
    timestamp: v.number(), // When the operation occurred
  })
    .index("by_model_id", ["modelId"])
    .index("by_model_and_timestamp", ["modelId", "timestamp"])
    .index("by_success", ["success"])
    .index("by_error_type", ["errorType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_operation", ["operation"]),

  modelDiscoveryLogs: defineTable({
    discoveryId: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    modelsFound: v.optional(v.number()),
    modelsUpdated: v.optional(v.number()),
    modelsAdded: v.optional(v.number()),
    modelsRemoved: v.optional(v.number()),
    errors: v.optional(v.array(v.string())),
    duration: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_discovery_id", ["discoveryId"])
    .index("by_status", ["status"])
    .index("by_started_at", ["startedAt"]),
});
