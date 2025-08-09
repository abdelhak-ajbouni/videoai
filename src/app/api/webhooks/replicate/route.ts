import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import crypto from "crypto";
import { replicateWebhookSchema } from "../../../../../convex/lib/validation";
import { env } from "../../../../../lib/env";

const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);

const getWebhookSecret = async () => {
  try {
    const response = await fetch(
      "https://api.replicate.com/v1/webhooks/default/secret",
      {
        headers: {
          Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Failed to fetch Replicate webhook secret:",
        response.statusText
      );
      return false;
    }

    const data = await response.json();
    return data.key;
  } catch (error) {
    console.error("Error fetching Replicate webhook secret:", error);
    return null;
  }
};

/**
 * Verifies the Replicate webhook signature according to official documentation
 * https://replicate.com/docs/topics/webhooks/verify-webhook
 */
async function verifyReplicateSignature(
  payload: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string
): Promise<boolean> {
  // Validate timestamp to prevent replay attacks (5 minutes tolerance)
  const timestampMs = parseInt(webhookTimestamp) * 1000;
  const currentTime = Date.now();
  const timeDifference = Math.abs(currentTime - timestampMs);
  const maxTimeDifference = 5 * 60 * 1000; // 5 minutes

  if (timeDifference > maxTimeDifference) {
    console.error("Webhook timestamp is too old or too far in the future");
    return false;
  }

  // Get the default webhook secret from Replicate API
  const webhookSecret = await getWebhookSecret();

  if (!webhookSecret) {
    console.error("No webhook secret returned from Replicate API");
    return false;
  }

  // Construct signed content as per Replicate specification
  const signedContent = `${webhookId}.${webhookTimestamp}.${payload}`;

  // Get the secret key (remove 'whsec_' prefix)
  const secretKey = webhookSecret.split("_")[1];
  const secretBytes = Buffer.from(secretKey, "base64");

  try {
    // Generate expected signature using HMAC-SHA256
    const computedSignature = crypto
      .createHmac("sha256", secretBytes)
      .update(signedContent)
      .digest("base64");

    const expectedSignatures = webhookSignature
      .split(" ")
      .map((sig) => sig.split(",")[1]);

    // Use constant-time comparison to prevent timing attacks
    const isValid = expectedSignatures.some((expectedSig) =>
      crypto.timingSafeEqual(
        Buffer.from(expectedSig),
        Buffer.from(computedSignature)
      )
    );

    return isValid;
  } catch (error) {
    console.error("Error verifying Replicate signature:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body and required headers for signature verification
    const rawBody = await request.text();
    const webhookId = request.headers.get("webhook-id");
    const webhookTimestamp = request.headers.get("webhook-timestamp");
    const webhookSignature = request.headers.get("webhook-signature");

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      console.error("Missing required Replicate webhook headers");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify webhook signature according to Replicate specification
    const isValid = await verifyReplicateSignature(
      rawBody,
      webhookId,
      webhookTimestamp,
      webhookSignature
    );

    if (!isValid) {
      console.error("Invalid Replicate webhook signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    console.log(
      `Processing Replicate webhook: ${status} for job ${replicateJobId}`
    );

    let success = false;

    try {
      // Find the video by Replicate job ID using internal query
      const video = await convex.query(api.videos.getVideoByReplicateJobId, {
        replicateJobId,
      });

      if (!video) {
        throw new Error("Video not found");
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
          console.log(`Unhandled Replicate webhook status: ${status}`);
      }

      success = true;
      console.log(
        `Successfully processed Replicate webhook: ${status} for job ${replicateJobId}`
      );
    } catch (processingError) {
      success = false;
      console.error(
        `Failed to process Replicate webhook ${replicateJobId}:`,
        processingError
      );
    }

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

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
