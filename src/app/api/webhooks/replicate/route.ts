import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import crypto from "crypto";
import { replicateWebhookSchema } from "../../../../../convex/lib/validation";
import { getSecureConfig } from "../../../../../lib/env";

const config = getSecureConfig();
const convex = new ConvexHttpClient(config.convex.url);

/**
 * Verifies the Replicate webhook signature according to official documentation
 * https://replicate.com/docs/topics/webhooks/verify-webhook
 */
function verifyReplicateSignature(
  payload: string, 
  webhookId: string | null,
  webhookTimestamp: string | null,
  webhookSignature: string | null
): boolean {
  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.error("Missing required Replicate webhook headers");
    return false;
  }

  // Validate timestamp to prevent replay attacks (5 minutes tolerance)
  const timestampMs = parseInt(webhookTimestamp) * 1000;
  const currentTime = Date.now();
  const timeDifference = Math.abs(currentTime - timestampMs);
  const maxTimeDifference = 5 * 60 * 1000; // 5 minutes

  if (timeDifference > maxTimeDifference) {
    console.error("Webhook timestamp is too old or too far in the future");
    return false;
  }

  const webhookSecret = config.replicate.webhookSecret;
  
  // Remove 'whsec_' prefix if present (as per Replicate docs)
  const cleanSecret = webhookSecret.replace(/^whsec_/, '');

  try {
    // Construct signed content as per Replicate specification
    const signedContent = `${webhookId}.${webhookTimestamp}.${payload}`;
    
    // Generate expected signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', cleanSecret)
      .update(signedContent, 'utf8')
      .digest('base64');
    
    // Parse signatures from header (format: "v1,signature1 v1,signature2")
    const signatures = webhookSignature.split(' ');
    
    // Check if any of the provided signatures match
    for (const sig of signatures) {
      const [version, signature] = sig.split(',');
      if (version === 'v1') {
        try {
          // Use timing-safe comparison to prevent timing attacks
          if (crypto.timingSafeEqual(
            Buffer.from(signature, 'base64'),
            Buffer.from(expectedSignature, 'base64')
          )) {
            return true;
          }
        } catch {
          // Continue to next signature if comparison fails
          continue;
        }
      }
    }
    
    console.error("No valid signatures found in webhook header");
    return false;
  } catch (error) {
    console.error("Error verifying Replicate signature:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  let replicateJobId: string | undefined;
  let status: string | undefined;
  
  try {
    // Get the raw body and required headers for signature verification
    const rawBody = await request.text();
    const webhookId = request.headers.get('webhook-id');
    const webhookTimestamp = request.headers.get('webhook-timestamp');
    const webhookSignature = request.headers.get('webhook-signature');

    // Verify webhook signature according to Replicate specification
    if (!verifyReplicateSignature(rawBody, webhookId, webhookTimestamp, webhookSignature)) {
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
    const webhookData = validationResult.data;
    replicateJobId = webhookData.id;
    status = webhookData.status;
    const output = webhookData.output;

    if (!replicateJobId) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    // Check for duplicate webhook processing
    const eventId = `replicate_${replicateJobId}_${status}`;
    const isAlreadyProcessed = await convex.query(api.webhooks.getProcessedWebhook, {
      eventId,
      source: "replicate"
    });

    if (isAlreadyProcessed) {
      console.log(`Replicate webhook ${eventId} already processed, skipping`);
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    console.log(`Processing Replicate webhook: ${status} for job ${replicateJobId}`);

    let success = false;
    let errorMessage: string | undefined;
    let videoId: string | undefined;

    try {
      // Find the video by Replicate job ID using internal query
      const video = await convex.query(api.videos.getVideoByReplicateJobId, {
        replicateJobId,
      });

      if (!video) {
        throw new Error("Video not found");
      }

      videoId = video._id;

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
          console.log(`Unhandled Replicate webhook status: ${status}`);
      }

      success = true;
      console.log(`Successfully processed Replicate webhook: ${status} for job ${replicateJobId}`);
    } catch (processingError) {
      success = false;
      errorMessage = processingError instanceof Error ? processingError.message : "Unknown error";
      console.error(`Failed to process Replicate webhook ${replicateJobId}:`, processingError);
    }

    // Mark webhook as processed (success or failure)
    await convex.mutation(api.webhooks.markWebhookProcessed, {
      eventId,
      eventType: `replicate.${status}`,
      source: "replicate",
      processed: success,
      processedAt: Date.now(),
      errorMessage,
      metadata: {
        jobId: replicateJobId,
        videoId,
        hasOutput: !!output
      },
      createdAt: Date.now()
    });

    if (!success) {
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log the actual error for debugging but don't expose it
    console.error("Replicate webhook processing error:", error);
    
    // Try to mark webhook as failed (only if we have the necessary data)
    if (replicateJobId && status) {
      try {
        const eventId = `replicate_${replicateJobId}_${status}`;
        await convex.mutation(api.webhooks.markWebhookProcessed, {
          eventId,
          eventType: `replicate.${status}`,
          source: "replicate",
          processed: false,
          processedAt: Date.now(),
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          metadata: { jobId: replicateJobId },
          createdAt: Date.now()
        });
      } catch (trackingError) {
        console.error("Failed to track webhook failure:", trackingError);
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
