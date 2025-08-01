import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { calculateCreditCost } from "./pricing";
import { createReplicateClient } from "./lib/replicateClient";

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

    // Add file URLs for completed videos with stored files
    const videosWithUrls = await Promise.all(
      videos.map(async (video) => {
        if (video.convexFileId && video.status === "completed") {
          const fileUrl = await ctx.storage.getUrl(video.convexFileId);
          return {
            ...video,
            videoUrl: fileUrl || video.videoUrl, // Use Convex URL if available
          };
        }
        return video;
      })
    );

    return videosWithUrls;
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

    // Add file URL if stored in Convex
    if (video.convexFileId && video.status === "completed") {
      const fileUrl = await ctx.storage.getUrl(video.convexFileId);
      return {
        ...video,
        videoUrl: fileUrl || video.videoUrl, // Use Convex URL if available
      };
    }

    return video;
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

    return await ctx.db
      .query("videos")
      .withIndex("by_clerk_id_and_status", (q) =>
        q.eq("clerkId", identity.subject).eq("status", args.status)
      )
      .order("desc")
      .collect();
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

    // Filter out videos from current user and limit results
    const otherUsersVideos = allVideos
      .filter((video) => video.clerkId !== identity.subject)
      .slice(0, args.limit || 12);

    return otherUsersVideos;
  },
});

// Mutation to create a new video generation request
export const createVideo = mutation({
  args: {
    title: v.optional(v.string()),
    prompt: v.string(),
    model: v.string(), // Accept any model ID string
    quality: v.union(
      v.literal("standard"),
      v.literal("high"),
      v.literal("ultra")
    ),
    duration: v.string(), // Keep as string for compatibility
    // Model-specific options
    resolution: v.optional(v.string()),
    aspectRatio: v.optional(v.string()),
    loop: v.optional(v.boolean()),
    cameraConcept: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

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

    // Validate model exists and is active
    const model = await ctx.db
      .query("models")
      .withIndex("by_model_id", (q) => q.eq("modelId", args.model))
      .first();

    if (!model || !model.isActive) {
      throw new Error("Selected model is not available");
    }

    // Validate model capabilities
    const durationNum = parseInt(args.duration);
    if (model.fixedDuration && durationNum !== model.fixedDuration) {
      throw new Error(
        `Model only supports ${model.fixedDuration} second duration`
      );
    }

    if (!model.supportedDurations.includes(durationNum)) {
      throw new Error(`Duration ${durationNum}s not supported by this model`);
    }

    if (!model.supportedQualities.includes(args.quality)) {
      throw new Error(`Quality '${args.quality}' not supported by this model`);
    }

    // Check quality access based on subscription
    const hasQualityAccess = checkQualityAccess(subscriptionTier, args.quality);
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
      durationNum
    );

    // Check if user has enough credits
    if (userProfile.credits < creditsCost) {
      throw new Error("Insufficient credits");
    }

    const now = Date.now();

    // Create video record
    const videoId = await ctx.db.insert("videos", {
      clerkId: identity.subject,
      title: args.title || undefined,
      prompt: args.prompt,
      model: args.model,
      quality: args.quality,
      duration: args.duration,
      status: "pending",
      creditsCost,
      // Model-specific options
      resolution: args.resolution,
      aspectRatio: args.aspectRatio,
      loop: args.loop,
      cameraConcept: args.cameraConcept,
      // Initialize new metadata fields
      viewCount: 0,
      downloadCount: 0,
      shareCount: 0,
      isPublic: false,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
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
      description: `Video generation: ${args.title || "Untitled"}`,
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
    thumbnailUrl: v.optional(v.string()),
    convexFileId: v.optional(v.id("_storage")),
    thumbnailFileId: v.optional(v.id("_storage")),
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

    if (args.thumbnailUrl) {
      updateData.thumbnailUrl = args.thumbnailUrl;
    }

    if (args.convexFileId) {
      updateData.convexFileId = args.convexFileId;
    }

    if (args.thumbnailFileId) {
      updateData.thumbnailFileId = args.thumbnailFileId;
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
      console.log(`Starting video generation for video ID: ${args.videoId}`);

      // Create Replicate Client
      const replicate = createReplicateClient();

      console.log(
        "Replicate client initialized, updating status to processing..."
      );

      // Update status to processing
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "processing",
      });

      // Prepare input based on the selected model
      const input: {
        prompt: string;
        duration_seconds?: number;
        aspect_ratio?: string;
        seed?: number;
      } = {
        prompt: video.prompt,
        duration_seconds: parseInt(video.duration),
        aspect_ratio: video.aspectRatio || "16:9",
      };

      // Add random seed for variation
      input.seed = Math.floor(Math.random() * 1000000);

      console.log(
        `Calling Replicate API with model: ${video.model}, input:`,
        input
      );

      // Check for development mode
      const isDevelopmentMode = process.env.DEVELOPMENT_MODE === "true";

      let prediction: any;

      if (isDevelopmentMode) {
        console.log("🧪 Development mode: Simulating video generation");

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
        console.log(
          `🎬 Simulating ${simulationTime / 1000}s generation for ${video.model}, ${video.quality} quality, ${video.duration}s duration`
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
          console.log("No webhook configured, will poll for status updates");
          await ctx.scheduler.runAfter(5000, api.videos.pollReplicateStatus, {
            videoId: args.videoId,
            replicateJobId: prediction.id,
          });
        }
      }

      console.log(`Replicate prediction created with ID: ${prediction.id}`);

      // Update video with Replicate job ID
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "processing",
        replicateJobId: prediction.id,
      });

      console.log(
        `Video generation started successfully for video ID: ${args.videoId}`
      );
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
      description: `Refund for failed video generation: ${video.title}`,
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

// Query to get video file URL from Convex storage
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

    // If we have a Convex file ID, get the URL from storage
    if (video.convexFileId) {
      const fileUrl = await ctx.storage.getUrl(video.convexFileId);
      return fileUrl;
    }

    // Fallback to original video URL
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

      console.log(
        `Polling Replicate status for ${args.replicateJobId}:`,
        prediction.status
      );

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

            await ctx.runMutation(api.videos.updateVideoStatus, {
              videoId: args.videoId,
              status: "completed",
              videoUrl: videoUrl,
            });

            // Schedule video download and storage
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
          console.log("Unknown Replicate status:", prediction.status);
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

      // Store the video file in Convex file storage
      const fileId = await ctx.storage.store(blob);

      const downloadTime = Date.now() - startTime;

      // Extract video metadata (simplified - in production you'd use ffprobe or similar)
      const format = "mp4"; // Most common format from Replicate
      const codec = "h264"; // Most common codec

      // Get video data directly from database (bypass authentication)
      const video = await ctx.db.get(args.videoId);
      const dimensions =
        video?.quality === "high"
          ? { width: 1920, height: 1080 }
          : { width: 1280, height: 720 };

      // Get the Convex file URL for serving
      const convexVideoUrl = await ctx.storage.getUrl(fileId);

      // Update video with metadata and mark as completed
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "completed",
        convexFileId: fileId,
        videoUrl: convexVideoUrl || args.videoUrl, // Use Convex URL if available, fallback to original
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

      // Generate and store thumbnail
      await ctx.scheduler.runAfter(0, api.videos.generateThumbnail, {
        videoId: args.videoId,
        videoUrl: args.videoUrl,
      });

      return fileId;
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

// Action to generate and store video thumbnail
export const generateThumbnail = action({
  args: {
    videoId: v.id("videos"),
    videoUrl: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // For development, we'll create a simple placeholder thumbnail
      // In production, you could use:
      // 1. FFmpeg to extract a frame at 1-2 seconds
      // 2. A service like Cloudinary for thumbnail generation
      // 3. Canvas API to generate thumbnails from video frames

      console.log("Generating thumbnail for video:", args.videoId);

      // Create a placeholder thumbnail blob (1x1 pixel transparent PNG)
      // This is just for demonstration - in production you'd extract a real frame
      const placeholderThumbnailData = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x40, 0x00, 0x00, 0x00, 0xf0,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x5d, 0xd5, 0x45, 0x38, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const thumbnailBlob = new Blob([placeholderThumbnailData], {
        type: "image/png",
      });

      // Store thumbnail in Convex storage
      const thumbnailFileId = await ctx.storage.store(thumbnailBlob);
      const thumbnailUrl = await ctx.storage.getUrl(thumbnailFileId);

      // Update video with thumbnail information
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "completed", // Keep status as completed
        thumbnailUrl: thumbnailUrl || undefined,
        thumbnailFileId,
      });

      console.log("Thumbnail generated and stored:", {
        videoId: args.videoId,
        thumbnailFileId,
        thumbnailUrl,
      });

      return thumbnailUrl;
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      // Don't fail the whole video generation if thumbnail fails
      // Use video URL with timestamp as fallback
      const fallbackThumbnail = args.videoUrl + "#t=1";

      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "completed",
        thumbnailUrl: fallbackThumbnail,
      });

      return fallbackThumbnail;
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

    let query = ctx.db
      .query("videos")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject));

    const videos = await query.collect();

    // Filter videos based on search criteria
    let filteredVideos = videos.filter((video) => {
      // Text search in title, prompt, description, and tags
      if (args.searchQuery) {
        const searchLower = args.searchQuery.toLowerCase();
        const searchableText = [
          video.title,
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
        case "title":
          return (a.title || "").localeCompare(b.title || "");
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

    return {
      videos: paginatedVideos,
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

// Update video tags and description
export const updateVideoInfo = mutation({
  args: {
    videoId: v.id("videos"),
    title: v.optional(v.string()),
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

    if (args.title !== undefined) updateData.title = args.title;
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
    console.log(`🚀 Mock: Generation started for video ${args.videoId}`);

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
      console.error("Mock generation start error:", error);
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
    console.log(
      `📊 Mock: Progress ${args.progress}% for video ${args.videoId}`
    );

    const progressMessages = {
      20: "🎨 Analyzing prompt and style...",
      40: "🎬 Generating video frames...",
      60: "🎞️ Rendering video sequence...",
      80: "✨ Applying final effects and cleanup...",
    };

    try {
    } catch (error) {
      console.error("Mock progress update error:", error);
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
    console.log(`🎉 Mock: Completing video ${args.videoId}`);

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
        console.log(
          `❌ Mock: Simulating generation failure for video ${args.videoId}`
        );

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

      // Mark video as completed
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "completed",
        videoUrl: mockVideos.videoUrl,
        thumbnailUrl: mockVideos.thumbnailUrl,
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

      console.log(`✅ Mock: Video ${args.videoId} completed successfully`);
    } catch (error) {
      console.error("Mock completion error:", error);

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
    thumbnailUrl: `https://via.placeholder.com/${specs.width}x${specs.height}/000000/FFFFFF/?text=${quality.toUpperCase()}+${duration}s`,
    fileSize,
    dimensions: { width: specs.width, height: specs.height },
    bitrate: specs.bitrate,
  };
}

