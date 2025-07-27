import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Migration to add new fields to existing videos
export const migrateVideoSchema = mutation({
  args: {},
  handler: async (ctx) => {
    const videos = await ctx.db.query("videos").collect();

    let updatedCount = 0;

    for (const video of videos) {
      const updates: {
        viewCount?: number;
        downloadCount?: number;
        shareCount?: number;
        isPublic?: boolean;
        isFavorite?: boolean;
        updatedAt: number;
      } = { updatedAt: Date.now() };

      // Add missing analytics fields
      if (video.viewCount === undefined) updates.viewCount = 0;
      if (video.downloadCount === undefined) updates.downloadCount = 0;
      if (video.shareCount === undefined) updates.shareCount = 0;

      // Add missing content management fields
      if (video.isPublic === undefined) updates.isPublic = false;
      if (video.isFavorite === undefined) updates.isFavorite = false;

      // Only update if there are missing fields
      if (Object.keys(updates).length > 1) {
        // More than just updatedAt
        await ctx.db.patch(video._id, updates);
        updatedCount++;
      }
    }

    return { updatedCount, totalVideos: videos.length };
  },
});

// Migration to calculate file sizes for existing videos (if videoUrl exists)
export const calculateMissingFileSizes = mutation({
  args: {},
  handler: async (ctx) => {
    const videos = await ctx.db
      .query("videos")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "completed"),
          q.neq(q.field("videoUrl"), undefined),
          q.eq(q.field("fileSize"), undefined)
        )
      )
      .collect();

    let updatedCount = 0;

    // Note: This would require actual HTTP requests to get file sizes
    // For now, we'll estimate based on quality and duration
    for (const video of videos) {
      const estimatedSize = estimateFileSize(video.quality, video.duration);

      await ctx.db.patch(video._id, {
        fileSize: estimatedSize,
        format: "mp4",
        codec: "h264",
        dimensions:
          video.quality === "high"
            ? { width: 1920, height: 1080 }
            : { width: 1280, height: 720 },
        actualDuration: parseInt(video.duration),
        updatedAt: Date.now(),
      });

      updatedCount++;
    }

    return { updatedCount, totalVideos: videos.length };
  },
});

// Migration to add model field to existing videos
export const addModelFieldToVideos = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all videos that don't have a model field
    const videos = await ctx.db.query("videos").collect();

    let updatedCount = 0;

    for (const video of videos) {
      if (!video.model) {
        // Update the video with the default model
        await ctx.db.patch(video._id, {
          model: "google/veo-3", // Default to Google Veo-3 for existing videos
        });
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} videos with default model`);
    return { updatedCount };
  },
});

// Migration to fix invalid duration values
export const fixInvalidDurations = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all videos with invalid duration values
    const videos = await ctx.db.query("videos").collect();

    let updatedCount = 0;

    for (const video of videos) {
      const currentDuration = video.duration as string;
      let newDuration: "5" | "8" | "9" = "8"; // Default to 8s

      // Convert old duration values to valid ones
      if (currentDuration === "15") {
        newDuration = "8"; // Convert 15s to 8s (Google Veo-3 default)
      } else if (currentDuration === "30") {
        newDuration = "9"; // Convert 30s to 9s (Luma Ray-2 max)
      } else if (currentDuration === "60") {
        newDuration = "9"; // Convert 60s to 9s (Luma Ray-2 max)
      }

      // Update if duration changed
      if (currentDuration !== newDuration) {
        await ctx.db.patch(video._id, {
          duration: newDuration,
        });
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} videos with valid duration values`);
    return { updatedCount };
  },
});

// Helper function to estimate file size
function estimateFileSize(quality: string, duration: string): number {
  const durationNum = parseInt(duration);

  // Rough estimates in bytes (bitrate * duration)
  const bitrateEstimates = {
    standard: 2000000, // 2 Mbps
    high: 5000000, // 5 Mbps
    ultra: 10000000, // 10 Mbps
  };

  const bitrate =
    bitrateEstimates[quality as keyof typeof bitrateEstimates] || 2000000;

  // Convert bitrate to bytes per second and multiply by duration
  return Math.round((bitrate / 8) * durationNum);
}
