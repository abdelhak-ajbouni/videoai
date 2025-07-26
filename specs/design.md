# VideoAI - Technical Design Specification

## 1. Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Convex        │    │  External APIs  │
│   (Next.js)     │◄──►│   Backend       │◄──►│                 │
│                 │    │                 │    │ • Replicate     │
│ • Dashboard     │    │ • Functions     │    │ • Stripe        │
│ • Generator     │    │ • Auth          │    │ • Clerk         │
│ • Library       │    │ • File Storage  │    │                 │
│ • Billing       │    │ • Real-time DB  │    │                 │
│                 │    │ • Cron Jobs     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Convex DB     │
                    │   (Real-time)   │
                    │                 │
                    │ • users         │
                    │ • videos        │
                    │ • subscriptions │
                    │ • credits       │
                    │ • files         │
                    └─────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Redix UI
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation

#### Backend
- **Backend Platform**: Convex
- **Database**: Convex DB (Real-time)
- **Server Functions**: Convex Functions
- **Authentication**: Clerk + Convex Auth
- **File Storage**: Convex File Storage
- **Payments**: Stripe
- **Video Generation**: Replicate (Veo-3)
- **Scheduling**: Convex Cron Jobs

#### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Convex Cloud
- **CDN**: Convex File Storage CDN
- **Monitoring**: Convex Dashboard + Sentry

## 2. Convex Functions

### Authentication Functions
```typescript
// Queries
getCurrentUser()            // Get current user data
getUserById(userId: Id<"users">)  // Get user by ID

// Mutations  
createUser(userData)        // Create new user (Clerk webhook)
updateUser(userId, updates) // Update user profile
updateLastActive(userId)    // Update last active timestamp
```

### Video Management Functions
```typescript
// Queries
getVideos()                 // List user's videos (real-time)
getVideo(videoId: Id<"videos">)  // Get specific video
getVideosByStatus(status)   // Get videos by status

// Mutations
createVideo(prompt, settings)    // Create video record
updateVideoStatus(videoId, status)  // Update generation status
deleteVideo(videoId)        // Delete video
updateVideoMetadata(videoId, data)  // Update video metadata

// Actions (External API calls)
generateVideo(videoId)      // Call Replicate API
downloadAndStoreVideo(replicateUrl, videoId)  // Store completed video
```

### Credit System Functions
```typescript
// Queries
getCredits()               // Get user credit balance (real-time)
getCreditHistory()         // Credit usage history
getCreditBalance(userId)   // Get specific user's balance

// Mutations
deductCredits(userId, amount, videoId)  // Deduct credits for generation
addCredits(userId, amount, reason)      // Add credits (purchase/bonus)
refundCredits(videoId)     // Refund failed generation
```

### Subscription Management Functions
```typescript
// Queries
getSubscription()          // Get current subscription
getSubscriptionHistory()   // Subscription history

// Mutations
updateSubscription(subscriptionData)  // Update subscription status
allocateMonthlyCredits(userId)       // Monthly credit allocation

// Actions
createCheckoutSession(priceId)       // Create Stripe checkout
cancelSubscription(subscriptionId)   // Cancel subscription
getCustomerPortal()                  // Get Stripe portal URL
```

### Webhook Handlers (HTTP Actions)
```typescript
// HTTP Actions for external webhooks
stripeWebhook(request)     // Handle Stripe events
replicateWebhook(request)  // Handle Replicate status updates
clerkWebhook(request)      // Handle Clerk user events
```

### Scheduled Functions (Cron Jobs)
```typescript
// Cron Jobs
cleanupExpiredCredits()    // Monthly cleanup (1st of month)
processMonthlyCredits()    // Allocate subscription credits (1st of month)
cleanupFailedGenerations() // Daily cleanup of failed videos (daily)
generateUsageReports()     // Weekly usage analytics (weekly)
```

## 3. Convex Schema

### Database Schema Definition
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),     // Primary identifier from Clerk
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    profileImage: v.optional(v.string()),
    
    // Custom fields
    credits: v.number(),         // Current credit balance
    totalCreditsUsed: v.number(), // Lifetime usage
    subscriptionTier: v.union(
      v.literal("FREE"),
      v.literal("STARTER"), 
      v.literal("PRO"),
      v.literal("BUSINESS")
    ),
    stripeCustomerId: v.optional(v.string()),
    lastActiveAt: v.number(),    // Unix timestamp
  })
    .index("by_clerk_id", ["clerkUserId"])
    .index("by_email", ["email"]),

  videos: defineTable({
    userId: v.id("users"),       // Reference to users table
    title: v.optional(v.string()),
    prompt: v.string(),          // User's text prompt
    enhancedPrompt: v.optional(v.string()), // AI-enhanced prompt
    
    // Generation details
    status: v.union(
      v.literal("PENDING"),
      v.literal("PROCESSING"), 
      v.literal("UPLOADING"),
      v.literal("COMPLETED"),
      v.literal("FAILED")
    ),
    replicateId: v.optional(v.string()), // Replicate prediction ID
    error: v.optional(v.string()),
    
    // Video properties
    videoFileId: v.optional(v.id("_storage")), // Convex file storage ID
    thumbnailFileId: v.optional(v.id("_storage")),
    duration: v.optional(v.number()),    // In seconds
    qualityTier: v.union(
      v.literal("STANDARD"),
      v.literal("HD"),
      v.literal("4K")
    ),
    
    // Metadata
    creditsUsed: v.number(),
    generationTimeMs: v.optional(v.number()),
    completedAt: v.optional(v.number()),  // Unix timestamp
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    
    // Stripe details
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    stripePriceId: v.string(),
    
    // Plan details
    planType: v.union(
      v.literal("STARTER"),
      v.literal("PRO"),
      v.literal("BUSINESS")
    ),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("CANCELED"),
      v.literal("PAST_DUE"),
      v.literal("UNPAID")
    ),
    
    // Billing cycle
    currentPeriodStart: v.number(),  // Unix timestamp
    currentPeriodEnd: v.number(),    // Unix timestamp
    cancelAtPeriodEnd: v.boolean(),
    
    // Credits
    monthlyCredits: v.number(),
    creditsUsedThisPeriod: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"])
    .index("by_status", ["status"]),

  creditTransactions: defineTable({
    userId: v.id("users"),
    
    type: v.union(
      v.literal("PURCHASE"),
      v.literal("USAGE"),
      v.literal("BONUS"),
      v.literal("REFUND")
    ),
    amount: v.number(),          // Positive for add, negative for subtract
    description: v.string(),
    
    // References
    videoId: v.optional(v.id("videos")),
    subscriptionId: v.optional(v.id("subscriptions")),
    stripePaymentId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_video", ["videoId"]),
});
```

### TypeScript Types (Generated by Convex)
```typescript
// These types are automatically generated by Convex
import { Doc, Id } from "./_generated/dataModel";

export type User = Doc<"users">;
export type Video = Doc<"videos">;
export type Subscription = Doc<"subscriptions">;
export type CreditTransaction = Doc<"creditTransactions">;

// Helper types
export type UserId = Id<"users">;
export type VideoId = Id<"videos">;
export type SubscriptionId = Id<"subscriptions">;
export type FileId = Id<"_storage">;
```

## 4. Video Generation Lifecycle

### Phase 1: Request Validation (Convex Mutation)
1. Validate user authentication (Clerk + Convex Auth)
2. Check credit balance via real-time query
3. Validate prompt (length, content policy)
4. Create video record with PENDING status (atomic operation)
5. Reserve credits temporarily

### Phase 2: Generation Initiation (Convex Action)
1. Trigger `generateVideo` action with video ID
2. Submit to Replicate API with Veo-3 model
3. Update video status to PROCESSING (real-time update)
4. Store Replicate prediction ID
5. Schedule status monitoring

### Phase 3: Real-time Monitoring
1. **Webhook Handling**: Receive Replicate status via HTTP action
2. **Real-time Updates**: All clients receive instant status updates
3. **Progress Tracking**: Update generation progress in real-time
4. **Error Detection**: Immediate failure detection and handling

### Phase 4: Video Completion (Convex Action)
1. Download generated video from Replicate
2. Store video file in Convex File Storage
3. Generate and store thumbnail
4. Update video record to COMPLETED (atomic operation)
5. Deduct final credits from user balance
6. Real-time notification to user

### Phase 5: Error Handling (Automatic)
1. **Real-time Error Detection**: Immediate failure notifications
2. **Automatic Refunds**: Credits refunded via Convex mutation
3. **Error Logging**: Built-in Convex logging and monitoring
4. **Retry Logic**: Configurable retry attempts for transient failures

### Real-time Features
- **Live Status Updates**: Users see generation progress in real-time
- **Credit Balance Updates**: Instant credit balance updates across all sessions
- **Error Notifications**: Immediate error feedback
- **Queue Visibility**: Real-time view of generation queue status

## 5. Page Structure

### Public Pages
```
/                          # Landing page
/pricing                   # Pricing tiers
/sign-in                   # Clerk sign-in
/sign-up                   # Clerk sign-up
/privacy                   # Privacy policy
/terms                     # Terms of service
```

### Protected Pages (Dashboard Layout)
```
/dashboard                 # Main dashboard
/generate                  # Video generation interface
/library                   # Video library/gallery
/library/[videoId]         # Individual video view
/billing                   # Subscription management
/settings                  # User preferences
```

### Convex Backend
```
convex/
├── functions/             # Convex functions (queries/mutations/actions)
├── schema.ts             # Database schema
├── auth.config.ts        # Authentication configuration  
├── crons.ts             # Scheduled functions
└── http.ts              # HTTP actions for webhooks
```

## 6. Component Architecture

### Layout Components
- `DashboardLayout` - Main app shell with navigation
- `AuthLayout` - Simple layout for auth pages
- `LandingLayout` - Marketing site layout

### Feature Components
- `VideoGenerator` - Prompt input and generation UI
- `VideoLibrary` - Grid view of user's videos
- `VideoCard` - Individual video preview component
- `CreditMeter` - Credit balance display
- `SubscriptionCard` - Current plan display
- `GenerationProgress` - Real-time status updates

### UI Components (Radix UI)
- Forms, buttons, dialogs, toasts  
- Data tables, pagination
- Loading states, progress bars
- Real-time status indicators

## 7. State Management

### Global State (Zustand) - Minimal
```typescript
interface AppState {
  // UI-only state
  selectedVideo: VideoId | null;
  generationModalOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Actions
  setSelectedVideo: (videoId: VideoId | null) => void;
  toggleGenerationModal: () => void;
  toggleSidebar: () => void;
}
```

### Real-time Server State (Convex Hooks)
```typescript
// All server state is real-time via Convex hooks
const user = useQuery(api.users.getCurrentUser);
const credits = useQuery(api.credits.getCredits);
const subscription = useQuery(api.subscriptions.getSubscription);
const videos = useQuery(api.videos.getVideos);
const videoStatus = useQuery(api.videos.getVideo, { videoId });

// Mutations are optimistic by default
const generateVideo = useMutation(api.videos.createVideo);
const updateVideo = useMutation(api.videos.updateVideoMetadata);
```

### Benefits of Convex State Management
- **Real-time Updates**: All data updates instantly across all clients
- **Optimistic Updates**: UI updates immediately, syncs in background
- **Automatic Caching**: Built-in intelligent caching and invalidation
- **No Polling**: Webhooks and real-time subscriptions eliminate polling
- **Offline Support**: Automatic offline/online state management

## 8. Security Considerations

### Authentication & Authorization
- Clerk handles user authentication
- Convex Auth integration for server-side validation
- Row-level security via Convex function auth checks
- User can only access their own resources (enforced at function level)

### Input Validation
- Convex validators for all function inputs
- Zod schemas for complex validation
- Prompt content filtering
- File upload restrictions via Convex File Storage

### Rate Limiting
- Built-in Convex rate limiting per function
- Generation requests: 5 per minute per user
- Credit system prevents abuse
- Webhook verification for external services

### Data Protection
- Environment variables for secrets in Convex deployment
- Built-in HTTPS encryption
- No SQL injection risk (NoSQL database)
- Automatic data validation and sanitization

## 9. Performance Optimization

### Frontend
- Next.js static generation for marketing pages
- Image optimization for video thumbnails
- Lazy loading for video library
- Optimistic UI updates via Convex
- Real-time updates eliminate unnecessary re-fetches

### Backend (Convex)
- Automatic database indexing optimization
- Built-in connection pooling and scaling
- Intelligent caching with automatic invalidation
- Edge deployment for low latency
- Automatic function optimization

### Video Delivery
- CDN distribution via Convex File Storage
- Progressive video loading
- Thumbnail generation and storage
- Automatic file compression and optimization

## 10. Monitoring & Analytics

### Application Monitoring
- Built-in Convex Dashboard monitoring
- Function execution metrics and logs
- Real-time performance analytics
- Error tracking with Sentry integration
- Vercel Analytics for frontend monitoring

### Business Metrics
- User engagement: videos generated per user
- Conversion funnel: signup → first video → subscription
- Revenue metrics: MRR, churn, LTV
- Credit utilization patterns
- Real-time usage analytics

### Alerting
- Convex function failure alerts
- Failed video generations (real-time)
- Payment processing errors
- High error rates or response times
- Credit system anomalies
- Automatic scaling alerts 