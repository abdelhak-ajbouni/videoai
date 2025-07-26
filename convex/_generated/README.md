# Convex Environment Variables Setup

## Required Environment Variables

To run the VideoAI application, you need to configure the following environment variables in your Convex deployment:

### Replicate API Integration
```bash
REPLICATE_API_TOKEN=your_replicate_api_token_here
```

Get your API token from: https://replicate.com/account/api-tokens

### Convex Site URL (for webhooks)
The `CONVEX_SITE_URL` environment variable is automatically provided by Convex and contains your deployment URL. This is used by Replicate to send webhook notifications back to your application.

## Setup Instructions

1. **Get Replicate API Token**:
   - Go to https://replicate.com/account/api-tokens
   - Create a new API token
   - Copy the token value

2. **Configure Environment Variables in Convex**:
   ```bash
   npx convex env set REPLICATE_API_TOKEN your_token_here
   ```
   
   Note: `CONVEX_SITE_URL` is automatically provided by Convex.

3. **Verify Configuration**:
   - The webhook endpoint will be available at: `${CONVEX_SITE_URL}/api/webhooks/replicate`
   - Make sure your Convex deployment is publicly accessible

## Testing the Integration

You can test the video generation by:
1. Creating a video through the UI
2. Checking the Convex logs for any errors
3. Monitoring the webhook endpoint for Replicate callbacks

## Environment Variable Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `REPLICATE_API_TOKEN` | Your Replicate API authentication token | Yes | `r8_...` |
| `CONVEX_SITE_URL` | Your Convex deployment URL for webhooks | Auto | `https://yourdeploy.convex.site` | 