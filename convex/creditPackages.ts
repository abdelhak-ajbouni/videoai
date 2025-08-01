import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all active credit packages
export const getActivePackages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("creditPackages")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .collect();
  },
});

// Get a specific credit package by ID
export const getPackageById = query({
  args: { packageId: v.string() },
  handler: async (ctx, { packageId }) => {
    return await ctx.db
      .query("creditPackages")
      .withIndex("by_package_id", (q) => q.eq("packageId", packageId))
      .first();
  },
});

// Create a new credit package
export const createPackage = mutation({
  args: {
    packageId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    currency: v.string(),
    credits: v.number(),
    isActive: v.boolean(),
    isPopular: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("creditPackages", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a credit package
export const updatePackage = mutation({
  args: {
    packageId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    credits: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isPopular: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { packageId, ...updates } = args;

    const package_ = await ctx.db
      .query("creditPackages")
      .withIndex("by_package_id", (q) => q.eq("packageId", packageId))
      .first();

    if (!package_) {
      throw new Error("Package not found");
    }

    await ctx.db.patch(package_._id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return package_._id;
  },
});

// Delete a credit package
export const deletePackage = mutation({
  args: { packageId: v.string() },
  handler: async (ctx, { packageId }) => {
    const package_ = await ctx.db
      .query("creditPackages")
      .withIndex("by_package_id", (q) => q.eq("packageId", packageId))
      .first();

    if (!package_) {
      throw new Error("Package not found");
    }

    await ctx.db.delete(package_._id);
    return package_._id;
  },
});

// Initialize default credit packages
export const initializeDefaultPackages = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const defaultPackages = [
      {
        packageId: "small",
        name: "Small",
        description: "Perfect for getting started",
        price: 2000, // $20.00
        currency: "usd",
        credits: 100,
        isActive: true,
        isPopular: false,
      },
      {
        packageId: "medium",
        name: "Medium",
        description: "Great value for regular users",
        price: 4500, // $45.00
        currency: "usd",
        credits: 250,
        isActive: true,
        isPopular: true,
      },
      {
        packageId: "large",
        name: "Large",
        description: "For power users and creators",
        price: 8000, // $80.00
        currency: "usd",
        credits: 500,
        isActive: true,
        isPopular: false,
      },
      {
        packageId: "xlarge",
        name: "X-Large",
        description: "Maximum value for heavy usage",
        price: 15000, // $150.00
        currency: "usd",
        credits: 1000,
        isActive: true,
        isPopular: false,
      },
    ];

    const packageIds = [];

    for (const package_ of defaultPackages) {
      // Check if package already exists
      const existingPackage = await ctx.db
        .query("creditPackages")
        .withIndex("by_package_id", (q) =>
          q.eq("packageId", package_.packageId)
        )
        .first();

      if (!existingPackage) {
        const packageId = await ctx.db.insert("creditPackages", {
          ...package_,
          createdAt: now,
          updatedAt: now,
        });
        packageIds.push(packageId);
      }
    }

    return packageIds;
  },
});
