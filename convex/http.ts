import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Clerk webhook handler for user creation
http.route({
  path: "/api/webhooks/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.text();
      const payload = JSON.parse(body);

      console.log("Clerk webhook received:", payload.type);

      // Handle user creation
      if (payload.type === "user.created") {
        const { id, email_addresses, first_name, last_name, image_url } =
          payload.data;

        const primaryEmail = email_addresses.find(
          (email: any) => email.id === payload.data.primary_email_address_id
        );

        if (!primaryEmail) {
          console.error("No primary email found for user:", id);
          return new Response("No primary email", { status: 400 });
        }

        // Create user in our database with 10 free credits
        await ctx.runMutation(api.users.createUser, {
          clerkId: id,
          email: primaryEmail.email_address,
          name:
            first_name && last_name
              ? `${first_name} ${last_name}`
              : first_name || undefined,
          imageUrl: image_url || undefined,
        });

        console.log("User created successfully:", id);
      }

      // Handle user updates
      if (payload.type === "user.updated") {
        const { id, email_addresses, first_name, last_name, image_url } =
          payload.data;

        const primaryEmail = email_addresses.find(
          (email: any) => email.id === payload.data.primary_email_address_id
        );

        if (primaryEmail) {
          await ctx.runMutation(api.users.updateUser, {
            clerkId: id,
            email: primaryEmail.email_address,
            name:
              first_name && last_name
                ? `${first_name} ${last_name}`
                : first_name || undefined,
            imageUrl: image_url || undefined,
          });

          console.log("User updated successfully:", id);
        }
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error processing Clerk webhook:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }),
});

// Replicate webhook handler
http.route({
  path: "/api/webhooks/replicate",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Parse the webhook payload
      const body = await request.text();
      const payload = JSON.parse(body);

      console.log("Replicate webhook received:", payload);

      // Verify the webhook is for a prediction we care about
      if (!payload.id) {
        console.error("No prediction ID in webhook payload");
        return new Response("Missing prediction ID", { status: 400 });
      }

      // Find the generation job by Replicate ID
      const job = await ctx.runQuery(api.videos.getGenerationJobByReplicateId, {
        replicateJobId: payload.id,
      });

      if (!job) {
        console.log("No job found for Replicate ID:", payload.id);
        return new Response("Job not found", { status: 404 });
      }

      // Handle different webhook events
      switch (payload.status) {
        case "starting":
          await ctx.runMutation(api.videos.updateGenerationJob, {
            replicateJobId: payload.id,
            status: "starting",
            logs: payload.logs || [],
          });
          break;

        case "processing":
          await ctx.runMutation(api.videos.updateGenerationJob, {
            replicateJobId: payload.id,
            status: "processing",
            progress: payload.progress
              ? Math.round(payload.progress * 100)
              : undefined,
            logs: payload.logs || [],
          });
          break;

        case "succeeded":
          await handleSuccessfulGeneration(ctx, payload, job.videoId);
          break;

        case "failed":
        case "canceled":
          await handleFailedGeneration(ctx, payload, job.videoId);
          break;

        default:
          console.log("Unknown status:", payload.status);
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error processing Replicate webhook:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }),
});

// Handle Stripe webhook events
http.route({
  path: "/api/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    try {
      await ctx.runAction(api.stripe.handleStripeWebhook, {
        body,
        signature,
      });

      return new Response("Webhook processed successfully", { status: 200 });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(`Webhook error: ${error}`, { status: 400 });
    }
  }),
});

// Helper function to handle successful video generation
async function handleSuccessfulGeneration(
  ctx: any,
  payload: any,
  videoId: string
) {
  try {
    // Update generation job
    await ctx.runMutation(api.videos.updateGenerationJob, {
      replicateJobId: payload.id,
      status: "succeeded",
      progress: 100,
      output: payload.output,
      logs: payload.logs || [],
    });

    // Get the video URL from the output
    let videoUrl = null;
    if (payload.output) {
      if (typeof payload.output === "string") {
        videoUrl = payload.output;
      } else if (Array.isArray(payload.output) && payload.output.length > 0) {
        videoUrl = payload.output[0];
      } else if (payload.output.video) {
        videoUrl = payload.output.video;
      }
    }

    if (videoUrl) {
      // Download and store the video
      await ctx.runAction(api.videos.downloadAndStoreVideo, {
        videoId,
        videoUrl,
      });
    } else {
      // No video URL found, mark as failed
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId,
        status: "failed",
        errorMessage: "No video URL in Replicate output",
      });

      await ctx.runMutation(api.videos.refundCredits, { videoId });
    }
  } catch (error) {
    console.error("Error handling successful generation:", error);

    // Mark as failed and refund credits
    await ctx.runMutation(api.videos.updateVideoStatus, {
      videoId,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    await ctx.runMutation(api.videos.refundCredits, { videoId });
  }
}

// Helper function to handle failed video generation
async function handleFailedGeneration(ctx: any, payload: any, videoId: string) {
  try {
    // Update generation job
    await ctx.runMutation(api.videos.updateGenerationJob, {
      replicateJobId: payload.id,
      status: payload.status === "canceled" ? "canceled" : "failed",
      error: payload.error || "Generation failed",
      logs: payload.logs || [],
    });

    // Update video status
    await ctx.runMutation(api.videos.updateVideoStatus, {
      videoId,
      status: "failed",
      errorMessage: payload.error || "Generation failed",
    });

    // Refund credits
    await ctx.runMutation(api.videos.refundCredits, { videoId });
  } catch (error) {
    console.error("Error handling failed generation:", error);
  }
}

// Health check endpoint
http.route({
  path: "/api/health",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    return new Response(
      JSON.stringify({
        status: "OK",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
});

export default http;
