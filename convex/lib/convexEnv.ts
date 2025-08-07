import { z } from "zod";

/**
 * Convex-specific environment variable validation schema
 * Only includes variables that are available in the Convex environment
 */
const convexEnvSchema = z.object({
  // Stripe (available in Convex environment)
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, "STRIPE_SECRET_KEY is required")
    .refine(
      (key) => key.startsWith("sk_") && !key.includes("dummy") && !key.includes("test_dummy"),
      "STRIPE_SECRET_KEY must be a valid Stripe secret key (not a dummy/test value)"
    ),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, "STRIPE_WEBHOOK_SECRET is required")
    .refine(
      (secret) => secret.startsWith("whsec_"),
      "STRIPE_WEBHOOK_SECRET must be a valid Stripe webhook secret"
    ),

  // Replicate (available in Convex environment)
  REPLICATE_API_TOKEN: z
    .string()
    .min(1, "REPLICATE_API_TOKEN is required")
    .refine(
      (token) => token.startsWith("r8_"),
      "REPLICATE_API_TOKEN must be a valid Replicate API token"
    ),
  REPLICATE_WEBHOOK_SECRET: z
    .string()
    .min(1, "REPLICATE_WEBHOOK_SECRET is required")
    .optional(), // Make it optional since it might not be needed in all environments

  // Application configuration (available in Convex environment)
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .optional()
    .default("http://localhost:3000"),

  // Development mode (available in Convex environment)
  DEVELOPMENT_MODE: z
    .string()
    .transform(val => val === "true")
    .optional()
    .default(false),

  // Clerk JWT domain (available in Convex environment)
  CLERK_JWT_ISSUER_DOMAIN: z
    .string()
    .min(1, "CLERK_JWT_ISSUER_DOMAIN is required")
    .optional(),
});

/**
 * Validated Convex environment variables
 */
export let convexEnv: z.infer<typeof convexEnvSchema>;

/**
 * Validates Convex environment variables
 */
export function validateConvexEnvironment(): z.infer<typeof convexEnvSchema> {
  const result = convexEnvSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues;
    const errorMessage = [
      "❌ Convex environment validation failed:",
      "",
      ...issues.map(issue => {
        const path = issue.path.join(".");
        return `  • ${path}: ${issue.message}`;
      }),
      "",
      "Please check your Convex environment variables.",
    ].join("\n");

    console.error(errorMessage);
    throw new Error("Convex environment validation failed");
  }

  convexEnv = result.data;
  console.log("✅ Convex environment validation passed");
  return result.data;
}

/**
 * Get a validated Convex environment variable
 */
export function getConvexEnv<K extends keyof typeof convexEnv>(key: K): typeof convexEnv[K] {
  if (!convexEnv) {
    validateConvexEnvironment();
  }
  return convexEnv[key];
}

/**
 * Check if running in development mode (Convex version)
 */
export function isDevelopment(): boolean {
  return getConvexEnv("DEVELOPMENT_MODE") === true;
}

/**
 * Check if running in production mode (Convex version)
 */
export function isProduction(): boolean {
  return getConvexEnv("DEVELOPMENT_MODE") === false;
}

/**
 * Get secure configuration for external services (Convex version)
 */
export function getSecureConfig() {
  return {
    stripe: {
      secretKey: getConvexEnv("STRIPE_SECRET_KEY"),
      webhookSecret: getConvexEnv("STRIPE_WEBHOOK_SECRET"),
    },
    replicate: {
      apiToken: getConvexEnv("REPLICATE_API_TOKEN"),
      webhookSecret: getConvexEnv("REPLICATE_WEBHOOK_SECRET"),
    },
    clerk: {
      jwtIssuerDomain: getConvexEnv("CLERK_JWT_ISSUER_DOMAIN"),
    },
    convex: {
      siteUrl: getConvexEnv("NEXT_PUBLIC_APP_URL"),
    },
    app: {
      url: getConvexEnv("NEXT_PUBLIC_APP_URL"),
    },
  };
}

// Auto-validate Convex environment
try {
  validateConvexEnvironment();
} catch (error) {
  console.error("Failed to validate Convex environment:", error);
  // Don't exit in Convex environment, just log the error
}