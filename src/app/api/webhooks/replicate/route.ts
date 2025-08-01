import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract the prediction data from the webhook
    const { id: replicateJobId, status, output, error } = body;

    if (!replicateJobId) {
      console.error("No Replicate job ID found in webhook");
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    // Find the video by Replicate job ID using internal query
    const video = await convex.query(api.videos.getVideoByReplicateJobId, {
      replicateJobId,
    });

    if (!video) {
      console.error(`No video found with Replicate job ID: ${replicateJobId}`);
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

          // Trigger file download and thumbnail generation
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
          errorMessage: typeof error === "string" ? error : "Generation failed",
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
    console.error("Error handling Replicate webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
