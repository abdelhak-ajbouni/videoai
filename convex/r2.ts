import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";

const r2 = new R2(components.r2);

/**
 * Sanitize filename to prevent path traversal attacks
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[\/\\:*?"<>|]/g, "_") // Remove unsafe path characters
    .replace(/\.\.+/g, "_") // Remove any path traversal sequences
    .replace(/^[.\s]+/, "") // Remove leading dots and spaces
    .replace(/[\s]+/g, " ") // Normalize spaces
    .trim();
}

// Generate upload URL for R2
export const generateUploadUrl = mutation({
  args: {
    filename: v.string(),
    contentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Sanitize filename to prevent path traversal attacks
    const sanitizedFilename = sanitizeFilename(args.filename);

    // Generate unique key for the file
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const fileKey = `videos/${identity.subject}/${timestamp}-${random}-${sanitizedFilename}`;

    // Generate upload URL using R2 component
    const { url, key } = await r2.generateUploadUrl(fileKey);

    return { url, key };
  },
});

// Store video file in R2 (for server-side uploads)
export const storeVideoFile = action({
  args: {
    blob: v.any(), // File blob
    filename: v.string(),
    videoId: v.id("videos"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Sanitize filename to prevent path traversal attacks
    const sanitizedFilename = sanitizeFilename(args.filename);

    // Generate unique key for the file with user prefix for consistency
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const fileKey = `videos/${identity.subject}/${timestamp}-${random}-${sanitizedFilename}`;

    // Store file in R2
    const key = await r2.store(ctx, args.blob, {
      key: fileKey,
      type: args.filename.endsWith(".mp4")
        ? "video/mp4"
        : "application/octet-stream",
    });

    return key;
  },
});

// Get video file URL from R2
export const getVideoFileUrl = query({
  args: {
    key: v.string(),
    expiresIn: v.optional(v.number()), // Optional expiration in seconds
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is authorized to access this file
    const expectedPrefix = `videos/${identity.subject}/`;
    if (
      !args.key.startsWith(expectedPrefix) ||
      args.key.includes("../") ||
      args.key.includes("..\\")
    ) {
      throw new Error("Unauthorized access to file");
    }

    // Get file URL from R2 with optional expiration
    const url = await r2.getUrl(args.key, {
      expiresIn: args.expiresIn,
    });

    return url;
  },
});

// Get file metadata from R2
export const getFileMetadata = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is authorized to access this file's metadata
    const expectedPrefix = `videos/${identity.subject}/`;
    if (
      !args.key.startsWith(expectedPrefix) ||
      args.key.includes("../") ||
      args.key.includes("..\\")
    ) {
      throw new Error("Unauthorized access to file metadata");
    }

    const metadata = await r2.getMetadata(ctx, args.key);
    return metadata;
  },
});

// Delete video file from R2
export const deleteVideoFile = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user owns the file before allowing deletion
    const expectedPrefix = `videos/${identity.subject}/`;
    if (
      !args.key.startsWith(expectedPrefix) ||
      args.key.includes("../") ||
      args.key.includes("..\\")
    ) {
      throw new Error("Unauthorized: You can only delete your own files");
    }

    try {
      // Delete file from R2
      await r2.delete(args.key);
    } catch (error) {
      console.error("Error deleting file from R2:", error);
      throw new Error("Failed to delete file");
    }
  },
});

// List user's video files
export const listUserVideoFiles = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // List files with user's prefix
    const prefix = `videos/${identity.subject}/`;

    const result = await r2.listMetadata(ctx, args.limit || 50);

    return result;
  },
});
