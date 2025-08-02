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
        supportedAspectRatios: [
          "1:1",
          "3:4",
          "4:3",
          "9:16",
          "16:9",
          "9:21",
          "21:9",
        ],
        defaultAspectRatio: "16:9",
        supportsLoop: true,
        supportsCameraConcepts: true,
        cameraConcepts: [
          "pan_right",
          "pan_left",
          "zoom_in",
          "zoom_out",
          "aerial_drone",
          "truck_left",
          "truck_right",
          "low_angle",
          "high_angle",
        ],
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
        supportedAspectRatios: [
          "1:1",
          "3:4",
          "4:3",
          "9:16",
          "16:9",
          "9:21",
          "21:9",
        ],
        defaultAspectRatio: "16:9",
        supportsLoop: true,
        supportsCameraConcepts: true,
        cameraConcepts: [
          "pan_right",
          "pan_left",
          "zoom_in",
          "zoom_out",
          "aerial_drone",
          "truck_left",
          "truck_right",
          "low_angle",
          "high_angle",
        ],
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
  // Seed Data for Development
  {
    key: "sample_video_urls",
    category: "development",
    name: "Sample Video URLs",
    description: "Sample video URLs for development and testing",
    value: {
      standard:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      high: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
      ultra:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    },
    dataType: "object" as const,
    isActive: true,
    isEditable: true,
  },
  {
    key: "mock_generation_times",
    category: "development",
    name: "Mock Generation Times",
    description: "Base processing times per second for different qualities",
    value: {
      standard: 2000, // 2 seconds processing per 1 second of video
      high: 4000, // 4 seconds processing per 1 second of video
      ultra: 8000, // 8 seconds processing per 1 second of video
    },
    dataType: "object" as const,
    isActive: true,
    isEditable: true,
  },
  {
    key: "video_quality_specs",
    category: "development",
    name: "Video Quality Specifications",
    description: "Video specifications for different quality tiers",
    value: {
      standard: { width: 1280, height: 720, bitrate: 2000 },
      high: { width: 1920, height: 1080, bitrate: 5000 },
      ultra: { width: 3840, height: 2160, bitrate: 15000 },
    },
    dataType: "object" as const,
    isActive: true,
    isEditable: true,
  },
  {
    key: "sample_prompts",
    category: "development",
    name: "Sample Video Prompts",
    description: "Sample prompts for testing video generation",
    value: [
      "A serene mountain landscape at sunset",
      "A bustling city street with people walking",
      "A cute cat playing with a ball of yarn",
      "A futuristic robot walking through a neon-lit corridor",
      "A peaceful forest with sunlight filtering through trees",
      "A rocket launching into space",
      "A chef preparing a delicious meal",
      "A car driving through a scenic countryside",
      "A dancer performing on stage",
      "A bird flying over a beautiful ocean",
    ],
    dataType: "array" as const,
    isActive: true,
    isEditable: true,
  },
  {
    key: "test_user_data",
    category: "development",
    name: "Test User Data",
    description: "Sample user data for development testing",
    value: {
      testUsers: [
        {
          email: "test@example.com",
          name: "Test User",
          credits: 100,
          subscriptionTier: "free",
        },
        {
          email: "pro@example.com",
          name: "Pro User",
          credits: 500,
          subscriptionTier: "pro",
        },
        {
          email: "business@example.com",
          name: "Business User",
          credits: 2000,
          subscriptionTier: "max",
        },
      ],
    },
    dataType: "object" as const,
    isActive: true,
    isEditable: true,
  },
];

// Clean AI models data - only essential fields
const defaultModels = [
  {
    modelId: "google/veo-3",
    name: "Google Veo-3",
    description:
      "High-quality video generation with exceptional visual fidelity",
    replicateModelId:
      "google/veo-3:838c69a013a666f41312ba018c1ae55a2807f27c109a9cb93b22a45f207ad918",
    costPerSecond: 0.75,
    supportedDurations: [8],
    fixedDuration: 8,

    // UI capabilities
    supportedResolutions: ["720p", "1080p"],
    supportedAspectRatios: undefined,
    supportedCameraConcepts: undefined,
    supportsLoop: false,
    defaultResolution: "720p",
    defaultAspectRatio: undefined,
    defaultCameraConcept: undefined,
    defaultLoop: false,
    parameterMappings: {
      resolution: "resolution",
      startImageUrl: "image",
    },
    modelType: "google_veo",
    apiProvider: "replicate",

    isActive: true,
    isDefault: false,
    isPremium: true,
  },
  {
    modelId: "luma/ray-2-720p",
    name: "Luma Ray-2-720p",
    description: "Fast, cost-effective video generation for content creators",
    replicateModelId:
      "luma/ray-2-720p:ea6eddb9ec29298592b0a8da0aa8783d0cdb2493e87c93f36bbcab28ab133664",
    costPerSecond: 0.18,
    supportedDurations: [5, 9],

    // UI capabilities
    supportedResolutions: undefined,
    supportedAspectRatios: [
      "1:1",
      "3:4",
      "4:3",
      "9:16",
      "16:9",
      "9:21",
      "21:9",
    ],
    supportedCameraConcepts: [
      "pan_right",
      "pan_left",
      "zoom_in",
      "zoom_out",
      "aerial_drone",
      "truck_left",
      "truck_right",
      "low_angle",
      "high_angle",
    ],
    supportsLoop: true,
    defaultResolution: undefined,
    defaultAspectRatio: "16:9",
    defaultCameraConcept: "none",
    defaultLoop: false,
    parameterMappings: {
      duration: "duration",
      aspectRatio: "aspect_ratio",
      cameraConcept: "concepts",
      loop: "loop",
    },
    modelType: "luma_ray",
    apiProvider: "replicate",

    isActive: true,
    isDefault: false,
    isPremium: false,
  },
  {
    modelId: "luma/ray-flash-2-540p",
    name: "Luma Ray Flash 2-540p",
    description:
      "Ultra-fast, ultra-cheap video generation for rapid prototyping",
    replicateModelId:
      "luma/ray-2-540p:b2fff4dff3600325413f28ba60bab61e8b7556d8533168f785d6e7d861a727e1",
    costPerSecond: 0.12,
    supportedDurations: [5, 9],

    // UI capabilities
    supportedResolutions: undefined,
    supportedAspectRatios: [
      "1:1",
      "3:4",
      "4:3",
      "9:16",
      "16:9",
      "9:21",
      "21:9",
    ],
    supportedCameraConcepts: [
      "pan_right",
      "pan_left",
      "zoom_in",
      "zoom_out",
      "aerial_drone",
      "truck_left",
      "truck_right",
      "low_angle",
      "high_angle",
    ],
    supportsLoop: true,
    defaultResolution: undefined,
    defaultAspectRatio: "16:9",
    defaultCameraConcept: "none",
    defaultLoop: false,
    parameterMappings: {
      duration: "duration",
      aspectRatio: "aspect_ratio",
      cameraConcept: "concepts",
      loop: "loop",
    },
    modelType: "luma_ray",
    apiProvider: "replicate",

    isActive: true,
    isDefault: true,
    isPremium: false,
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
    planId: "max",
    name: "Max",
    description: "Enterprise-grade features for teams and businesses",
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

// Migration function to clean up database
async function runMigrations(ctx: MutationCtx) {
  // Migration 1: Clean up models table - replace with clean schema
  const existingModels = await ctx.db.query("models").collect();
  if (existingModels.length > 0) {
    // Delete old models
    for (const model of existingModels) {
      await ctx.db.delete(model._id);
    }

    // Insert clean models
    const now = Date.now();
    for (const model of defaultModels) {
      await ctx.db.insert("models", {
        ...model,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Migration 2: Populate modelParameters table for existing videos
  const videos = await ctx.db.query("videos").collect();
  let parametersCreated = 0;
  let alreadyExists = 0;

  for (const video of videos) {
    // Check if modelParameters already exists for this video
    const existingParams = await ctx.db
      .query("modelParameters")
      .withIndex("by_video_id", (q) => q.eq("videoId", video._id))
      .first();

    if (existingParams) {
      alreadyExists++;
      continue;
    }

    // Create parameters based on video data and model type
    const frontendParams = {
      prompt: video.prompt,
      duration: video.duration,
      quality: video.quality,
      ...(video.generationSettings || {}),
    };

    // Map parameters using inline logic
    let apiParameters: any = { prompt: video.prompt };

    if (video.model.includes("luma/ray")) {
      // Luma Ray models
      apiParameters.duration = parseInt(video.duration);
      apiParameters.aspect_ratio = frontendParams.aspectRatio || "16:9";

      if (
        frontendParams.cameraConcept &&
        frontendParams.cameraConcept !== "none"
      ) {
        apiParameters.concepts = [frontendParams.cameraConcept];
      }

      if (frontendParams.loop) {
        apiParameters.loop = frontendParams.loop;
      }

      if (frontendParams.startImageUrl) {
        apiParameters.start_image = frontendParams.startImageUrl;
      }

      if (frontendParams.endImageUrl) {
        apiParameters.end_image = frontendParams.endImageUrl;
      }
    } else if (video.model.includes("google/veo")) {
      // Google Veo models
      apiParameters.resolution = frontendParams.resolution || "720p";

      if (frontendParams.startImageUrl) {
        apiParameters.image = frontendParams.startImageUrl;
      }

      apiParameters.seed = Math.floor(Math.random() * 1000000);
    } else {
      // Default format
      apiParameters.duration_seconds = parseInt(video.duration);
      apiParameters.aspect_ratio = frontendParams.aspectRatio || "16:9";
      apiParameters.seed = Math.floor(Math.random() * 1000000);
    }

    // Create modelParameters record
    await ctx.db.insert("modelParameters", {
      videoId: video._id,
      modelId: video.model,
      parameters: apiParameters,
      parameterMapping: {
        frontendParameters: frontendParams,
        mappingLog: [`Parameters mapped for ${video.model}`],
      },
      createdAt: video.createdAt,
    });

    parametersCreated++;
  }

  // Migration 3: Remove old thumbnail fields from existing video records
  let thumbnailFieldsRemoved = 0;
  for (const video of videos) {
    // Check if video has the old thumbnail fields
    const videoData = video as any;
    if (videoData.thumbnailFileId || videoData.thumbnailUrl) {
      // Remove the old fields by patching without them
      const { thumbnailFileId, thumbnailUrl, ...cleanedVideo } = videoData;

      // Update the video record without thumbnail fields
      await ctx.db.replace(video._id, {
        ...cleanedVideo,
        updatedAt: Date.now(),
      });

      thumbnailFieldsRemoved++;
    }
  }

  // Migration 4: Remove title fields from existing video records
  let titleFieldsRemoved = 0;
  for (const video of videos) {
    // Check if video has the old title field
    const videoData = video as any;
    if (videoData.title !== undefined) {
      // Remove the title field by patching without it
      const { title, ...cleanedVideo } = videoData;

      // Update the video record without title field
      await ctx.db.replace(video._id, {
        ...cleanedVideo,
        updatedAt: Date.now(),
      });

      titleFieldsRemoved++;
    }
  }

  console.log(`Migrations completed:
    - Models cleaned and recreated
    - Model parameters created: ${parametersCreated}, already existed: ${alreadyExists}
    - Thumbnail fields removed: ${thumbnailFieldsRemoved}
    - Title fields removed: ${titleFieldsRemoved}
  `);
}

export default internalMutation({
  handler: async (ctx: MutationCtx) => {
    const now = Date.now();

    // Check if this is the first run or if we need to run migrations
    const anyConfig = await ctx.db.query("configurations").first();
    const isFirstRun = !anyConfig;

    // Run migrations for existing databases
    if (!isFirstRun) {
      await runMigrations(ctx);
      return;
    }

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
