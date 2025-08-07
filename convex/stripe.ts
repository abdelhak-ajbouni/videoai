import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import Stripe from "stripe";
import { ActionCtx } from "./_generated/server";
import { getSecureConfig } from "./lib/convexEnv";
import { applyCreditPurchaseRateLimit } from "./lib/rateLimit";

// Extended Invoice interface to include subscription property
interface InvoiceWithSubscription extends Stripe.Invoice {
  subscription?: string;
}

// Initialize Stripe with validated configuration
const config = getSecureConfig();
const stripe = new Stripe(config.stripe.secretKey, {
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

// Get user's Stripe customer ID or create one
export const getOrCreateStripeCustomer = action({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if we already have a customer ID stored in subscriptions
    const subscription = await ctx.runQuery(api.subscriptions.getSubscription, {
      clerkId,
    });
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
    // Apply rate limiting for credit purchases
    await applyCreditPurchaseRateLimit(ctx, clerkId);

    // Validate that user has an active subscription
    const userProfile = await ctx.runQuery(api.userProfiles.getUserProfile, {
      clerkId,
    });
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // Check if user has an active subscription
    const currentUser = await ctx.runQuery(api.users.getCurrentUser);
    if (
      !currentUser ||
      !currentUser.subscriptionTier ||
      currentUser.subscriptionTier === "free"
    ) {
      throw new Error(
        "Credit packages are only available for subscribers. Please subscribe to a plan first."
      );
    }

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
        success_url: `${config.app.url}/generate?success=true&credits=${packageConfig.credits}`,
        cancel_url: `${config.app.url}/generate?canceled=true`,
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
        success_url: `${config.app.url}/generate?subscription=success&plan=${planId}`,
        cancel_url: `${config.app.url}/generate?subscription=canceled`,
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
    const subscription = await ctx.runQuery(api.subscriptions.getSubscription, {
      clerkId,
    });
    if (!subscription?.stripeCustomerId)
      throw new Error("No Stripe customer found");

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${config.app.url}/generate`,
    });

    return session.url;
  },
});

/**
 * Check if a webhook event has already been processed
 */
async function checkWebhookProcessed(ctx: ActionCtx, eventId: string, source: string): Promise<boolean> {
  const existingEvent = await ctx.runQuery(api.webhooks.getProcessedWebhook, {
    eventId,
    source
  });
  return existingEvent !== null;
}

/**
 * Mark a webhook event as processed
 */
async function markWebhookProcessed(
  ctx: ActionCtx, 
  eventId: string, 
  eventType: string, 
  source: string,
  success: boolean,
  errorMessage?: string,
  metadata?: any
): Promise<void> {
  const now = Date.now();
  
  await ctx.runMutation(api.webhooks.markWebhookProcessed, {
    eventId,
    eventType,
    source,
    processed: success,
    processedAt: now,
    errorMessage,
    metadata,
    createdAt: now
  });
}

// Handle Stripe webhook events
export const handleStripeWebhook = action({
  args: { body: v.string(), signature: v.string() },
  handler: async (ctx, { body, signature }) => {
    const endpointSecret = config.stripe.webhookSecret;
    let event: Stripe.Event;

    // Verify webhook signature
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err);
      throw new Error(`Webhook signature verification failed`);
    }

    // Check for duplicate webhook processing
    const isAlreadyProcessed = await checkWebhookProcessed(ctx, event.id, "stripe");
    if (isAlreadyProcessed) {
      console.log(`Stripe webhook ${event.id} already processed, skipping`);
      return { success: true, message: "Already processed" };
    }

    console.log(`Processing Stripe webhook: ${event.type} (${event.id})`);
    
    let success = false;
    let errorMessage: string | undefined;
    
    try {
      // Handle different event types
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(
            ctx,
            event.data.object as Stripe.Checkout.Session
          );
          break;
        case "invoice.payment_succeeded":
          await handleInvoicePaymentSucceeded(
            ctx,
            event.data.object as Stripe.Invoice
          );
          break;
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(
            ctx,
            event.data.object as Stripe.Subscription
          );
          break;
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(
            ctx,
            event.data.object as Stripe.Subscription
          );
          break;
        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }
      
      success = true;
      console.log(`Successfully processed Stripe webhook: ${event.type} (${event.id})`);
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed to process Stripe webhook ${event.id}:`, error);
    }

    // Mark webhook as processed (success or failure)
    await markWebhookProcessed(
      ctx,
      event.id,
      event.type,
      "stripe",
      success,
      errorMessage,
      {
        object_id: event.data.object.id,
        livemode: event.livemode,
        request_id: event.request?.id
      }
    );

    if (!success) {
      throw new Error(`Webhook processing failed: ${errorMessage}`);
    }

    return { success: true, message: "Processed successfully" };
  },
});

// Handle successful checkout session
async function handleCheckoutSessionCompleted(
  ctx: ActionCtx,
  session: Stripe.Checkout.Session
) {
  const { type, clerkId, packageId, planId, newPlanId, credits } =
    session.metadata || {};

  if (type === "credit_purchase" && clerkId && credits) {
    try {
      // Add credits to user account
      await ctx.runMutation(api.userProfiles.addCreditsWithTransaction, {
        clerkId: clerkId,
        amount: parseInt(credits),
        description: `Credit purchase - ${packageId} package`,
        stripePaymentIntentId: session.payment_intent as string,
      });
    } catch (error) {
      throw error;
    }
  } else if (type === "subscription" && clerkId && planId) {
    try {
      // Get Stripe subscription details
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      // Create subscription in database with new API structure
      await ctx.runMutation(api.subscriptions.createSubscription, {
        clerkId,
        stripeSubscriptionId: session.subscription as string,
        planId: planId as "starter" | "pro" | "max",
        stripeCustomerId: subscription.customer as string,
        subscriptionStatus: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        trialStart: subscription.trial_start || undefined,
        trialEnd: subscription.trial_end || undefined,
        collectionMethod: subscription.collection_method,
        billingCycleAnchor: subscription.billing_cycle_anchor || undefined,
        latestInvoice: (subscription.latest_invoice as string) || undefined,
        metadata: subscription.metadata || undefined,
        startDate: subscription.start_date || undefined,
        endedAt: subscription.ended_at || undefined,
        // Pass first subscription item data directly (merged schema)
        stripeSubscriptionItemId: subscription.items.data[0]?.id,
        stripePriceId: subscription.items.data[0]?.price.id,
        quantity: subscription.items.data[0]?.quantity || 1,
        currentPeriodStart: subscription.items.data[0]?.current_period_start,
        currentPeriodEnd: subscription.items.data[0]?.current_period_end,
        priceData: subscription.items.data[0]
          ? {
              unitAmount: subscription.items.data[0].price.unit_amount || 0,
              currency: subscription.items.data[0].price.currency,
              recurring: subscription.items.data[0].price.recurring
                ? {
                    interval:
                      subscription.items.data[0].price.recurring.interval,
                    intervalCount:
                      subscription.items.data[0].price.recurring.interval_count,
                  }
                : undefined,
            }
          : undefined,
      });
    } catch (error) {
      throw error;
    }
  } else if (type === "plan_change" && clerkId && newPlanId) {
    try {
      // Handle plan change inline to avoid circular dependency
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      // Handle plan change in database with new API structure
      await ctx.runMutation(api.subscriptions.changeSubscriptionPlan, {
        clerkId: clerkId,
        newPlanId: newPlanId as "starter" | "pro" | "max",
        stripeSubscriptionId: session.subscription as string,
        stripeCustomerId: subscription.customer as string,
        subscriptionStatus: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        trialStart: subscription.trial_start || undefined,
        trialEnd: subscription.trial_end || undefined,
        collectionMethod: subscription.collection_method,
        billingCycleAnchor: subscription.billing_cycle_anchor || undefined,
        latestInvoice: (subscription.latest_invoice as string) || undefined,
        metadata: subscription.metadata || undefined,
        startDate: subscription.start_date || undefined,
        endedAt: subscription.ended_at || undefined,
        // Pass first subscription item data directly (merged schema)
        stripeSubscriptionItemId: subscription.items.data[0]?.id,
        stripePriceId: subscription.items.data[0]?.price.id,
        quantity: subscription.items.data[0]?.quantity || 1,
        currentPeriodStart:
          subscription.items.data[0]?.current_period_start || Date.now() / 1000,
        currentPeriodEnd:
          subscription.items.data[0]?.current_period_end || Date.now() / 1000,
        priceData: subscription.items.data[0]
          ? {
              unitAmount: subscription.items.data[0].price.unit_amount || 0,
              currency: subscription.items.data[0].price.currency,
              recurring: subscription.items.data[0].price.recurring
                ? {
                    interval: subscription.items.data[0].price.recurring
                      .interval as "day" | "week" | "month" | "year",
                    intervalCount:
                      subscription.items.data[0].price.recurring.interval_count,
                  }
                : undefined,
            }
          : undefined,
      });
    } catch (error) {
      throw error;
    }
  } else {
  }
}

// Handle successful invoice payment
async function handleInvoicePaymentSucceeded(
  ctx: ActionCtx,
  invoice: Stripe.Invoice
) {
  // Check if this invoice is for a subscription and has a customer
  const subscriptionId = (invoice as InvoiceWithSubscription).subscription;
  if (subscriptionId && invoice.customer) {
    // Find subscription by Stripe customer ID
    const subscription = await ctx.runQuery(
      api.subscriptions.getSubscriptionByStripeCustomerId,
      {
        stripeCustomerId: invoice.customer as string,
      }
    );

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
      }
    }
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(
  ctx: ActionCtx,
  subscription: Stripe.Subscription
) {
  const existingSubscription = await ctx.runQuery(
    api.subscriptions.getSubscriptionByStripeCustomerId,
    {
      stripeCustomerId: subscription.customer as string,
    }
  );

  if (existingSubscription) {
    await ctx.runMutation(api.subscriptions.updateSubscription, {
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
  const existingSubscription = await ctx.runQuery(
    api.subscriptions.getSubscriptionByStripeCustomerId,
    {
      stripeCustomerId: subscription.customer as string,
    }
  );

  if (existingSubscription) {
    await ctx.runMutation(api.subscriptions.cancelSubscription, {
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
    try {
      // Get Stripe subscription details
      const subscription =
        await stripe.subscriptions.retrieve(stripeSubscriptionId);

      // Handle plan change in database with new API structure
      await ctx.runMutation(api.subscriptions.changeSubscriptionPlan, {
        clerkId,
        newPlanId,
        stripeSubscriptionId,
        stripeCustomerId: subscription.customer as string,
        subscriptionStatus: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        trialStart: subscription.trial_start || undefined,
        trialEnd: subscription.trial_end || undefined,
        collectionMethod: subscription.collection_method,
        billingCycleAnchor: subscription.billing_cycle_anchor || undefined,
        latestInvoice: (subscription.latest_invoice as string) || undefined,
        metadata: subscription.metadata || undefined,
        startDate: subscription.start_date || undefined,
        endedAt: subscription.ended_at || undefined,
        // Pass first subscription item data directly (merged schema)
        stripeSubscriptionItemId: subscription.items.data[0]?.id,
        stripePriceId: subscription.items.data[0]?.price.id,
        quantity: subscription.items.data[0]?.quantity || 1,
        currentPeriodStart:
          subscription.items.data[0]?.current_period_start || Date.now() / 1000,
        currentPeriodEnd:
          subscription.items.data[0]?.current_period_end || Date.now() / 1000,
        priceData: subscription.items.data[0]
          ? {
              unitAmount: subscription.items.data[0].price.unit_amount || 0,
              currency: subscription.items.data[0].price.currency,
              recurring: subscription.items.data[0].price.recurring
                ? {
                    interval:
                      subscription.items.data[0].price.recurring.interval,
                    intervalCount:
                      subscription.items.data[0].price.recurring.interval_count,
                  }
                : undefined,
            }
          : undefined,
      });

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
    const userProfile = await ctx.runQuery(api.userProfiles.getUserProfile, {
      clerkId,
    });
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
        stripeSubscriptionId,
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
    const userProfile = await ctx.runQuery(api.userProfiles.getUserProfile, {
      clerkId,
    });
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
        stripeSubscriptionId,
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
