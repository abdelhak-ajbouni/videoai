# VideoAI - Convex Backend Setup

## Environment Variables

To use the video generation features, you need to set up the following environment variables in your Convex deployment:

### Required Environment Variables

1. **REPLICATE_API_TOKEN**
   - Get your API token from [Replicate Dashboard](https://replicate.com/account/api-tokens)
   - This is required for video generation using the Veo-3 model

2. **CONVEX_SITE_URL** 
   - Your deployed Convex site URL (for webhooks)
   - Format: `https://your-deployment.convex.dev`

### Setting Environment Variables

```bash
# In your project root, set environment variables for Convex
npx convex env set REPLICATE_API_TOKEN your_replicate_api_token_here
npx convex env set CONVEX_SITE_URL https://your-deployment.convex.dev
```

### Model Configuration

The current implementation uses the `google/veo-3` model on Replicate. You may need to:

1. Check the latest model version on [Replicate Veo-3 page](https://replicate.com/google/veo-3)
2. Update the model configuration in `convex/videos.ts` if needed
3. Ensure your Replicate account has access to the Veo-3 model

## Video Generation Flow

1. User creates video via `createVideo` mutation
2. Credits are deducted immediately 
3. `generateVideo` action is scheduled
4. Video generation starts on Replicate
5. Webhooks update status in real-time
6. Completed video is downloaded and stored in Convex File Storage
7. User receives real-time notifications

## Webhook Setup

The HTTP actions in `convex/http.ts` handle webhooks from Replicate at:
- `POST /api/webhooks/replicate` - Receives status updates from Replicate

Make sure your Convex deployment URL is properly set as the webhook URL in the Replicate API calls.

## Credit System

- Videos cost credits based on duration and quality
- Credits are deducted when generation starts
- If generation fails, credits are automatically refunded
- All transactions are logged in the `creditTransactions` table

## File Storage

Generated videos are stored using Convex File Storage and can be accessed via the `convexFileId` field on video records. 