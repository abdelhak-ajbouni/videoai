import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Query to get user's videos
export const getUserVideos = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db
      .query("videos")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Query to get a specific video
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

    const user = await ctx.db.get(video.userId);
    if (!user || user.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
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

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db
      .query("videos")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", user._id).eq("status", args.status)
      )
      .order("desc")
      .collect();
  },
});

// Mutation to create a new video generation request
export const createVideo = mutation({
  args: {
    title: v.string(),
    prompt: v.string(),
    quality: v.union(v.literal("standard"), v.literal("high")),
    duration: v.union(v.literal("5"), v.literal("10")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Calculate credit cost based on quality and duration
    const creditsCost = calculateCreditCost(args.quality, args.duration);

    // Check if user has enough credits
    if (user.credits < creditsCost) {
      throw new Error("Insufficient credits");
    }

    const now = Date.now();

    // Create video record
    const videoId = await ctx.db.insert("videos", {
      userId: user._id,
      title: args.title,
      prompt: args.prompt,
      quality: args.quality,
      duration: args.duration,
      status: "pending",
      creditsCost,
      createdAt: now,
      updatedAt: now,
    });

    // Deduct credits immediately
    await ctx.db.patch(user._id, {
      credits: user.credits - creditsCost,
      totalCreditsUsed: user.totalCreditsUsed + creditsCost,
      updatedAt: now,
    });

    // Record credit transaction
    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      type: "video_generation",
      amount: -creditsCost,
      description: `Video generation: ${args.title}`,
      videoId,
      balanceBefore: user.credits,
      balanceAfter: user.credits - creditsCost,
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

    const user = await ctx.db.get(video.userId);
    if (!user || user.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.videoId);

    // Also delete related generation job if exists
    const generationJob = await ctx.db
      .query("generationJobs")
      .withIndex("by_video", (q) => q.eq("videoId", args.videoId))
      .first();

    if (generationJob) {
      await ctx.db.delete(generationJob._id);
    }
  },
});

// Action to generate video using Replicate API
export const generateVideo = action({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args): Promise<string> => {
    const video = await ctx.runQuery(api.videos.getVideo, {
      videoId: args.videoId,
    });
    if (!video) {
      throw new Error("Video not found");
    }

    try {
      // Import Replicate
      const Replicate = require("replicate");
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });

      // Update status to processing
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "processing",
      });

      // Prepare input for Veo-3 model
      const input: {
        prompt: string;
        duration_seconds?: number;
        aspect_ratio?: string;
        seed?: number;
      } = {
        prompt: video.prompt,
        duration_seconds: parseInt(video.duration),
        aspect_ratio: "16:9",
      };

      // Add random seed for variation
      input.seed = Math.floor(Math.random() * 1000000);

      // Start the prediction with google/veo-3 model
      const prediction: any = await replicate.predictions.create({
        model: "google/veo-3",
        input: input,
        webhook: `${process.env.CONVEX_SITE_URL}/api/webhooks/replicate`,
        webhook_events_filter: ["start", "output", "logs", "completed"],
      });

      // Update video with Replicate job ID
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "processing",
        replicateJobId: prediction.id,
      });

      // Create generation job record
      await ctx.runMutation(api.videos.createGenerationJob, {
        videoId: args.videoId,
        replicateJobId: prediction.id,
        status: "starting",
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

// Mutation to create generation job
export const createGenerationJob = mutation({
  args: {
    videoId: v.id("videos"),
    replicateJobId: v.string(),
    status: v.union(
      v.literal("starting"),
      v.literal("processing"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("canceled")
    ),
  },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    const now = Date.now();

    await ctx.db.insert("generationJobs", {
      userId: video.userId,
      videoId: args.videoId,
      replicateJobId: args.replicateJobId,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Mutation to update generation job
export const updateGenerationJob = mutation({
  args: {
    replicateJobId: v.string(),
    status: v.union(
      v.literal("starting"),
      v.literal("processing"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("canceled")
    ),
    progress: v.optional(v.number()),
    logs: v.optional(v.array(v.string())),
    output: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("generationJobs")
      .withIndex("by_replicate_job_id", (q) =>
        q.eq("replicateJobId", args.replicateJobId)
      )
      .first();

    if (!job) {
      throw new Error("Generation job not found");
    }

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.progress !== undefined) {
      updateData.progress = args.progress;
    }

    if (args.logs) {
      updateData.logs = args.logs;
    }

    if (args.output) {
      updateData.output = args.output;
    }

    if (args.error) {
      updateData.error = args.error;
    }

    if (args.status === "processing" && !job.startedAt) {
      updateData.startedAt = Date.now();
    }

    if (
      (args.status === "succeeded" || args.status === "failed") &&
      !job.completedAt
    ) {
      updateData.completedAt = Date.now();
    }

    await ctx.db.patch(job._id, updateData);
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

    const user = await ctx.db.get(video.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    // Refund credits
    await ctx.db.patch(user._id, {
      credits: user.credits + video.creditsCost,
      totalCreditsUsed: Math.max(0, user.totalCreditsUsed - video.creditsCost),
      updatedAt: now,
    });

    // Record refund transaction
    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      type: "refund",
      amount: video.creditsCost,
      description: `Refund for failed video generation: ${video.title}`,
      videoId: args.videoId,
      balanceBefore: user.credits,
      balanceAfter: user.credits + video.creditsCost,
      createdAt: now,
    });
  },
});

// Query to get generation job by Replicate ID
export const getGenerationJobByReplicateId = query({
  args: { replicateJobId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generationJobs")
      .withIndex("by_replicate_job_id", (q) =>
        q.eq("replicateJobId", args.replicateJobId)
      )
      .first();
  },
});

// Action to download and store video from Replicate
export const downloadAndStoreVideo = action({
  args: {
    videoId: v.id("videos"),
    videoUrl: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Download the video file
      const response = await fetch(args.videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Store the video file in Convex file storage
      const fileId = await ctx.storage.store(blob);

      // Update video with the stored file ID and mark as completed
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "completed",
        convexFileId: fileId,
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

// Helper function to calculate credit cost
function calculateCreditCost(
  quality: "standard" | "high",
  duration: "5" | "10"
): number {
  const baseCost = duration === "5" ? 5 : 10;
  const qualityMultiplier = quality === "high" ? 2 : 1;
  return baseCost * qualityMultiplier;
}
