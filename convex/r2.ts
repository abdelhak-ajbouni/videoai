import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";

const r2 = new R2(components.r2);

// Security constraints for file uploads
const SECURITY_LIMITS = {
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB max file size
  ALLOWED_VIDEO_TYPES: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo", // .avi
    "video/x-ms-wmv", // .wmv
  ],
  ALLOWED_EXTENSIONS: [".mp4", ".webm", ".mov", ".avi", ".wmv"],
  MAX_FILENAME_LENGTH: 255,
} as const;

/**
 * Validate file type and size for security
 */
function validateFileUpload(
  filename: string,
  contentType?: string,
  fileSize?: number
) {
  // Check filename length
  if (filename.length > SECURITY_LIMITS.MAX_FILENAME_LENGTH) {
    throw new Error("Filename too long. Maximum 255 characters allowed.");
  }

  // Check file extension
  const extension = filename
    .toLowerCase()
    .substring(
      filename.lastIndexOf(".")
    ) as (typeof SECURITY_LIMITS.ALLOWED_EXTENSIONS)[number];
  if (!SECURITY_LIMITS.ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(
      `Invalid file type. Allowed types: ${SECURITY_LIMITS.ALLOWED_EXTENSIONS.join(", ")}`
    );
  }

  // Check content type if provided
  if (
    contentType &&
    !SECURITY_LIMITS.ALLOWED_VIDEO_TYPES.includes(
      contentType.toLowerCase() as (typeof SECURITY_LIMITS.ALLOWED_VIDEO_TYPES)[number]
    )
  ) {
    throw new Error(
      `Invalid content type. Allowed types: ${SECURITY_LIMITS.ALLOWED_VIDEO_TYPES.join(", ")}`
    );
  }

  // Check file size if provided
  if (fileSize && fileSize > SECURITY_LIMITS.MAX_FILE_SIZE) {
    throw new Error(
      `File too large. Maximum size: ${SECURITY_LIMITS.MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  // Additional security checks
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|scr|pif|com)$/i, // Executable files
    /%[0-9a-f]{2}/i, // URL encoded characters
    /\x00/, // Null bytes
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(filename)) {
      throw new Error("Filename contains potentially malicious content");
    }
  }
}

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
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Validate file upload security constraints
    validateFileUpload(args.filename, args.contentType, args.fileSize);

    // Sanitize filename to prevent path traversal attacks
    const sanitizedFilename = sanitizeFilename(args.filename);

    // Generate unique key for the file
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const fileKey = `videos/${identity.subject}/${timestamp}-${random}-${sanitizedFilename}`;

    // Generate upload URL using R2 component
    const { url, key } = await r2.generateUploadUrl(fileKey);

    return {
      url,
      key,
      maxFileSize: SECURITY_LIMITS.MAX_FILE_SIZE,
      allowedTypes: SECURITY_LIMITS.ALLOWED_VIDEO_TYPES,
    };
  },
});

// Store video file in R2 (for server-side uploads)
export const storeVideoFile = action({
  args: {
    blob: v.any(), // File blob
    filename: v.string(),
    videoId: v.id("videos"),
    contentType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Validate file upload security constraints
    validateFileUpload(args.filename, args.contentType, args.fileSize);

    // Sanitize filename to prevent path traversal attacks
    const sanitizedFilename = sanitizeFilename(args.filename);

    // Generate unique key for the file with user prefix for consistency
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const fileKey = `videos/${identity.subject}/${timestamp}-${random}-${sanitizedFilename}`;

    // Store file in R2
    const key = await r2.store(ctx, args.blob, {
      key: fileKey,
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
      await r2.deleteObject(ctx, args.key);
    } catch (error) {
      console.error("Error deleting file from R2:", error);
      throw new Error("Failed to delete file");
    }
  },
});
