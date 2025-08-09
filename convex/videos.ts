import { v } from "convex/values";
import { mutation, query, action, MutationCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { calculateCreditCost } from "./pricing";
import { createReplicateClient } from "./lib/replicateClient";
import { mapParametersForModel } from "./modelParameterHelpers";
import { createVideoSchema, formatValidationError } from "./lib/validation";
import { getSecureConfig } from "./lib/convexEnv";
import {
  createAuthError,
  createNotFoundError,
  createInsufficientCreditsError,
  createForbiddenError,
  handleError,
} from "./lib/errors";
import { applyVideoGenerationRateLimit } from "./lib/rateLimit";

import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { UserIdentity } from "convex/server";

const r2 = new R2(components.r2);

// Helper function to generate dynamic R2 URL for a video
async function getR2VideoUrl(
  video: Doc<"videos">
): Promise<string | undefined> {
  let videoUrl = video.videoUrl; // Default fallback

  // Generate fresh R2 URL if video is stored in R2
  if (video.r2FileKey) {
    try {
      videoUrl = await r2.getUrl(video.r2FileKey, {
        expiresIn: 3600 * 24 * 30, // 30 days expiration
      });
    } catch (error) {
      // Fallback to stored URL
      videoUrl = video.videoUrl;
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
        const videoUrl = await getR2VideoUrl(video);
        return {
          ...video,
          videoUrl,
        };
      })
    );
  },
});
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
        const videoUrl = await getR2VideoUrl(video);
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
        const videoUrl = await getR2VideoUrl(video);
        return {
          ...video,
          videoUrl,
        };
      })
    );
  },
});

// Helper functions for createVideo mutation

// Authenticate user and get profile data
async function authenticateAndGetUserData(ctx: MutationCtx) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw createAuthError("video creation");
    }

    const userProfile = await ctx.runQuery(api.userProfiles.getUserProfile, {
      clerkId: identity.subject,
    });

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const subscription = await ctx.runQuery(api.subscriptions.getSubscription, {
      clerkId: identity.subject,
    });

    const subscriptionTier = subscription?.tier || "free";

    return { identity, userProfile, subscriptionTier };
  } catch (error) {
    handleError(error, { function: "authenticateAndGetUserData" });
  }
}

// Validate input and apply rate limiting
async function validateInputAndRateLimit(
  ctx: MutationCtx,
  args: Doc<"videos">["generationSettings"],
  identity: UserIdentity
) {
  // Apply rate limiting to prevent abuse
  try {
    await applyVideoGenerationRateLimit(ctx, identity.subject);
  } catch (error) {
    // Rate limiting errors should be handled as system errors
    handleError(error, { function: "validateInputAndRateLimit - rate limit" });
  }

  // Validate all input parameters using Zod schemas
  const validationResult = createVideoSchema.safeParse(args);
  if (!validationResult.success) {
    const error = formatValidationError(validationResult.error);
    // Throw validation error directly - it will be caught by the main handler and shown to user
    throw error;
  }

  return validationResult.data;
}

// Validate model and check permissions
async function validateModelAndPermissions(
  ctx: MutationCtx,
  validatedArgs: Doc<"videos">["generationSettings"],
  subscriptionTier: string
) {
  try {
    // Validate model exists and is active
    const model = await ctx.db
      .query("models")
      .withIndex("by_model_id", (q) => q.eq("modelId", validatedArgs.model))
      .first();

    if (!model) {
      throw createNotFoundError("Model", validatedArgs.model);
    }

    if (!model.isActive) {
      throw createForbiddenError("use this model", "active model status");
    }

    // Check resolution access based on subscription tier
    if (validatedArgs.generationSettings?.resolution === "1080p") {
      if (subscriptionTier !== "pro" && subscriptionTier !== "max") {
        throw new Error(
          "1080p resolution is only available for Pro and Max plan subscribers"
        );
      }
    }

    return model;
  } catch (error) {
    handleError(error, { function: "validateModelAndPermissions" });
  }
}

// Calculate costs and validate credits
async function calculateAndValidateCredits(
  ctx: MutationCtx,
  validatedArgs: Doc<"videos">["generationSettings"],
  userProfile: Doc<"userProfiles">
) {
  try {
    const resolution = validatedArgs.generationSettings?.resolution;
    const creditsCost = await calculateCreditCost(
      ctx,
      validatedArgs.model,
      parseInt(validatedArgs.duration),
      resolution
    );

    // Check if user has enough credits
    if (userProfile.credits < creditsCost) {
      throw createInsufficientCreditsError(creditsCost, userProfile.credits);
    }

    return creditsCost;
  } catch (error) {
    handleError(error, { function: "calculateAndValidateCredits" });
  }
}

// Determine video privacy settings
function determineVideoPrivacy(
  validatedArgs: Doc<"videos">["generationSettings"],
  subscriptionTier: string
) {
  try {
    let finalIsPublic = true; // Default to public

    if (validatedArgs.isPublic !== undefined) {
      // User has specified a preference
      if (!validatedArgs.isPublic && subscriptionTier !== "max") {
        // User wants private video but doesn't have Max plan
        throw new Error(
          "Private videos are only available for Max plan subscribers"
        );
      }
      finalIsPublic = validatedArgs.isPublic;
    } else {
      // No preference specified, use tier-based default
      // Max plan users get private videos by default for premium privacy
      finalIsPublic = subscriptionTier !== "max";
    }

    return finalIsPublic;
  } catch (error) {
    handleError(error, { function: "determineVideoPrivacy" });
  }
}

// Create video record and parameters
async function createVideoRecord(
  ctx: MutationCtx,
  validatedArgs: Doc<"videos">["generationSettings"],
  identity: UserIdentity,
  creditsCost: number,
  finalIsPublic: boolean
) {
  try {
    const now = Date.now();

    // Create video record
    const videoId: Id<"videos"> = await ctx.db.insert("videos", {
      clerkId: identity.subject,
      prompt: validatedArgs.prompt,
      model: validatedArgs.model,
      duration: validatedArgs.duration,
      status: "pending",
      creditsCost,
      generationSettings: validatedArgs.generationSettings,
      viewCount: 0,
      downloadCount: 0,
      shareCount: 0,
      isPublic: finalIsPublic,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    });

    // Map and store model-specific parameters
    const frontendParams = {
      prompt: validatedArgs.prompt,
      duration: validatedArgs.duration,
      ...(validatedArgs.generationSettings || {}),
    };

    const parameterMapping = await mapParametersForModel(
      ctx,
      validatedArgs.model,
      frontendParams
    );

    await ctx.db.insert("videoParameters", {
      videoId,
      modelId: validatedArgs.model,
      parameters: parameterMapping.apiParameters,
      parameterMapping: parameterMapping.frontendParameters,
      createdAt: now,
    });

    return videoId;
  } catch (error) {
    handleError(error, { function: "createVideoRecord" });
  }
}

// Handle credit deduction and transaction recording
async function processCreditsAndStartGeneration(
  ctx: MutationCtx,
  videoId: Id<"videos">,
  identity: UserIdentity,
  userProfile: Doc<"userProfiles">,
  creditsCost: number,
  validatedArgs: Doc<"videos">["generationSettings"]
) {
  try {
    // Deduct credits atomically using userProfiles
    const newBalance = await ctx.runMutation(api.userProfiles.subtractCredits, {
      clerkId: identity.subject,
      amount: creditsCost,
    });

    // Record credit transaction with actual balance info
    await ctx.db.insert("creditTransactions", {
      clerkId: identity.subject,
      type: "video_generation",
      amount: -creditsCost,
      description: `Video generation: ${validatedArgs.prompt}`,
      videoId,
      balanceBefore: userProfile.credits,
      balanceAfter: newBalance,
      createdAt: Date.now(),
    });

    // Schedule the video generation action
    await ctx.scheduler.runAfter(0, api.videos.generateVideo, { videoId });

    return videoId;
  } catch (creditError) {
    // If credit deduction fails, mark video as failed and cleanup
    try {
      await ctx.db.patch(videoId, {
        status: "failed",
        errorMessage:
          creditError instanceof Error
            ? creditError.message
            : "Failed to deduct credits",
        updatedAt: Date.now(),
      });
    } catch (patchError) {
      // Silent error - video status update failed but credit error will still be thrown
    }
    throw creditError;
  }
}

// Main mutation to create a new video generation request
export const createVideo = mutation({
  args: {
    prompt: v.string(),
    model: v.string(), // Accept any model ID string
    duration: v.string(), // Keep as string for compatibility
    // Generic parameters object - flexible for any model
    generationSettings: v.optional(v.any()), // Contains all model-specific options
    isPublic: v.optional(v.boolean()), // Video visibility setting
  },
  handler: async (ctx, args): Promise<string> => {
    try {
      // Step 1: Authentication and user data
      const { identity, userProfile, subscriptionTier } =
        await authenticateAndGetUserData(ctx);

      // Step 2: Input validation and rate limiting
      const validatedArgs = await validateInputAndRateLimit(
        ctx,
        args,
        identity
      );

      // Step 3: Model validation and permissions
      await validateModelAndPermissions(ctx, validatedArgs, subscriptionTier);

      // Step 4: Calculate costs and validate credits
      const creditsCost = await calculateAndValidateCredits(
        ctx,
        validatedArgs,
        userProfile
      );

      // Step 5: Determine video privacy settings
      const finalIsPublic = determineVideoPrivacy(
        validatedArgs,
        subscriptionTier
      );

      // Step 6: Create video record and parameters
      const videoId = await createVideoRecord(
        ctx,
        validatedArgs,
        identity,
        creditsCost,
        finalIsPublic
      );

      // Step 7: Process credits and start generation
      return await processCreditsAndStartGeneration(
        ctx,
        videoId,
        identity,
        userProfile,
        creditsCost,
        validatedArgs
      );
    } catch (error) {
      return handleError(error, { function: "createVideo" });
    }
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
        await r2.deleteObject(ctx, video.r2FileKey);
      } catch (error) {
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

      // Get model information to get the correct Replicate model ID
      const model = await ctx.runQuery(api.models.getModelById, {
        modelId: video.model,
      });

      if (!model) {
        throw new Error("Model configuration not found");
      }

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

      // Production mode: Use real Replicate API
      const createOptions: any = {
        model: model.replicateModelId,
        input: input,
      };

      // Only set webhook in production environment (not localhost)
      const siteUrl = getSecureConfig().convex.siteUrl;
      if (siteUrl && !siteUrl.includes("localhost")) {
        createOptions.webhook = `${siteUrl}/api/webhooks/replicate`;
        createOptions.webhook_events_filter = [
          "start",
          "output",
          "logs",
          "completed",
        ];
      }

      const prediction = await replicate.predictions.create(createOptions);

      // If no webhook, schedule polling to check status
      if (!createOptions.webhook) {
        await ctx.scheduler.runAfter(5000, api.videos.pollReplicateStatus, {
          videoId: args.videoId,
          replicateJobId: prediction.id,
        });
      }

      // Update video with Replicate job ID
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "processing",
        replicateJobId: prediction.id,
      });

      return prediction.id;
    } catch (error) {
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

    // Check if refund already processed by looking for existing refund transaction
    const existingRefund = await ctx.db
      .query("creditTransactions")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", video.clerkId))
      .filter((q) =>
        q.and(
          q.eq(q.field("videoId"), args.videoId),
          q.eq(q.field("type"), "refund")
        )
      )
      .first();

    if (existingRefund) {
      return; // Refund already processed, prevent duplicate
    }

    // Get current user profile for accurate balance tracking
    const userProfile = await ctx.runQuery(api.userProfiles.getUserProfile, {
      clerkId: video.clerkId,
    });
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const now = Date.now();

    try {
      // Refund credits atomically
      await ctx.runMutation(api.userProfiles.addCredits, {
        clerkId: video.clerkId,
        amount: video.creditsCost,
      });

      // Record refund transaction with current balance info
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
    } catch (error) {
      throw new Error("Failed to process refund");
    }
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
      });

      const downloadTime = Date.now() - startTime;

      // Extract video metadata (simplified - in production you'd use ffprobe or similar)
      const format = "mp4"; // Most common format from Replicate
      const codec = "h264"; // Most common codec

      const dimensions = { width: 1280, height: 720 };

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

    const query = ctx.db
      .query("videos")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject));

    const videos = await query.collect();

    // Filter videos based on search criteria
    const filteredVideos = videos.filter((video) => {
      // Text search in title, prompt, description, and tags
      if (args.searchQuery) {
        const searchLower = args.searchQuery.toLowerCase();
        const searchableText = [video.prompt, video.description || ""]
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
        const videoUrl = await getR2VideoUrl(video);
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

// Update video description
export const updateVideoInfo = mutation({
  args: {
    videoId: v.id("videos"),
    description: v.optional(v.string()),
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

    await ctx.db.patch(args.videoId, updateData);
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
  handler: async () => {},
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

      // Generate realistic mock video URLs
      const mockVideos = generateMockVideoUrls(video.duration);

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
        processingDuration: calculateMockGenerationTime(video.duration),
        generationMetrics: {
          queueTime: 1000, // 1 second queue time
          processingTime: calculateMockGenerationTime(video.duration) - 1000,
          downloadTime: 2000, // 2 seconds download time
          totalTime: calculateMockGenerationTime(video.duration) + 1000,
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
function calculateMockGenerationTime(duration: string): number {
  const durationNum = parseInt(duration);

  // Base time per second of video (in milliseconds)
  const baseTimePerSecond = 2000; // 2 seconds processing per 1 second of video

  // Add some randomness (±20%)
  const randomFactor = 0.8 + Math.random() * 0.4;

  return Math.floor(baseTimePerSecond * durationNum * randomFactor);
}

// Helper function to generate realistic mock video URLs and metadata
function generateMockVideoUrls(duration: string) {
  const specs = { width: 1280, height: 720, bitrate: 2000 };
  const durationNum = parseInt(duration);

  // Calculate realistic file size (bitrate * duration / 8 for bytes)
  const fileSize = Math.floor((specs.bitrate * 1000 * durationNum) / 8);

  const sampleVideo =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  return {
    videoUrl: sampleVideo,
    fileSize,
    dimensions: { width: specs.width, height: specs.height },
    bitrate: specs.bitrate,
  };
}
