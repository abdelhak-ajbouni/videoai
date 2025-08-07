import { z } from "zod";

/**
 * Environment variable validation schema
 * All required environment variables must be defined here
 */
const envSchema = z.object({
  // Authentication
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  CLERK_JWT_ISSUER_DOMAIN: z.string().min(1, "CLERK_JWT_ISSUER_DOMAIN is required").optional(),

  // Convex Backend
  NEXT_PUBLIC_CONVEX_URL: z.string().url("NEXT_PUBLIC_CONVEX_URL must be a valid URL"),
  CONVEX_SITE_URL: z.string().url("CONVEX_SITE_URL must be a valid URL").optional(),

  // Stripe Payments
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, "STRIPE_SECRET_KEY is required")
    .refine(
      (key) => key.startsWith("sk_") && !key.includes("dummy") && !key.includes("test_dummy"),
      "STRIPE_SECRET_KEY must be a valid Stripe secret key (not a dummy/test value)"
    ),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required")
    .refine(
      (key) => key.startsWith("pk_"),
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be a valid Stripe publishable key"
    ),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, "STRIPE_WEBHOOK_SECRET is required")
    .refine(
      (secret) => secret.startsWith("whsec_"),
      "STRIPE_WEBHOOK_SECRET must be a valid Stripe webhook secret"
    ),

  // AI Integration
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
    .refine(
      (secret) => secret.startsWith("whsec_") || secret.length >= 32,
      "REPLICATE_WEBHOOK_SECRET must be a valid webhook secret"
    ),

  // Application URLs  
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .optional()
    .default("http://localhost:3000"),

  // Development/Production Mode
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DEVELOPMENT_MODE: z
    .string()
    .transform(val => val === "true")
    .optional(),
});

/**
 * Validated environment variables
 * This object contains all validated environment variables and can be imported safely
 */
export let env: z.infer<typeof envSchema>;

/**
 * Environment validation error class
 */
export class EnvironmentError extends Error {
  constructor(message: string, public issues: z.ZodIssue[]) {
    super(message);
    this.name = "EnvironmentError";
  }
}

/**
 * Validates all environment variables at startup
 * Should be called once at application startup
 */
export function validateEnvironment(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues;
    const errorMessage = [
      "❌ Environment validation failed:",
      "",
      ...issues.map(issue => {
        const path = issue.path.join(".");
        return `  • ${path}: ${issue.message}`;
      }),
      "",
      "Please check your environment variables and ensure all required values are set.",
    ].join("\n");

    console.error(errorMessage);
    throw new EnvironmentError("Environment validation failed", issues);
  }

  env = result.data;
  console.log("✅ Environment validation passed");
  return result.data;
}

/**
 * Get a validated environment variable
 * Use this instead of process.env directly for better type safety
 */
export function getEnv<K extends keyof typeof env>(key: K): typeof env[K] {
  if (!env) {
    throw new Error("Environment not validated. Call validateEnvironment() first.");
  }
  return env[key];
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getEnv("NODE_ENV") === "development" || getEnv("DEVELOPMENT_MODE") === true;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getEnv("NODE_ENV") === "production" && !getEnv("DEVELOPMENT_MODE");
}

/**
 * Get secure configuration for external services
 */
export function getSecureConfig() {
  return {
    stripe: {
      secretKey: getEnv("STRIPE_SECRET_KEY"),
      webhookSecret: getEnv("STRIPE_WEBHOOK_SECRET"),
      publishableKey: getEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
    },
    replicate: {
      apiToken: getEnv("REPLICATE_API_TOKEN"),
      webhookSecret: getEnv("REPLICATE_WEBHOOK_SECRET"),
    },
    clerk: {
      secretKey: getEnv("CLERK_SECRET_KEY"),
      publishableKey: getEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
      jwtIssuerDomain: getEnv("CLERK_JWT_ISSUER_DOMAIN"),
    },
    convex: {
      url: getEnv("NEXT_PUBLIC_CONVEX_URL"),
      siteUrl: getEnv("CONVEX_SITE_URL"),
    },
    app: {
      url: getEnv("NEXT_PUBLIC_APP_URL"),
    },
  };
}

// Auto-validate environment in non-test environments
if (typeof window === "undefined" && process.env.NODE_ENV !== "test") {
  try {
    validateEnvironment();
  } catch (error) {
    if (error instanceof EnvironmentError) {
      process.exit(1);
    }
    throw error;
  }
}