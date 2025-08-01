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
    credits: plan.monthlyCredits,
    price: plan.price,
  };
}

// Get user's Stripe customer ID or create one  
export const getOrCreateStripeCustomer = action({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if we already have a customer ID stored in subscriptions
    const subscription = await ctx.runQuery(api.subscriptions.getSubscription, { clerkId });
    if (subscription?.stripeCustomerId) {
      return subscription.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: identity.email || "",
      name: identity.name || "",
      metadata: {
        clerkId: clerkId,
      },
    });

    return customer.id;
  },
});

// Create checkout session for credit purchase
export const createCreditCheckoutSession = action({
  args: {
    clerkId: v.string(),
    packageId: v.union(
      v.literal("small"),
      v.literal("medium"),
      v.literal("large"),
      v.literal("xlarge")
    ),
  },
  handler: async (ctx: ActionCtx, { clerkId, packageId }): Promise<string> => {
    const packageConfig = await getCreditPackage(ctx, packageId);
    const customerId: string = await ctx.runAction(
      api.stripe.getOrCreateStripeCustomer,
      {
        clerkId,
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
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/generate?success=true&credits=${packageConfig.credits}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/generate?canceled=true`,
        metadata: {
          clerkId,
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
    clerkId: v.string(),
    planId: v.union(v.literal("starter"), v.literal("pro"), v.literal("max")),
  },
  handler: async (ctx: ActionCtx, { clerkId, planId }): Promise<string> => {
    const planConfig = await getSubscriptionPlan(ctx, planId);
    const customerId: string = await ctx.runAction(
      api.stripe.getOrCreateStripeCustomer,
      {
        clerkId,
      }
    );

    // Get or create Stripe price dynamically
    const priceId = await ctx.runAction(
      api.subscriptionPlans.getOrCreateStripePrice,
      { planId }
    );

    const session: Stripe.Checkout.Session =
      await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/generate?subscription=success&plan=${planId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/generate?subscription=canceled`,
        metadata: {
          clerkId,
          planId,
          type: "subscription",
        },
      });

    return session.url!;
  },
});

// Create customer portal session
export const createCustomerPortalSession = action({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const subscription = await ctx.runQuery(api.subscriptions.getSubscription, { clerkId });
    if (!subscription?.stripeCustomerId) throw new Error("No Stripe customer found");

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/generate`,
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

  const { type, clerkId, packageId, planId, newPlanId, credits } =
    session.metadata || {};

  if (type === "credit_purchase" && clerkId && credits) {
    console.log("Processing credit purchase:", { clerkId, packageId, credits });

    try {
      // Add credits to user account
      const newBalance = await ctx.runMutation(api.userProfiles.addCreditsWithTransaction, {
        clerkId: clerkId,
        amount: parseInt(credits),
        description: `Credit purchase - ${packageId} package`,
        stripePaymentIntentId: session.payment_intent as string,
      });

      console.log("Credits added successfully:", {
        clerkId,
        credits,
        newBalance,
      });
    } catch (error) {
      console.error("Error adding credits:", error);
      throw error;
    }
  } else if (type === "subscription" && clerkId && planId) {
    console.log("Processing subscription creation:", { 
      clerkId, 
      planId, 
      sessionId: session.id,
      stripeSubscriptionId: session.subscription 
    });

    try {
      // Get Stripe subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      // Create subscription in database
      const subscriptionId = await ctx.runMutation(api.subscriptions.createSubscription, {
        clerkId,
        stripeSubscriptionId: session.subscription as string,
        planId: planId as "starter" | "pro" | "max",
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        subscriptionStatus: subscription.status,
        currentPeriodStart: (subscription as any).current_period_start * 1000,
        currentPeriodEnd: (subscription as any).current_period_end * 1000,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      });

      console.log("Subscription created successfully:", { 
        clerkId, 
        planId, 
        subscriptionId,
        sessionId: session.id 
      });
    } catch (error) {
      console.error("Error creating subscription:", {
        error: error instanceof Error ? error.message : String(error),
        clerkId,
        planId,
        sessionId: session.id,
        stripeSubscriptionId: session.subscription
      });
      throw error;
    }
  } else if (type === "plan_change" && clerkId && newPlanId) {
    console.log("Processing plan change:", { clerkId, newPlanId });

    try {
      // Handle plan change inline to avoid circular dependency
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      // Handle plan change in database
      await ctx.runMutation(api.subscriptions.changeSubscriptionPlan, {
        clerkId: clerkId,
        newPlanId: newPlanId as "starter" | "pro" | "max",
        stripeSubscriptionId: session.subscription as string,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        subscriptionStatus: subscription.status,
        currentPeriodStart: (subscription as any).current_period_start * 1000,
        currentPeriodEnd: (subscription as any).current_period_end * 1000,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      });

      console.log("Plan change processed successfully:", { clerkId, newPlanId });
    } catch (error) {
      console.error("Error processing plan change:", error);
      throw error;
    }
  } else {
    console.log("Unknown checkout session type or missing metadata:", {
      type,
      clerkId,
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
    // Find subscription by Stripe customer ID
    const subscription = await ctx.runQuery(api.subscriptions.getSubscriptionByStripeCustomerId, {
      stripeCustomerId: invoice.customer as string,
    });

    if (subscription) {
      // Only allocate credits for recurring invoices, not the initial subscription
      // The initial credits are handled by createSubscription during checkout.session.completed
      const subscriptionAge = Date.now() - subscription.createdAt;
      const isInitialInvoice = subscriptionAge < 60000; // Less than 1 minute old
      
      if (!isInitialInvoice) {
        // Allocate monthly credits for subscription renewal
        await ctx.runMutation(api.subscriptions.allocateMonthlyCredits, {
          clerkId: subscription.clerkId,
          stripeSubscriptionId: subscriptionId,
        });
      } else {
        console.log("Skipping credit allocation for initial subscription invoice");
      }
    }
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(
  ctx: ActionCtx,
  subscription: Stripe.Subscription
) {
  const existingSubscription = await ctx.runQuery(api.subscriptions.getSubscriptionByStripeCustomerId, {
    stripeCustomerId: subscription.customer as string,
  });

  if (existingSubscription) {
    await ctx.runMutation(api.subscriptions.updateSubscription, {
      clerkId: existingSubscription.clerkId,
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
  const existingSubscription = await ctx.runQuery(api.subscriptions.getSubscriptionByStripeCustomerId, {
    stripeCustomerId: subscription.customer as string,
  });

  if (existingSubscription) {
    await ctx.runMutation(api.subscriptions.cancelSubscription, {
      clerkId: existingSubscription.clerkId,
      stripeSubscriptionId: subscription.id,
    });
  }
}


// Action to handle plan change from webhook
export const handlePlanChange = action({
  args: {
    clerkId: v.string(),
    stripeSubscriptionId: v.string(),
    newPlanId: v.union(
      v.literal("starter"),
      v.literal("pro"),
      v.literal("max")
    ),
  },
  handler: async (ctx, { clerkId, stripeSubscriptionId, newPlanId }) => {
    console.log("Handling plan change:", {
      clerkId,
      stripeSubscriptionId,
      newPlanId,
    });

    try {
      // Get Stripe subscription details
      const subscription =
        await stripe.subscriptions.retrieve(stripeSubscriptionId);

      // Handle plan change in database
      await ctx.runMutation(api.subscriptions.changeSubscriptionPlan, {
        clerkId,
        newPlanId,
        stripeSubscriptionId,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        subscriptionStatus: subscription.status,
        currentPeriodStart: (subscription as any).current_period_start * 1000,
        currentPeriodEnd: (subscription as any).current_period_end * 1000,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      });

      console.log("Plan change processed successfully:", { clerkId, newPlanId });
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
    clerkId: v.string(),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, { clerkId, stripeSubscriptionId }) => {
    const userProfile = await ctx.runQuery(api.userProfiles.getUserProfile, { clerkId });
    if (!userProfile) throw new Error("User profile not found");

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
        clerkId,
        stripeSubscriptionId,
      });

      console.log("Subscription canceled at period end:", {
        clerkId,
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
    clerkId: v.string(),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, { clerkId, stripeSubscriptionId }) => {
    const userProfile = await ctx.runQuery(api.userProfiles.getUserProfile, { clerkId });
    if (!userProfile) throw new Error("User profile not found");

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
        clerkId,
        stripeSubscriptionId,
      });

      console.log("Subscription reactivated:", {
        clerkId,
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


