import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { calculateCreditCost } from "./pricing";
import { createReplicateClient } from "./lib/replicateClient";
import {
  mapParametersForModel,
  validateParametersForModel,
} from "./modelParameterHelpers";
import {
  validateVideoGeneration,
  validateUserCredits,
  validateModelCapabilities,
  throwValidationError,
  logValidationWarnings,
  sanitizeString,
  validatePagination,
} from "./lib/validation";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";

const r2 = new R2(components.r2);

// Helper function to generate dynamic R2 URL for a video
async function generateDynamicVideoUrl(ctx: any, video: any): Promise<string> {
  let videoUrl = video.videoUrl; // Default fallback

  // Generate fresh R2 URL if video is stored in R2
  if (video.r2FileKey) {
    try {
      videoUrl = await r2.getUrl(video.r2FileKey, {
        expiresIn: 3600, // 1 hour expiration
      });
    } catch (error) {
      console.error("Failed to generate R2 URL:", error);
      // Fallback to stored URL
      videoUrl = video.videoCdnUrl || video.videoUrl;
    }
  }

  return videoUrl;
}

// Query to get user's videos with file URLs
export const getUserVideos = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const videos = await ctx.db
      .query("videos")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .order("desc")
      .collect();

    // Return videos with dynamically generated R2 URLs
    return Promise.all(
      videos.map(async (video) => {
        const videoUrl = await generateDynamicVideoUrl(ctx, video);
        return {
          ...video,
          videoUrl,
        };
      })
    );
  },
});

// Query to get a specific video with file URL
export const getVideo = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    if (video.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const videoUrl = await generateDynamicVideoUrl(ctx, video);
    return {
      ...video,
      videoUrl,
    };
  },
});

// Query to get videos by status
export const getVideosByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("canceled")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const videos = await ctx.db
      .query("videos")
      .withIndex("by_clerk_id_and_status", (q) =>
        q.eq("clerkId", identity.subject).eq("status", args.status)
      )
      .order("desc")
      .collect();

    // Return videos with dynamically generated R2 URLs
    return Promise.all(
      videos.map(async (video) => {
        const videoUrl = await generateDynamicVideoUrl(ctx, video);
        return {
          ...video,
          videoUrl,
        };
      })
    );
  },
});

// Query to get latest videos from all users except current user
export const getLatestVideosFromOthers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get all completed videos from all users except current user
    const allVideos = await ctx.db
      .query("videos")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc")
      .collect();

    // Filter out videos from current user and private videos, then limit results
    const otherUsersVideos = allVideos
      .filter(
        (video) =>
          video.clerkId !== identity.subject && video.isPublic !== false // Only show public videos (excludes private videos)
      )
      .slice(0, args.limit || 12);

    // Return videos with dynamically generated R2 URLs
    return Promise.all(
      otherUsersVideos.map(async (video) => {
        const videoUrl = await generateDynamicVideoUrl(ctx, video);
        return {
          ...video,
          videoUrl,
        };
      })
    );
  },
});

// Mutation to create a new video generation request
export const createVideo = mutation({
  args: {
    prompt: v.string(),
    model: v.string(), // Accept any model ID string
    quality: v.union(
      v.literal("standard"),
      v.literal("high"),
      v.literal("ultra")
    ),
    duration: v.string(), // Keep as string for compatibility
    // Generic parameters object - flexible for any model
    generationSettings: v.optional(v.any()), // Contains all model-specific options
    isPublic: v.optional(v.boolean()), // Video visibility setting
  },
  handler: async (ctx, args): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // ============================================================================
    // INPUT VALIDATION
    // ============================================================================

    // Sanitize and validate input parameters
    const sanitizedArgs = {
      prompt: sanitizeString(args.prompt, 1000),
      model: sanitizeString(args.model, 100),
      quality: args.quality,
      duration: sanitizeString(args.duration, 50),
      generationSettings: args.generationSettings,
    };

    // Validate video generation parameters
    const validation = validateVideoGeneration(sanitizedArgs);
    if (!validation.isValid) {
      throwValidationError(
        validation.errors,
        "Video generation validation failed"
      );
    }

    // Log warnings if any
    logValidationWarnings(validation.warnings || [], "Video generation");

    // ============================================================================
    // USER AND SUBSCRIPTION VALIDATION
    // ============================================================================

    // Get user profile to check credits and subscription
    const userProfile = await ctx.runQuery(api.userProfiles.getUserProfile, {
      clerkId: identity.subject,
    });

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // Get subscription to check tier
    const subscription = await ctx.runQuery(api.subscriptions.getSubscription, {
      clerkId: identity.subject,
    });

    const subscriptionTier = subscription?.tier || "free";

    // ============================================================================
    // MODEL VALIDATION
    // ============================================================================

    // Validate model exists and is active
    const model = await ctx.db
      .query("models")
      .withIndex("by_model_id", (q) => q.eq("modelId", sanitizedArgs.model))
      .first();

    if (!model) {
      throw new Error("Selected model not found");
    }

    if (!model.isActive) {
      throw new Error("Selected model is not currently available");
    }

    // Fetch model parameters for validation
    const modelParams = await ctx.db
      .query("modelParameters")
      .withIndex("by_model_id", (q) => q.eq("modelId", sanitizedArgs.model))
      .first();

    // Transform model parameters to the format expected by validation
    let modelCapabilities = null;
    if (modelParams && modelParams.parameterDefinitions) {
      const params = modelParams.parameterDefinitions;
      modelCapabilities = {
        supportedDurations: params.duration?.allowedValues || [],
        supportedResolutions: params.resolution?.allowedValues || [],
        supportedAspectRatios: params.aspectRatio?.allowedValues || [],
        supportedCameraConcepts: params.cameraConcept?.allowedValues || [],
        supportsLoop: !!params.loop,
      };
    }

    // Validate model capabilities against generation parameters
    const modelValidation = validateModelCapabilities(
      model,
      modelCapabilities,
      {
        duration: sanitizedArgs.duration,
        ...(sanitizedArgs.generationSettings || {}),
      }
    );

    if (!modelValidation.isValid) {
      throwValidationError(
        modelValidation.errors,
        "Model capability validation failed"
      );
    }

    // Prepare frontend parameters for validation
    const frontendParams = {
      prompt: sanitizedArgs.prompt,
      duration: sanitizedArgs.duration,
      quality: sanitizedArgs.quality,
      ...(sanitizedArgs.generationSettings || {}),
    };

    // Validate model capabilities using helper function
    const parameterValidation = validateParametersForModel(
      model,
      frontendParams
    );
    if (!parameterValidation.isValid) {
      throw new Error(
        `Parameter validation failed: ${parameterValidation.errors.join(", ")}`
      );
    }

    // Quality validation removed - all models support all quality levels
    // Pricing is handled via quality multipliers in the pricing system

    // Check quality access based on subscription
    const hasQualityAccess = checkQualityAccess(subscriptionTier, args.quality);

    // Check resolution access based on subscription tier
    if (args.generationSettings?.resolution === "1080p") {
      if (subscriptionTier !== "pro" && subscriptionTier !== "max") {
        throw new Error(
          "1080p resolution is only available for Pro and Max plan subscribers"
        );
      }
    }
    if (!hasQualityAccess) {
      throw new Error(
        "Your subscription plan doesn't support this quality tier"
      );
    }

    // Calculate credit cost based on model, quality and duration
    const creditsCost = await calculateCreditCost(
      ctx,
      args.model,
      args.quality,
      parseInt(args.duration)
    );

    // Check if user has enough credits
    if (userProfile.credits < creditsCost) {
      throw new Error("Insufficient credits");
    }

    const now = Date.now();

    // Determine video privacy based on subscription tier and user preference
    let finalIsPublic = true; // Default to public

    if (args.isPublic !== undefined) {
      // User has specified a preference
      if (!args.isPublic && subscriptionTier !== "max") {
        // User wants private video but doesn't have Max plan
        throw new Error(
          "Private videos are only available for Max plan subscribers"
        );
      }
      finalIsPublic = args.isPublic;
    } else {
      // No preference specified, use tier-based default
      // Max plan users get private videos by default for premium privacy
      finalIsPublic = subscriptionTier !== "max";
    }

    // Create video record
    const videoId = await ctx.db.insert("videos", {
      clerkId: identity.subject,
      prompt: args.prompt,
      model: args.model,
      quality: args.quality,
      duration: args.duration,
      status: "pending",
      creditsCost,
      // Store frontend settings for reference
      generationSettings: args.generationSettings,
      // Initialize new metadata fields
      viewCount: 0,
      downloadCount: 0,
      shareCount: 0,
      isPublic: finalIsPublic, // Based on user preference and subscription tier
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    });

    // Map and store model-specific parameters
    const parameterMapping = await mapParametersForModel(
      ctx,
      args.model,
      frontendParams
    );
    await ctx.db.insert("videoParameters", {
      videoId,
      modelId: args.model,
      parameters: parameterMapping.apiParameters,
      parameterMapping: {
        frontendParameters: parameterMapping.frontendParameters,
        mappingLog: parameterMapping.mappingLog,
      },
      createdAt: now,
    });

    // Deduct credits immediately using userProfiles
    await ctx.runMutation(api.userProfiles.subtractCredits, {
      clerkId: identity.subject,
      amount: creditsCost,
    });

    // Record credit transaction
    await ctx.db.insert("creditTransactions", {
      clerkId: identity.subject,
      type: "video_generation",
      amount: -creditsCost,
      description: `Video generation: ${args.prompt}`,
      videoId,
      balanceBefore: userProfile.credits,
      balanceAfter: userProfile.credits - creditsCost,
      createdAt: now,
    });

    // Schedule the video generation action
    await ctx.scheduler.runAfter(0, api.videos.generateVideo, { videoId });

    return videoId;
  },
});

// Mutation to update video status
export const updateVideoStatus = mutation({
  args: {
    videoId: v.id("videos"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("canceled")
    ),
    replicateJobId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    convexFileId: v.optional(v.id("_storage")),
    r2FileKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.replicateJobId) {
      updateData.replicateJobId = args.replicateJobId;
    }

    if (args.errorMessage) {
      updateData.errorMessage = args.errorMessage;
    }

    if (args.videoUrl) {
      updateData.videoUrl = args.videoUrl;
    }

    if (args.convexFileId) {
      updateData.convexFileId = args.convexFileId;
    }

    if (args.r2FileKey) {
      updateData.r2FileKey = args.r2FileKey;
    }

    if (args.status === "processing" && !video.processingStartedAt) {
      updateData.processingStartedAt = Date.now();
    }

    if (args.status === "completed" && !video.processingCompletedAt) {
      updateData.processingCompletedAt = Date.now();
    }

    await ctx.db.patch(args.videoId, updateData);
  },
});

// Mutation to delete a video
export const deleteVideo = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    if (video.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    // Delete R2 file if it exists
    if (video.r2FileKey) {
      try {
        await (r2 as any).deleteByKey(video.r2FileKey);
      } catch (error) {
        console.error("Failed to delete R2 file:", error);
        // Continue with video deletion even if R2 deletion fails
      }
    }

    await ctx.db.delete(args.videoId);
  },
});

// Query to get video data for generation (internal use only)
export const getVideoForGeneration = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    // This is an internal query that bypasses auth for Actions
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }
    return video;
  },
});

// Query to get model parameters for a video (internal use only)
export const getVideoParameters = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    // This is an internal query that bypasses auth for Actions
    return await ctx.db
      .query("videoParameters")
      .withIndex("by_video_id", (q) => q.eq("videoId", args.videoId))
      .first();
  },
});

// Action to generate video using Replicate API
export const generateVideo = action({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args): Promise<string> => {
    const video = await ctx.runQuery(api.videos.getVideoForGeneration, {
      videoId: args.videoId,
    });
    if (!video) {
      throw new Error("Video not found");
    }

    try {
      // Create Replicate Client
      const replicate = createReplicateClient();

      // Update status to processing
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "processing",
      });

      // Get stored model parameters
      const modelParams = await ctx.runQuery(api.videos.getVideoParameters, {
        videoId: args.videoId,
      });

      let input: any;
      if (modelParams && modelParams.parameters) {
        // Use stored parameters from database
        input = modelParams.parameters;
      } else {
        // Fallback to basic parameters (backward compatibility)
        input = {
          prompt: video.prompt,
          duration_seconds: parseInt(video.duration),
          aspect_ratio: "16:9",
          seed: Math.floor(Math.random() * 1000000),
        };
      }

      // Check for development mode
      const isDevelopmentMode = process.env.DEVELOPMENT_MODE === "true";

      let prediction: any;

      if (isDevelopmentMode) {
        // Create realistic mock prediction response
        prediction = {
          id: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          model: video.model,
          version: "dev-mock-version",
          input: input,
          status: "starting",
          created_at: new Date().toISOString(),
          started_at: null,
          completed_at: null,
          urls: {
            get: `https://api.replicate.com/v1/predictions/dev_${Date.now()}`,
            cancel: `https://api.replicate.com/v1/predictions/dev_${Date.now()}/cancel`,
          },
          error: null,
          logs: null,
          output: null,
          webhook: `${process.env.CONVEX_SITE_URL}/api/webhooks/replicate`,
          webhook_events_filter: ["start", "output", "logs", "completed"],
        };

        // Simulate realistic generation timing based on quality/duration
        const simulationTime = calculateMockGenerationTime(
          video.quality,
          video.duration
        );

        // Schedule the mock generation process
        await ctx.scheduler.runAfter(1000, api.videos.mockGenerationStart, {
          videoId: args.videoId,
          replicateJobId: prediction.id,
          totalTime: simulationTime,
        });
      } else {
        // Production mode: Use real Replicate API
        const createOptions: any = {
          model: video.model,
          input: input,
        };

        // Only set webhook in production environment (not localhost)
        const siteUrl = process.env.CONVEX_SITE_URL;
        if (siteUrl && !siteUrl.includes("localhost")) {
          createOptions.webhook = `${siteUrl}/api/webhooks/replicate`;
          createOptions.webhook_events_filter = [
            "start",
            "output",
            "logs",
            "completed",
          ];
        }

        prediction = await replicate.predictions.create(createOptions);

        // If no webhook, schedule polling to check status
        if (!createOptions.webhook) {
          await ctx.scheduler.runAfter(5000, api.videos.pollReplicateStatus, {
            videoId: args.videoId,
            replicateJobId: prediction.id,
          });
        }
      }

      // Update video with Replicate job ID
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "processing",
        replicateJobId: prediction.id,
      });

      return prediction.id;
    } catch (error) {
      console.error("Video generation failed:", error);

      // Update status to failed
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      // Refund credits
      await ctx.runMutation(api.videos.refundCredits, {
        videoId: args.videoId,
      });

      throw error;
    }
  },
});

// Mutation to refund credits for failed generation
export const refundCredits = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    // Get user profile to refund credits
    const userProfile = await ctx.runQuery(api.userProfiles.getUserProfile, {
      clerkId: video.clerkId,
    });
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const now = Date.now();

    // Refund credits using userProfiles
    await ctx.runMutation(api.userProfiles.addCredits, {
      clerkId: video.clerkId,
      amount: video.creditsCost,
    });

    // Record refund transaction
    await ctx.db.insert("creditTransactions", {
      clerkId: video.clerkId,
      type: "refund",
      amount: video.creditsCost,
      description: `Refund for failed video generation: ${video.prompt}`,
      videoId: args.videoId,
      balanceBefore: userProfile.credits,
      balanceAfter: userProfile.credits + video.creditsCost,
      createdAt: now,
    });
  },
});

// Query to get video by Replicate job ID

export const getVideoByReplicateJobId = query({
  args: { replicateJobId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videos")
      .withIndex("by_replicate_job_id", (q) =>
        q.eq("replicateJobId", args.replicateJobId)
      )
      .first();
  },
});

// Query to get video file URL - generates fresh R2 URL
export const getVideoFileUrl = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    if (video.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    // Try to generate dynamic R2 URL first
    if (video.r2FileKey) {
      return await generateDynamicVideoUrl(ctx, video);
    }

    // Fallback to Convex storage (legacy videos)
    if (video.convexFileId) {
      const fileUrl = await ctx.storage.getUrl(video.convexFileId);
      return fileUrl;
    }

    // Final fallback to original video URL
    return video.videoUrl;
  },
});

// Action to poll Replicate status
export const pollReplicateStatus = action({
  args: {
    videoId: v.id("videos"),
    replicateJobId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const replicate = createReplicateClient();
      const prediction = await replicate.predictions.get(args.replicateJobId);

      switch (prediction.status) {
        case "starting":
        case "processing":
          // Continue polling
          await ctx.scheduler.runAfter(5000, api.videos.pollReplicateStatus, {
            videoId: args.videoId,
            replicateJobId: args.replicateJobId,
          });
          break;

        case "succeeded":
          if (prediction.output) {
            const videoUrl = Array.isArray(prediction.output)
              ? prediction.output[0]
              : prediction.output;

            // Schedule video download and storage (this will mark as completed with CDN URL)
            await ctx.runAction(api.videos.downloadAndStoreVideo, {
              videoId: args.videoId,
              videoUrl: videoUrl,
            });
          }
          break;

        case "failed":
          await ctx.runMutation(api.videos.updateVideoStatus, {
            videoId: args.videoId,
            status: "failed",
            errorMessage:
              typeof prediction.error === "string"
                ? prediction.error
                : JSON.stringify(prediction.error) || "Video generation failed",
          });

          // Refund credits
          await ctx.runMutation(api.videos.refundCredits, {
            videoId: args.videoId,
          });
          break;

        case "canceled":
          await ctx.runMutation(api.videos.updateVideoStatus, {
            videoId: args.videoId,
            status: "canceled",
          });

          // Refund credits
          await ctx.runMutation(api.videos.refundCredits, {
            videoId: args.videoId,
          });
          break;

        default:
          // Continue polling for unknown statuses
          await ctx.scheduler.runAfter(10000, api.videos.pollReplicateStatus, {
            videoId: args.videoId,
            replicateJobId: args.replicateJobId,
          });
      }
    } catch (error) {
      console.error("Error polling Replicate status:", error);

      // Mark as failed after polling error
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "failed",
        errorMessage: "Failed to get generation status",
      });

      // Refund credits
      await ctx.runMutation(api.videos.refundCredits, {
        videoId: args.videoId,
      });
    }
  },
});

// Action to download and store video from Replicate with metadata extraction
export const downloadAndStoreVideo = action({
  args: {
    videoId: v.id("videos"),
    videoUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    try {
      // Download the video file
      const response = await fetch(args.videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const blob = await response.blob();
      const fileSize = blob.size;

      // Get video data to create proper file key
      const video = await ctx.runQuery(api.videos.getVideoForGeneration, {
        videoId: args.videoId,
      });

      // Generate unique key for R2 storage
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const fileKey = `videos/${video?.clerkId}/${timestamp}-${random}-${args.videoId}.mp4`;

      // Store the video file in R2 storage
      const key = await r2.store(ctx, blob, {
        key: fileKey,
        type: "video/mp4",
      });

      const downloadTime = Date.now() - startTime;

      // Extract video metadata (simplified - in production you'd use ffprobe or similar)
      const format = "mp4"; // Most common format from Replicate
      const codec = "h264"; // Most common codec

      const dimensions =
        video?.quality === "high"
          ? { width: 1920, height: 1080 }
          : { width: 1280, height: 720 };

      // Update video with metadata and mark as completed
      // No need to store signed URLs since we generate them dynamically
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "completed",
        r2FileKey: key,
        videoUrl: args.videoUrl, // Keep original Replicate URL as fallback
      });

      // Update video metadata
      await ctx.runMutation(api.videos.updateVideoMetadataInternal, {
        videoId: args.videoId,
        fileSize,
        format,
        codec,
        dimensions,
        actualDuration: parseInt(video?.duration || "15"),
        generationMetrics: {
          queueTime: 0, // Would need to track from job creation
          processingTime: 0, // Would need to track from Replicate
          downloadTime,
          totalTime: downloadTime,
        },
      });

      return key;
    } catch (error) {
      console.error("Error downloading and storing video:", error);

      // Mark as failed and refund credits
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "failed",
        errorMessage:
          error instanceof Error ? error.message : "Failed to download video",
      });

      await ctx.runMutation(api.videos.refundCredits, {
        videoId: args.videoId,
      });

      throw error;
    }
  },
});

// Helper function to check quality access based on subscription
function checkQualityAccess(
  subscriptionTier: string,
  quality: string
): boolean {
  switch (quality) {
    case "standard":
      return true; // Available to all
    case "high":
      return ["starter", "pro", "max"].includes(subscriptionTier);
    case "ultra":
      return ["max"].includes(subscriptionTier);
    default:
      return false;
  }
}

// Enhanced search query with full-text search and advanced filtering
export const searchVideos = query({
  args: {
    searchQuery: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("canceled")
      )
    ),
    quality: v.optional(
      v.union(v.literal("standard"), v.literal("high"), v.literal("ultra"))
    ),
    tags: v.optional(v.array(v.string())),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    minCredits: v.optional(v.number()),
    maxCredits: v.optional(v.number()),
    minFileSize: v.optional(v.number()),
    maxFileSize: v.optional(v.number()),
    onlyFavorites: v.optional(v.boolean()),
    sortBy: v.optional(
      v.union(
        v.literal("newest"),
        v.literal("oldest"),
        v.literal("title"),
        v.literal("credits"),
        v.literal("fileSize"),
        v.literal("viewCount"),
        v.literal("duration")
      )
    ),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // ============================================================================
    // INPUT VALIDATION
    // ============================================================================

    // Validate pagination parameters
    const paginationValidation = validatePagination(
      args.limit,
      args.offset,
      100
    );
    if (!paginationValidation.isValid) {
      throwValidationError(
        paginationValidation.errors,
        "Pagination validation failed"
      );
    }

    // Sanitize search query
    const sanitizedSearchQuery = args.searchQuery
      ? sanitizeString(args.searchQuery, 200)
      : undefined;

    // Validate tags array
    if (args.tags && args.tags.length > 10) {
      throw new Error("Maximum 10 tags allowed");
    }

    // Validate date range
    if (args.dateFrom && args.dateTo && args.dateFrom > args.dateTo) {
      throw new Error("Invalid date range: start date must be before end date");
    }

    // Validate credit range
    if (
      args.minCredits &&
      args.maxCredits &&
      args.minCredits > args.maxCredits
    ) {
      throw new Error(
        "Invalid credit range: minimum must be less than maximum"
      );
    }

    // Validate file size range
    if (
      args.minFileSize &&
      args.maxFileSize &&
      args.minFileSize > args.maxFileSize
    ) {
      throw new Error(
        "Invalid file size range: minimum must be less than maximum"
      );
    }

    const query = ctx.db
      .query("videos")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject));

    const videos = await query.collect();

    // Filter videos based on search criteria
    let filteredVideos = videos.filter((video) => {
      // Text search in title, prompt, description, and tags
      if (args.searchQuery) {
        const searchLower = args.searchQuery.toLowerCase();
        const searchableText = [
          video.prompt,
          video.description || "",
          ...(video.tags || []),
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (args.status && video.status !== args.status) {
        return false;
      }

      // Quality filter
      if (args.quality && video.quality !== args.quality) {
        return false;
      }

      // Tags filter (video must have at least one of the specified tags)
      if (args.tags && args.tags.length > 0) {
        const videoTags = video.tags || [];
        if (!args.tags.some((tag) => videoTags.includes(tag))) {
          return false;
        }
      }

      // Date range filter
      if (args.dateFrom && video.createdAt < args.dateFrom) {
        return false;
      }
      if (args.dateTo && video.createdAt > args.dateTo) {
        return false;
      }

      // Credit cost range filter
      if (args.minCredits && video.creditsCost < args.minCredits) {
        return false;
      }
      if (args.maxCredits && video.creditsCost > args.maxCredits) {
        return false;
      }

      // File size range filter
      if (
        args.minFileSize &&
        (!video.fileSize || video.fileSize < args.minFileSize)
      ) {
        return false;
      }
      if (
        args.maxFileSize &&
        (!video.fileSize || video.fileSize > args.maxFileSize)
      ) {
        return false;
      }

      // Favorites filter
      if (args.onlyFavorites && !(video.isFavorite || false)) {
        return false;
      }

      return true;
    });

    // Sort videos
    const sortBy = args.sortBy || "newest";
    filteredVideos.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt - a.createdAt;
        case "oldest":
          return a.createdAt - b.createdAt;
        case "credits":
          return b.creditsCost - a.creditsCost;
        case "fileSize":
          return (b.fileSize || 0) - (a.fileSize || 0);
        case "viewCount":
          return (b.viewCount || 0) - (a.viewCount || 0);
        case "duration":
          return parseInt(b.duration) - parseInt(a.duration);
        default:
          return b.createdAt - a.createdAt;
      }
    });

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const paginatedVideos = filteredVideos.slice(offset, offset + limit);

    // Return videos with dynamically generated R2 URLs
    const videosWithUrls = await Promise.all(
      paginatedVideos.map(async (video) => {
        const videoUrl = await generateDynamicVideoUrl(ctx, video);
        return {
          ...video,
          videoUrl,
        };
      })
    );

    return {
      videos: videosWithUrls,
      total: filteredVideos.length,
      hasMore: offset + limit < filteredVideos.length,
    };
  },
});

// Update video metadata (for analytics tracking)
export const updateVideoMetadata = mutation({
  args: {
    videoId: v.id("videos"),
    fileSize: v.optional(v.number()),
    actualDuration: v.optional(v.number()),
    dimensions: v.optional(
      v.object({
        width: v.number(),
        height: v.number(),
      })
    ),
    format: v.optional(v.string()),
    codec: v.optional(v.string()),
    bitrate: v.optional(v.number()),
    processingDuration: v.optional(v.number()),
    generationMetrics: v.optional(
      v.object({
        queueTime: v.number(),
        processingTime: v.number(),
        downloadTime: v.optional(v.number()),
        totalTime: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    if (video.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.fileSize !== undefined) updateData.fileSize = args.fileSize;
    if (args.actualDuration !== undefined)
      updateData.actualDuration = args.actualDuration;
    if (args.dimensions !== undefined) updateData.dimensions = args.dimensions;
    if (args.format !== undefined) updateData.format = args.format;
    if (args.codec !== undefined) updateData.codec = args.codec;
    if (args.bitrate !== undefined) updateData.bitrate = args.bitrate;
    if (args.processingDuration !== undefined)
      updateData.processingDuration = args.processingDuration;
    if (args.generationMetrics !== undefined)
      updateData.generationMetrics = args.generationMetrics;

    await ctx.db.patch(args.videoId, updateData);
  },
});

// Internal video metadata update (for Actions - no auth required)
export const updateVideoMetadataInternal = mutation({
  args: {
    videoId: v.id("videos"),
    fileSize: v.optional(v.number()),
    actualDuration: v.optional(v.number()),
    dimensions: v.optional(
      v.object({
        width: v.number(),
        height: v.number(),
      })
    ),
    format: v.optional(v.string()),
    codec: v.optional(v.string()),
    bitrate: v.optional(v.number()),
    processingDuration: v.optional(v.number()),
    generationMetrics: v.optional(
      v.object({
        queueTime: v.number(),
        processingTime: v.number(),
        downloadTime: v.optional(v.number()),
        totalTime: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Internal mutation - no auth check needed since it's called by trusted Actions
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.fileSize !== undefined) updateData.fileSize = args.fileSize;
    if (args.actualDuration !== undefined)
      updateData.actualDuration = args.actualDuration;
    if (args.dimensions !== undefined) updateData.dimensions = args.dimensions;
    if (args.format !== undefined) updateData.format = args.format;
    if (args.codec !== undefined) updateData.codec = args.codec;
    if (args.bitrate !== undefined) updateData.bitrate = args.bitrate;
    if (args.processingDuration !== undefined)
      updateData.processingDuration = args.processingDuration;
    if (args.generationMetrics !== undefined)
      updateData.generationMetrics = args.generationMetrics;

    await ctx.db.patch(args.videoId, updateData);
  },
});

// Track video interaction (view, download, share)
export const trackVideoInteraction = mutation({
  args: {
    videoId: v.id("videos"),
    action: v.union(
      v.literal("view"),
      v.literal("download"),
      v.literal("share")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    if (video.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const updateData: any = {
      updatedAt: now,
    };

    switch (args.action) {
      case "view":
        updateData.viewCount = (video.viewCount || 0) + 1;
        updateData.lastViewedAt = now;
        break;
      case "download":
        updateData.downloadCount = (video.downloadCount || 0) + 1;
        break;
      case "share":
        updateData.shareCount = (video.shareCount || 0) + 1;
        break;
    }

    await ctx.db.patch(args.videoId, updateData);
  },
});

// Toggle video favorite status
export const toggleVideoFavorite = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    if (video.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const newFavoriteStatus = !(video.isFavorite || false);

    await ctx.db.patch(args.videoId, {
      isFavorite: newFavoriteStatus,
      updatedAt: Date.now(),
    });

    return newFavoriteStatus;
  },
});

// Toggle video privacy status
export const toggleVideoPrivacy = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    if (video.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const newPrivacyStatus = !(video.isPublic || false);

    await ctx.db.patch(args.videoId, {
      isPublic: newPrivacyStatus,
      updatedAt: Date.now(),
    });

    return {
      isPublic: newPrivacyStatus,
      message: newPrivacyStatus
        ? "Video is now public"
        : "Video is now private",
    };
  },
});

// Update video tags and description
export const updateVideoInfo = mutation({
  args: {
    videoId: v.id("videos"),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    if (video.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.description !== undefined)
      updateData.description = args.description;
    if (args.tags !== undefined) updateData.tags = args.tags;

    await ctx.db.patch(args.videoId, updateData);
  },
});

// Get popular tags for user
export const getUserTags = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const videos = await ctx.db
      .query("videos")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .collect();

    const tagCounts = new Map<string, number>();

    videos.forEach((video) => {
      if (video.tags) {
        video.tags.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    const sortedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    return sortedTags;
  },
});

// Cleanup failed videos older than specified days
export const cleanupFailedVideos = mutation({
  args: {
    daysOld: v.optional(v.number()), // default 7 days
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const cutoffTime = Date.now() - (args.daysOld || 7) * 24 * 60 * 60 * 1000;

    const failedVideos = await ctx.db
      .query("videos")
      .withIndex("by_clerk_id_and_status", (q) =>
        q.eq("clerkId", identity.subject).eq("status", "failed")
      )
      .filter((q) => q.lt(q.field("createdAt"), cutoffTime))
      .collect();

    let deletedCount = 0;
    for (const video of failedVideos) {
      await ctx.db.delete(video._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});

// Mock generation start - simulates Replicate webhook "started"
export const mockGenerationStart = action({
  args: {
    videoId: v.id("videos"),
    replicateJobId: v.string(),
    totalTime: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Schedule progress updates
      const progressInterval = Math.floor(args.totalTime / 5); // 5 progress updates

      for (let i = 1; i <= 4; i++) {
        await ctx.scheduler.runAfter(
          progressInterval * i,
          api.videos.mockGenerationProgress,
          {
            videoId: args.videoId,
            replicateJobId: args.replicateJobId,
            progress: i * 20, // 20%, 40%, 60%, 80%
          }
        );
      }

      // Schedule completion
      await ctx.scheduler.runAfter(
        args.totalTime,
        api.videos.mockGenerationComplete,
        {
          videoId: args.videoId,
          replicateJobId: args.replicateJobId,
        }
      );
    } catch (error) {
      // Silent error handling for mock generation
    }
  },
});

// Mock generation progress updates
export const mockGenerationProgress = action({
  args: {
    videoId: v.id("videos"),
    replicateJobId: v.string(),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    const progressMessages = {
      20: "🎨 Analyzing prompt and style...",
      40: "🎬 Generating video frames...",
      60: "🎞️ Rendering video sequence...",
      80: "✨ Applying final effects and cleanup...",
    };

    try {
    } catch (error) {
      // Silent error handling for mock generation
    }
  },
});

// Mock generation completion
export const mockGenerationComplete = action({
  args: {
    videoId: v.id("videos"),
    replicateJobId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const video = await ctx.runQuery(api.videos.getVideoForGeneration, {
        videoId: args.videoId,
      });

      if (!video) {
        throw new Error("Video not found for completion");
      }

      // Simulate 5% chance of failure for realistic testing
      const shouldFail = Math.random() < 0.05;

      if (shouldFail) {
        await ctx.runMutation(api.videos.updateVideoStatus, {
          videoId: args.videoId,
          status: "failed",
          errorMessage: "Simulated generation failure (development mode)",
        });

        // Refund credits
        await ctx.runMutation(api.videos.refundCredits, {
          videoId: args.videoId,
        });

        return;
      }

      // Generate realistic mock video URLs based on quality
      const mockVideos = generateMockVideoUrls(video.quality, video.duration);

      // Mark video as completed with mock URL
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "completed",
        videoUrl: mockVideos.videoUrl,
      });

      // Update video metadata with realistic values
      await ctx.runMutation(api.videos.updateVideoMetadataInternal, {
        videoId: args.videoId,
        fileSize: mockVideos.fileSize,
        actualDuration: parseInt(video.duration),
        dimensions: mockVideos.dimensions,
        format: "mp4",
        codec: "h264",
        bitrate: mockVideos.bitrate,
        processingDuration: calculateMockGenerationTime(
          video.quality,
          video.duration
        ),
        generationMetrics: {
          queueTime: 1000, // 1 second queue time
          processingTime:
            calculateMockGenerationTime(video.quality, video.duration) - 1000,
          downloadTime: 2000, // 2 seconds download time
          totalTime:
            calculateMockGenerationTime(video.quality, video.duration) + 1000,
        },
      });
    } catch (error) {
      // Mark as failed if something goes wrong
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "failed",
        errorMessage: "Mock generation simulation failed",
      });
    }
  },
});

// Helper function to calculate realistic mock generation times
function calculateMockGenerationTime(
  quality: string,
  duration: string
): number {
  const durationNum = parseInt(duration);

  // Base time per second of video (in milliseconds)
  const baseTimePerSecond = {
    standard: 2000, // 2 seconds processing per 1 second of video
    high: 4000, // 4 seconds processing per 1 second of video
    ultra: 8000, // 8 seconds processing per 1 second of video
  };

  const baseTime =
    baseTimePerSecond[quality as keyof typeof baseTimePerSecond] || 2000;

  // Add some randomness (±20%)
  const randomFactor = 0.8 + Math.random() * 0.4;

  return Math.floor(baseTime * durationNum * randomFactor);
}

// Helper function to generate realistic mock video URLs and metadata
function generateMockVideoUrls(quality: string, duration: string) {
  const qualityMap = {
    standard: { width: 1280, height: 720, bitrate: 2000 },
    high: { width: 1920, height: 1080, bitrate: 5000 },
    ultra: { width: 3840, height: 2160, bitrate: 15000 },
  };

  const specs =
    qualityMap[quality as keyof typeof qualityMap] || qualityMap.standard;
  const durationNum = parseInt(duration);

  // Calculate realistic file size (bitrate * duration / 8 for bytes)
  const fileSize = Math.floor((specs.bitrate * 1000 * durationNum) / 8);

  // Use different sample videos based on quality for more realistic testing
  const sampleVideos = {
    standard:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    high: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4",
    ultra:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  };

  return {
    videoUrl:
      sampleVideos[quality as keyof typeof sampleVideos] ||
      sampleVideos.standard,
    fileSize,
    dimensions: { width: specs.width, height: specs.height },
    bitrate: specs.bitrate,
  };
}
