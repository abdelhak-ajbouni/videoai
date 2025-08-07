import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import crypto from "crypto";
import { replicateWebhookSchema } from "../../../../../convex/lib/validation";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Verifies the Replicate webhook signature to ensure authenticity
 */
function verifyReplicateSignature(payload: string, signature: string | null): boolean {
  if (!signature) {
    console.error("Missing Replicate signature header");
    return false;
  }

  const webhookSecret = process.env.REPLICATE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing REPLICATE_WEBHOOK_SECRET environment variable");
    return false;
  }

  try {
    // Replicate uses HMAC-SHA256 for webhook signatures
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');
    
    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.replace(/^sha256=/, '');
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error("Error verifying Replicate signature:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('replicate-signature');

    // Verify webhook signature
    if (!verifyReplicateSignature(rawBody, signature)) {
      console.error("Invalid Replicate webhook signature");
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Parse and validate the payload
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error("Invalid JSON payload:", error);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Validate webhook payload structure
    const validationResult = replicateWebhookSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Invalid webhook payload:", validationResult.error.issues);
      return NextResponse.json(
        { error: "Invalid payload structure" },
        { status: 400 }
      );
    }

    // Extract the prediction data from the validated webhook
    const { id: replicateJobId, status, output } = validationResult.data;

    if (!replicateJobId) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    // Find the video by Replicate job ID using internal query
    const video = await convex.query(api.videos.getVideoByReplicateJobId, {
      replicateJobId,
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Handle different webhook statuses
    switch (status) {
      case "starting":
      case "processing":
        await convex.mutation(api.videos.updateVideoStatus, {
          videoId: video._id,
          status: "processing",
        });
        break;

      case "succeeded":
        if (output) {
          const videoUrl = Array.isArray(output) ? output[0] : output;

          await convex.mutation(api.videos.updateVideoStatus, {
            videoId: video._id,
            status: "completed",
            videoUrl: videoUrl,
          });

          // Trigger file download and storage
          await convex.action(api.videos.downloadAndStoreVideo, {
            videoId: video._id,
            videoUrl: videoUrl,
          });
        }
        break;

      case "failed":
        await convex.mutation(api.videos.updateVideoStatus, {
          videoId: video._id,
          status: "failed",
          errorMessage: "Generation failed",
        });

        // Refund credits
        await convex.mutation(api.videos.refundCredits, {
          videoId: video._id,
        });
        break;

      case "canceled":
        await convex.mutation(api.videos.updateVideoStatus, {
          videoId: video._id,
          status: "canceled",
        });

        // Refund credits
        await convex.mutation(api.videos.refundCredits, {
          videoId: video._id,
        });
        break;

      default:
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log the actual error for debugging but don't expose it
    console.error("Replicate webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
