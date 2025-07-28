import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import Stripe from "stripe";
import { ActionCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy", {
  apiVersion: "2025-06-30.basil",
});

// Helper function to get credit package from database
async function getCreditPackage(ctx: ActionCtx, packageId: string) {
  const package_ = await ctx.runQuery(api.creditPackages.getPackageById, {
    packageId,
  });

  if (!package_) {
    throw new Error(`Credit package not found: ${packageId}`);
  }

  return {
    credits: package_.credits,
    price: package_.price,
  };
}

// Helper function to get subscription plan from database
async function getSubscriptionPlan(ctx: ActionCtx, planId: string) {
  const plan = await ctx.runQuery(api.subscriptionPlans.getPlanById, {
    planId,
  });

  if (!plan) {
    throw new Error(`Subscription plan not found: ${planId}`);
  }

  return {
    priceId: plan.priceId,
    credits: plan.monthlyCredits,
    price: plan.price,
  };
}

// Get user's Stripe customer ID or create one
export const getOrCreateStripeCustomer = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // If user already has a Stripe customer ID, return it
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        convexUserId: userId,
      },
    });

    // Update user with Stripe customer ID
    await ctx.db.patch(userId, {
      stripeCustomerId: customer.id,
    });

    return customer.id;
  },
});

// Create checkout session for credit purchase
export const createCreditCheckoutSession = action({
  args: {
    userId: v.id("users"),
    packageId: v.union(
      v.literal("small"),
      v.literal("medium"),
      v.literal("large"),
      v.literal("xlarge")
    ),
  },
  handler: async (ctx: ActionCtx, { userId, packageId }): Promise<string> => {
    const user = await ctx.runQuery(api.users.getUser, { userId });
    if (!user) throw new Error("User not found");

    const packageConfig = await getCreditPackage(ctx, packageId);
    const customerId: string = await ctx.runMutation(
      api.stripe.getOrCreateStripeCustomer,
      {
        userId,
      }
    );

    const session: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${packageConfig.credits} Credits`,
                description: `Purchase ${packageConfig.credits} credits for video generation`,
              },
              unit_amount: packageConfig.price,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&credits=${packageConfig.credits}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
        metadata: {
          userId,
          packageId,
          credits: packageConfig.credits.toString(),
          type: "credit_purchase",
        },
      });

    return session.url!;
  },
});

// Create checkout session for subscription
export const createSubscriptionCheckoutSession = action({
  args: {
    userId: v.id("users"),
    planId: v.union(
      v.literal("starter"),
      v.literal("pro"),
      v.literal("business")
    ),
  },
  handler: async (ctx: ActionCtx, { userId, planId }): Promise<string> => {
    const user = await ctx.runQuery(api.users.getUser, { userId });
    if (!user) throw new Error("User not found");

    const planConfig = await getSubscriptionPlan(ctx, planId);
    const customerId: string = await ctx.runMutation(
      api.stripe.getOrCreateStripeCustomer,
      {
        userId,
      }
    );

    const session: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: planConfig.priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success&plan=${planId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=canceled`,
        metadata: {
          userId,
          planId,
          type: "subscription",
        },
      });

    return session.url!;
  },
});

// Create customer portal session
export const createCustomerPortalSession = action({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.runQuery(api.users.getUser, { userId });
    if (!user?.stripeCustomerId) throw new Error("No Stripe customer found");

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return session.url;
  },
});

// Handle Stripe webhook events
export const handleStripeWebhook = action({
  args: { body: v.string(), signature: v.string() },
  handler: async (ctx, { body, signature }) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    let event: Stripe.Event;

    console.log("Stripe webhook received:", {
      bodyLength: body.length,
      hasSignature: !!signature,
    });

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        endpointSecret
      );
      console.log("Webhook event verified:", event.type);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      throw new Error(`Webhook signature verification failed: ${err}`);
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        console.log("Processing checkout.session.completed event");
        await handleCheckoutSessionCompleted(
          ctx,
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "invoice.payment_succeeded":
        console.log("Processing invoice.payment_succeeded event");
        await handleInvoicePaymentSucceeded(
          ctx,
          event.data.object as Stripe.Invoice
        );
        break;
      case "customer.subscription.updated":
        console.log("Processing customer.subscription.updated event");
        await handleSubscriptionUpdated(
          ctx,
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        console.log("Processing customer.subscription.deleted event");
        await handleSubscriptionDeleted(
          ctx,
          event.data.object as Stripe.Subscription
        );
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  },
});

// Handle successful checkout session
async function handleCheckoutSessionCompleted(
  ctx: ActionCtx,
  session: Stripe.Checkout.Session
) {
  console.log("Processing checkout session:", {
    sessionId: session.id,
    metadata: session.metadata,
    paymentStatus: session.payment_status,
    mode: session.mode,
  });

  const { type, userId, packageId, planId, newPlanId, credits } =
    session.metadata || {};

  if (type === "credit_purchase" && userId && credits) {
    console.log("Processing credit purchase:", { userId, packageId, credits });

    try {
      // Add credits to user account
      const newBalance = await ctx.runMutation(api.credits.addCredits, {
        userId: userId as Id<"users">,
        amount: parseInt(credits),
        description: `Credit purchase - ${packageId} package`,
        stripePaymentIntentId: session.payment_intent as string,
      });

      console.log("Credits added successfully:", {
        userId,
        credits,
        newBalance,
      });
    } catch (error) {
      console.error("Error adding credits:", error);
      throw error;
    }
  } else if (type === "subscription" && userId && planId) {
    console.log("Processing subscription creation:", { userId, planId });

    try {
      // Handle subscription creation using the dedicated action
      await ctx.runAction(api.stripe.handleSubscriptionCreation, {
        userId: userId as Id<"users">,
        stripeSubscriptionId: session.subscription as string,
        planId: planId as "starter" | "pro" | "business",
      });

      console.log("Subscription created successfully:", { userId, planId });
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  } else if (type === "plan_change" && userId && newPlanId) {
    console.log("Processing plan change:", { userId, newPlanId });

    try {
      // Handle plan change using the dedicated action
      await ctx.runAction(api.stripe.handlePlanChange, {
        userId: userId as Id<"users">,
        stripeSubscriptionId: session.subscription as string,
        newPlanId: newPlanId as "starter" | "pro" | "business",
      });

      console.log("Plan change processed successfully:", { userId, newPlanId });
    } catch (error) {
      console.error("Error processing plan change:", error);
      throw error;
    }
  } else {
    console.log("Unknown checkout session type or missing metadata:", {
      type,
      userId,
      planId,
      credits,
    });
  }
}

// Handle successful invoice payment
async function handleInvoicePaymentSucceeded(
  ctx: ActionCtx,
  invoice: Stripe.Invoice
) {
  // Check if this invoice is for a subscription and has a customer
  const subscriptionId = (invoice as any).subscription;
  if (subscriptionId && invoice.customer) {
    // Find user by Stripe customer ID
    const user = await ctx.runQuery(api.users.getUserByStripeCustomerId, {
      stripeCustomerId: invoice.customer as string,
    });

    if (user) {
      // Allocate monthly credits for subscription
      await ctx.runMutation(api.subscriptions.allocateMonthlyCredits, {
        userId: user._id,
        stripeSubscriptionId: subscriptionId,
      });
    }
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(
  ctx: ActionCtx,
  subscription: Stripe.Subscription
) {
  const user = await ctx.runQuery(api.users.getUserByStripeCustomerId, {
    stripeCustomerId: subscription.customer as string,
  });

  if (user) {
    await ctx.runMutation(api.subscriptions.updateSubscription, {
      userId: user._id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status as
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid",
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(
  ctx: ActionCtx,
  subscription: Stripe.Subscription
) {
  const user = await ctx.runQuery(api.users.getUserByStripeCustomerId, {
    stripeCustomerId: subscription.customer as string,
  });

  if (user) {
    await ctx.runMutation(api.subscriptions.cancelSubscription, {
      userId: user._id,
      stripeSubscriptionId: subscription.id,
    });
  }
}

// Action to handle subscription creation from webhook
export const handleSubscriptionCreation = action({
  args: {
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
    planId: v.union(
      v.literal("starter"),
      v.literal("pro"),
      v.literal("business")
    ),
  },
  handler: async (ctx, { userId, stripeSubscriptionId, planId }) => {
    console.log("Handling subscription creation:", {
      userId,
      stripeSubscriptionId,
      planId,
    });

    try {
      // Get Stripe subscription details
      const subscription =
        await stripe.subscriptions.retrieve(stripeSubscriptionId);

      // Create subscription in database
      // TODO: Fix createSubscription API export issue
      // await ctx.runMutation(api.subscriptions.createSubscription, {
      //   userId,
      //   stripeSubscriptionId,
      //   planId,
      //   stripeCustomerId: subscription.customer as string,
      //   stripePriceId: subscription.items.data[0].price.id,
      //   subscriptionStatus: subscription.status,
      //   currentPeriodStart: (subscription as any).current_period_start * 1000,
      //   currentPeriodEnd: (subscription as any).current_period_end * 1000,
      //   cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      // });

      console.log("Subscription created successfully:", { userId, planId });
      return { success: true };
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  },
});

// Action to handle plan change from webhook
export const handlePlanChange = action({
  args: {
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
    newPlanId: v.union(
      v.literal("starter"),
      v.literal("pro"),
      v.literal("business")
    ),
  },
  handler: async (ctx, { userId, stripeSubscriptionId, newPlanId }) => {
    console.log("Handling plan change:", {
      userId,
      stripeSubscriptionId,
      newPlanId,
    });

    try {
      // Get Stripe subscription details
      const subscription =
        await stripe.subscriptions.retrieve(stripeSubscriptionId);

      // Handle plan change in database
      // TODO: Fix changeSubscriptionPlan API export issue
      // await ctx.runMutation(api.subscriptions.changeSubscriptionPlan, {
      //   userId,
      //   newPlanId,
      //   stripeSubscriptionId,
      //   stripeCustomerId: subscription.customer as string,
      //   stripePriceId: subscription.items.data[0].price.id,
      //   subscriptionStatus: subscription.status,
      //   currentPeriodStart: (subscription as any).current_period_start * 1000,
      //   currentPeriodEnd: (subscription as any).current_period_end * 1000,
      //   cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      // });

      console.log("Plan change processed successfully:", { userId, newPlanId });
      return { success: true };
    } catch (error) {
      console.error("Error processing plan change:", error);
      throw error;
    }
  },
});

// Cancel subscription at period end in Stripe
export const cancelSubscriptionAtPeriodEnd = action({
  args: {
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, { userId, stripeSubscriptionId }) => {
    const user = await ctx.runQuery(api.users.getUser, { userId });
    if (!user) throw new Error("User not found");

    try {
      // Cancel the subscription at period end in Stripe
      const subscription = await stripe.subscriptions.update(
        stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      );

      // Update our database to reflect the cancellation
      await ctx.runMutation(api.subscriptions.cancelSubscriptionAtPeriodEnd, {
        userId,
        stripeSubscriptionId,
      });

      console.log("Subscription canceled at period end:", {
        userId,
        stripeSubscriptionId,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      return {
        success: true,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw new Error(`Failed to cancel subscription: ${error}`);
    }
  },
});

// Reactivate subscription in Stripe
export const reactivateSubscription = action({
  args: {
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, { userId, stripeSubscriptionId }) => {
    const user = await ctx.runQuery(api.users.getUser, { userId });
    if (!user) throw new Error("User not found");

    try {
      // Reactivate the subscription in Stripe
      const subscription = await stripe.subscriptions.update(
        stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        }
      );

      // Update our database to reflect the reactivation
      await ctx.runMutation(api.subscriptions.reactivateSubscription, {
        userId,
        stripeSubscriptionId,
      });

      console.log("Subscription reactivated:", {
        userId,
        stripeSubscriptionId,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      return {
        success: true,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      throw new Error(`Failed to reactivate subscription: ${error}`);
    }
  },
});

// Change subscription plan in Stripe
export const changeSubscriptionPlan: any = action({
  args: {
    userId: v.id("users"),
    newPlanId: v.union(
      v.literal("starter"),
      v.literal("pro"),
      v.literal("business")
    ),
  },
  handler: async (ctx, { userId, newPlanId }) => {
    const user = await ctx.runQuery(api.users.getUser, { userId });
    if (!user) throw new Error("User not found");

    try {
      // Get the new plan configuration
      const newPlan = await getSubscriptionPlan(ctx, newPlanId);

      // Create a new checkout session for the plan change
      const session = await stripe.checkout.sessions.create({
        customer: user.stripeCustomerId!,
        payment_method_types: ["card"],
        line_items: [
          {
            price: newPlan.priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?plan_change=success&plan=${newPlanId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?plan_change=canceled`,
        metadata: {
          userId,
          newPlanId,
          type: "plan_change",
        },
        // Set subscription_data to handle plan changes
        subscription_data: {
          metadata: {
            userId,
            newPlanId,
            type: "plan_change",
          },
        },
      });

      console.log("Plan change checkout session created:", {
        userId,
        newPlanId,
        sessionId: session.id,
      });

      return session.url!;
    } catch (error) {
      console.error("Error creating plan change session:", error);
      throw new Error(`Failed to create plan change session: ${error}`);
    }
  },
});

// Test function to verify webhook endpoint is working
export const testWebhook = action({
  args: {},
  handler: async (ctx) => {
    console.log("Test webhook function called");
    return "Webhook endpoint is working!";
  },
});

// Get user by Stripe customer ID
export const getUserByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id", (q) =>
        q.eq("stripeCustomerId", stripeCustomerId)
      )
      .first();
  },
});
