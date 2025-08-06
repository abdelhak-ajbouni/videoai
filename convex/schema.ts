import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Simplified user profiles - only app-specific data
  userProfiles: defineTable({
    clerkId: v.string(), // Link to Clerk user
    credits: v.number(), // Current credit balance
    totalCreditsUsed: v.number(), // Lifetime usage tracking
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  videos: defineTable({
    // User relationship
    clerkId: v.string(),

    // Video metadata
    prompt: v.string(),
    description: v.optional(v.string()),

    // Generation settings
    model: v.string(), // Accept any model ID string
    quality: v.union(
      v.literal("standard"),
      v.literal("high"),
      v.literal("ultra")
    ),
    duration: v.string(), // Accept any duration string

    // Generic generation settings (model-specific params moved to modelParameters table)
    generationSettings: v.optional(v.any()), // Frontend form values for reference

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

    // File storage
    videoUrl: v.optional(v.string()), // Primary video URL (CDN or external)
    r2FileKey: v.optional(v.string()), // CDN storage key

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
  }).index("by_clerk_id", ["clerkId"]),

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

    // Stripe data - core identifiers
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),

    // Subscription details
    tier: v.string(), // References planId from subscriptionPlans
    status: v.union(
      v.literal("incomplete"),
      v.literal("incomplete_expired"),
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("unpaid"),
      v.literal("paused")
    ),

    // Cancellation details (from Stripe)
    cancelAtPeriodEnd: v.boolean(),
    canceledAt: v.optional(v.number()), // Timestamp when subscription was canceled (from Stripe)
    cancelAt: v.optional(v.number()), // Scheduled cancellation timestamp (from Stripe)

    // Subscription lifecycle (from Stripe)
    startDate: v.optional(v.number()), // When subscription started
    endedAt: v.optional(v.number()), // When subscription ended

    // Trial information (from Stripe)
    trialStart: v.optional(v.number()),
    trialEnd: v.optional(v.number()),

    // Collection method (from Stripe)
    collectionMethod: v.optional(
      v.union(v.literal("charge_automatically"), v.literal("send_invoice"))
    ),

    // Latest invoice reference (from Stripe)
    latestInvoice: v.optional(v.string()),

    // Stripe metadata as record
    metadata: v.optional(v.record(v.string(), v.string())),

    // Billing details (from Stripe)
    billingCycleAnchor: v.optional(v.number()),

    // Billing period (from Stripe subscription items)
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),

    // Credits - app-specific fields
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
    .index("by_cancel_at", ["cancelAt"])
    .index("by_trial_end", ["trialEnd"])
    .index("by_current_period_end", ["currentPeriodEnd"]),

  subscriptionItems: defineTable({
    // Links
    subscriptionId: v.id("subscriptions"),
    stripeSubscriptionId: v.string(),
    stripeSubscriptionItemId: v.string(),

    // Stripe subscription item data
    stripePriceId: v.string(),
    quantity: v.number(),

    // Price details for reference
    priceData: v.object({
      unitAmount: v.number(),
      currency: v.string(),
      recurring: v.optional(
        v.object({
          interval: v.union(
            v.literal("day"),
            v.literal("week"),
            v.literal("month"),
            v.literal("year")
          ),
          intervalCount: v.number(),
        })
      ),
    }),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subscription_id", ["subscriptionId"])
    .index("by_stripe_subscription_id", ["stripeSubscriptionId"])
    .index("by_stripe_subscription_item_id", ["stripeSubscriptionItemId"]),

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
    // Basic model info
    modelId: v.string(), // "google/veo-3", "luma/ray-2-540p", etc.
    name: v.string(), // "Google Veo-3", "Luma Ray Flash 2-540p", etc.
    description: v.string(), // Human-readable description

    // Replicate integration
    replicateModelId: v.string(), // Full Replicate model identifier with version

    // Model type/category for grouping (replaces hardcoded string matching)
    modelType: v.string(), // "google_veo", "luma_ray", "stability_ai", etc.

    // Model status
    isActive: v.boolean(), // Whether model is available for use
    isDefault: v.boolean(), // Default model for new users
    isPremium: v.boolean(), // Premium model flag

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_model_id", ["modelId"])
    .index("by_active", ["isActive"])
    .index("by_default", ["isDefault"])
    .index("by_model_type", ["modelType"])
    .index("by_active_type", ["isActive", "modelType"])
    .index("by_active_premium", ["isActive", "isPremium"]),

  // Model parameters - dynamic parameter configuration for each model
  modelParameters: defineTable({
    // Link to model
    modelId: v.string(), // e.g., "luma/ray-2-540p", "google/veo-3"

    // Parameter configuration
    parameterDefinitions: v.optional(v.any()), // JSON object defining all possible parameters
    constraints: v.optional(v.any()), // Min/max values, allowed values, etc.
    mappingRules: v.optional(v.any()), // JSON object defining the mapping rules
    parameterCategories: v.optional(v.array(v.string())), // ["basic", "advanced", "style"]
    updatedAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
  }).index("by_model_id", ["modelId"]),

  // Model resolution costs - actual cost per second for each resolution per model
  modelCosts: defineTable({
    // Link to model
    modelId: v.string(), // e.g., "hailuo_02", "seedance_pro", "veo_3"

    // Resolution-specific costs
    resolution: v.string(), // e.g., "480p", "512p", "720p", "768p", "1080p"
    costPerSecond: v.number(), // Actual cost in USD per second for this resolution

    // Metadata
    isActive: v.boolean(), // Whether this resolution cost is active
    notes: v.optional(v.string()), // Optional notes about this resolution cost

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_model_id", ["modelId"])
    .index("by_model_and_resolution", ["modelId", "resolution"])
    .index("by_active", ["isActive"]),

  // Video parameters - stores the actual parameters used for each video generation
  videoParameters: defineTable({
    // Link to video
    videoId: v.id("videos"),

    // Model identification
    modelId: v.string(), // e.g., "luma/ray-2-540p", "google/veo-3"

    // Raw parameters as JSON object - flexible for any model
    parameters: v.any(), // Will contain the actual parameters used for generation

    // Parameter mapping for debugging/analytics
    parameterMapping: v.optional(v.any()), // Maps frontend params to API params

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_video_id", ["videoId"])
    .index("by_model_id", ["modelId"]),
});
