// Environment variables
export const env = {
  // Authentication
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY!,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  CLERK_JWT_ISSUER_DOMAIN: process.env.CLERK_JWT_ISSUER_DOMAIN,

  // Convex Backend
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL!,
  CONVEX_SITE_URL: process.env.CONVEX_SITE_URL,

  // Stripe Payments
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,

  // AI Integration
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN!,

  // Application URLs
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Development/Production Mode
  NODE_ENV: process.env.NODE_ENV || "development",
  DEVELOPMENT_MODE: process.env.DEVELOPMENT_MODE === "true",
} as const;

// Helper functions
export function isDevelopment(): boolean {
  return env.NODE_ENV === "development" || env.DEVELOPMENT_MODE;
}

export function isProduction(): boolean {
  return env.NODE_ENV === "production" && !env.DEVELOPMENT_MODE;
}
