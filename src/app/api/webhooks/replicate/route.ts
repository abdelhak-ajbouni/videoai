import { NextRequest } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("Replicate webhook received:", {
      id: body.id,
      status: body.status,
      model: body.model,
    });

    // Find the video record by Replicate job ID
    const video = await convex.query(api.videos.getVideoByReplicateJobId, {
      replicateJobId: body.id,
    });

    if (!video) {
      console.error("Video not found for Replicate job ID:", body.id);
      return new Response("Video not found", { status: 404 });
    }

    // Update video status based on Replicate webhook
    switch (body.status) {
      case "starting":
        await convex.mutation(api.videos.updateVideoStatus, {
          videoId: video._id,
          status: "processing",
          replicateJobId: body.id,
        });
        break;

      case "processing":
        // Keep status as processing
        break;

      case "succeeded":
        if (body.output) {
          // Handle successful generation
          const videoUrl = Array.isArray(body.output) ? body.output[0] : body.output;
          
          await convex.mutation(api.videos.updateVideoStatus, {
            videoId: video._id,
            status: "completed",
            videoUrl: videoUrl,
            replicateJobId: body.id,
          });

          // Schedule video download and storage
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
          errorMessage: body.error || "Video generation failed",
          replicateJobId: body.id,
        });
        break;

      case "canceled":
        await convex.mutation(api.videos.updateVideoStatus, {
          videoId: video._id,
          status: "canceled",
          replicateJobId: body.id,
        });
        break;

      default:
        console.log("Unhandled Replicate status:", body.status);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing Replicate webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}