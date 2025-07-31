import { internalMutation, type MutationCtx } from "./_generated/server";

// Default configurations data
const defaultConfigs = [
  // Business Configuration
  {
    key: "profit_margin",
    category: "business",
    name: "Profit Margin",
    description: "Profit margin multiplier (e.g., 1.32 = 32% markup)",
    value: 1.32,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 1.0,
    maxValue: 2.0,
  },
  {
    key: "credits_per_dollar",
    category: "business",
    name: "Credits Per Dollar",
    description: "Number of credits equivalent to $1 USD",
    value: 50,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 1,
    maxValue: 1000,
  },
  {
    key: "free_tier_credits",
    category: "business",
    name: "Free Tier Credits",
    description: "Number of credits given to new users",
    value: 10,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 0,
    maxValue: 1000,
  },
  // Quality Multipliers
  {
    key: "quality_multipliers",
    category: "pricing",
    name: "Quality Multipliers",
    description: "Cost multipliers for different quality tiers",
    value: {
      standard: 1.0,
      high: 1.2,
      ultra: 1.5,
    },
    dataType: "object" as const,
    isActive: true,
    isEditable: true,
  },
  // Model Configurations
  {
    key: "model_configs",
    category: "models",
    name: "AI Model Configurations",
    description: "Configuration for all supported AI models",
    value: {
      "google/veo-3": {
        name: "Google Veo-3",
        description: "High-quality video generation with audio",
        costPerSecond: 0.75,
        fixedDuration: 8,
        supportedDurations: [8],
        supportedResolutions: ["720p", "1080p"],
        defaultResolution: "720p",
        supportsAudio: true,
        isPremium: true,
        isDefault: false,
      },
      "luma/ray-2-720p": {
        name: "Luma Ray-2-720p",
        description: "Fast, cost-effective video generation",
        costPerSecond: 0.18,
        supportedDurations: [5, 9],
        supportedResolutions: ["720p"],
        defaultResolution: "720p",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9", "9:21", "21:9"],
        defaultAspectRatio: "16:9",
        supportsLoop: true,
        supportsCameraConcepts: true,
        cameraConcepts: ["pan_right", "pan_left", "zoom_in", "zoom_out", "aerial_drone", "truck_left", "truck_right", "low_angle", "high_angle"],
        supportsStartEndImages: true,
        isPremium: false,
        isDefault: false,
      },
      "luma/ray-flash-2-540p": {
        name: "Luma Ray Flash 2-540p",
        description: "Ultra-fast, ultra-cheap video generation",
        costPerSecond: 0.12,
        supportedDurations: [5, 9],
        supportedResolutions: ["540p"],
        defaultResolution: "540p",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9", "9:21", "21:9"],
        defaultAspectRatio: "16:9",
        supportsLoop: true,
        supportsCameraConcepts: true,
        cameraConcepts: ["pan_right", "pan_left", "zoom_in", "zoom_out", "aerial_drone", "truck_left", "truck_right", "low_angle", "high_angle"],
        supportsStartEndImages: true,
        isPremium: false,
        isDefault: true,
        isFast: true,
      },
    },
    dataType: "object" as const,
    isActive: true,
    isEditable: true,
  },
  // Feature Flags
  {
    key: "enable_ultra_quality",
    category: "features",
    name: "Enable Ultra Quality",
    description: "Whether ultra quality tier is available",
    value: true,
    dataType: "boolean" as const,
    isActive: true,
    isEditable: true,
  },
  {
    key: "enable_priority_processing",
    category: "features",
    name: "Enable Priority Processing",
    description:
      "Whether priority processing is available for Pro/Business users",
    value: true,
    dataType: "boolean" as const,
    isActive: true,
    isEditable: true,
  },
  {
    key: "enable_api_access",
    category: "features",
    name: "Enable API Access",
    description: "Whether API access is available for Business users",
    value: true,
    dataType: "boolean" as const,
    isActive: true,
    isEditable: true,
  },
  // System Limits
  {
    key: "max_prompt_length",
    category: "limits",
    name: "Maximum Prompt Length",
    description: "Maximum number of characters allowed in video prompts",
    value: 500,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 100,
    maxValue: 2000,
  },
  {
    key: "max_concurrent_generations",
    category: "limits",
    name: "Maximum Concurrent Generations",
    description: "Maximum number of videos a user can generate simultaneously",
    value: 3,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 1,
    maxValue: 10,
  },
  {
    key: "max_video_duration",
    category: "limits",
    name: "Maximum Video Duration",
    description: "Maximum video duration in seconds",
    value: 60,
    dataType: "number" as const,
    isActive: true,
    isEditable: true,
    minValue: 5,
    maxValue: 120,
  },
  // Subscription Quality Access
  {
    key: "subscription_quality_access",
    category: "subscriptions",
    name: "Subscription Quality Access",
    description: "Quality tiers available for each subscription level",
    value: {
      free: ["standard"],
      starter: ["standard", "high"],
      pro: ["standard", "high", "ultra"],
      business: ["standard", "high", "ultra"],
    },
    dataType: "object" as const,
    isActive: true,
    isEditable: true,
  },
];

// Default AI models data
const defaultModels = [
  {
    modelId: "google/veo-3",
    name: "Google Veo-3",
    description:
      "High-quality video generation with exceptional visual fidelity",
    version: "1.0",
    costPerSecond: 0.75,
    supportedDurations: [8],
    supportedQualities: ["standard", "high", "ultra"],
    fixedDuration: 8,
    isPremium: true,
    isFast: false,
    isActive: true,
    isDefault: false,
    isDeprecated: false,
    provider: "Google",
    category: "premium",
    tags: ["high-quality", "professional", "premium"],
    replicateModelId: "google/veo-3",
    modelParameters: {
      quality: "high",
      aspect_ratio: "16:9",
    },
    requirements: {
      minCredits: 396,
      maxDuration: 8,
    },
    // Model-specific options
    supportedResolutions: ["720p", "1080p"],
    defaultResolution: "720p",
    supportsAudio: true,
  },
  {
    modelId: "luma/ray-2-720p",
    name: "Luma Ray-2-720p",
    description: "Fast, cost-effective video generation for content creators",
    version: "2.0",
    costPerSecond: 0.18,
    supportedDurations: [5, 9],
    supportedQualities: ["standard", "high", "ultra"],
    maxDuration: 9,
    isPremium: false,
    isFast: true,
    isActive: true,
    isDefault: false,
    isDeprecated: false,
    provider: "Luma",
    category: "budget",
    tags: ["fast", "cost-effective", "content-creation"],
    replicateModelId: "luma/ray-2-720p",
    modelParameters: {
      quality: "720p",
      aspect_ratio: "16:9",
    },
    requirements: {
      minCredits: 60,
      maxDuration: 9,
    },
    // Model-specific options
    supportedResolutions: ["720p"],
    defaultResolution: "720p",
    supportedAspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9", "9:21", "21:9"],
    defaultAspectRatio: "16:9",
    supportsLoop: true,
    supportsCameraConcepts: true,
    cameraConcepts: ["pan_right", "pan_left", "zoom_in", "zoom_out", "aerial_drone", "truck_left", "truck_right", "low_angle", "high_angle"],
    supportsStartEndImages: true,
  },
  {
    modelId: "luma/ray-flash-2-540p",
    name: "Luma Ray Flash 2-540p",
    description:
      "Ultra-fast, ultra-cheap video generation for rapid prototyping",
    version: "2.1",
    costPerSecond: 0.12,
    supportedDurations: [5, 9],
    supportedQualities: ["standard", "high", "ultra"],
    maxDuration: 9,
    isPremium: false,
    isFast: true,
    isActive: true,
    isDefault: true,
    isDeprecated: false,
    provider: "Luma",
    category: "budget",
    tags: ["ultra-fast", "ultra-cheap", "prototyping"],
    replicateModelId: "luma/ray-flash-2-540p",
    modelParameters: {
      quality: "540p",
      aspect_ratio: "16:9",
    },
    requirements: {
      minCredits: 40,
      maxDuration: 9,
    },
    // Model-specific options
    supportedResolutions: ["540p"],
    defaultResolution: "540p",
    supportedAspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9", "9:21", "21:9"],
    defaultAspectRatio: "16:9",
    supportsLoop: true,
    supportsCameraConcepts: true,
    cameraConcepts: ["pan_right", "pan_left", "zoom_in", "zoom_out", "aerial_drone", "truck_left", "truck_right", "low_angle", "high_angle"],
    supportsStartEndImages: true,
  },
];

// Default credit packages data
const defaultPackages = [
  {
    packageId: "small",
    name: "Small",
    description: "Perfect for getting started",
    price: 2000,
    currency: "usd",
    credits: 100,
    isActive: true,
    isPopular: false,
  },
  {
    packageId: "medium",
    name: "Medium",
    description: "Great value for regular users",
    price: 4500,
    currency: "usd",
    credits: 250,
    isActive: true,
    isPopular: true,
  },
  {
    packageId: "large",
    name: "Large",
    description: "For power users and creators",
    price: 8000,
    currency: "usd",
    credits: 500,
    isActive: true,
    isPopular: false,
  },
  {
    packageId: "xlarge",
    name: "X-Large",
    description: "Maximum value for heavy usage",
    price: 15000,
    currency: "usd",
    credits: 1000,
    isActive: true,
    isPopular: false,
  },
] as const;

// Default subscription plans data
const defaultPlans = [
  {
    planId: "starter",
    name: "Starter",
    description: "Perfect for getting started with video generation",
    priceId: "price_starter",
    price: 999,
    currency: "usd",
    monthlyCredits: 100,
    features: [
      "100 credits per month",
      "HD video quality",
      "Standard support",
      "Personal video library",
    ],
    isActive: true,
    isPopular: false,
  },
  {
    planId: "pro",
    name: "Pro",
    description: "For creators who need more power and features",
    priceId: "price_pro",
    price: 2999,
    currency: "usd",
    monthlyCredits: 500,
    features: [
      "500 credits per month",
      "HD + Ultra video quality",
      "Priority processing",
      "Advanced analytics",
      "Priority support",
    ],
    isActive: true,
    isPopular: true,
  },
  {
    planId: "business",
    name: "Business",
    description: "Enterprise-grade features for teams and businesses",
    priceId: "price_business",
    price: 9999,
    currency: "usd",
    monthlyCredits: 2000,
    features: [
      "2000 credits per month",
      "4K video quality",
      "API access",
      "Team management",
      "Dedicated support",
      "Custom integrations",
    ],
    isActive: true,
    isPopular: false,
  },
];

export default internalMutation({
  handler: async (ctx: MutationCtx) => {
    const now = Date.now();

    // If this project already has a populated database, do nothing
    const anyConfig = await ctx.db.query("configurations").first();
    if (anyConfig) return;

    // Initialize configurations
    for (const config of defaultConfigs) {
      await ctx.db.insert("configurations", {
        ...config,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Initialize AI models
    for (const model of defaultModels) {
      await ctx.db.insert("models", {
        ...model,
        totalGenerations: 0,
        averageGenerationTime: undefined,
        successRate: undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Initialize credit packages
    for (const package_ of defaultPackages) {
      await ctx.db.insert("creditPackages", {
        ...package_,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Initialize subscription plans
    for (const plan of defaultPlans) {
      await ctx.db.insert("subscriptionPlans", {
        ...plan,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
