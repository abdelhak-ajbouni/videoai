"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Loader2, CreditCard, Check, Zap, Star, Crown, Settings, AlertTriangle, Info, XCircle, CheckCircle } from "lucide-react";

// Icon mapping for subscription plans
const PLAN_ICONS = {
  starter: Zap,
  pro: Star,
  business: Crown,
} as const;

export function SubscriptionPlans() {

  const [isLoading, setIsLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  // Get current user data and subscription plans
  const userData = useQuery(api.users.getCurrentUser);
  const subscriptionPlans = useQuery(api.subscriptionPlans.getActivePlans);
  const subscriptionStats = useQuery(
    api.subscriptions.getSubscriptionStats,
    userData?._id ? { userId: userData._id } : "skip"
  );
  const createSubscriptionSession = useAction(api.stripe.createSubscriptionCheckoutSession);
  const createPortalSession = useAction(api.stripe.createCustomerPortalSession);
  const cancelSubscription = useAction(api.stripe.cancelSubscriptionAtPeriodEnd);
  const reactivateSubscription = useAction(api.stripe.reactivateSubscription);
  const changeSubscriptionPlan = useAction(api.stripe.changeSubscriptionPlan);

  const handleSubscribe = async (planId: string) => {
    if (!userData) return;

    setIsLoading(true);
    try {
      // If user already has a subscription, handle as plan change
      if (subscriptionStats?.hasActiveSubscription) {
        const checkoutUrl = await changeSubscriptionPlan({
          userId: userData._id,
          newPlanId: planId as "starter" | "pro" | "business",
        });

        // Redirect to Stripe checkout for plan change
        window.location.href = checkoutUrl;
      } else {
        // New subscription
        const checkoutUrl = await createSubscriptionSession({
          userId: userData._id,
          planId: planId as "starter" | "pro" | "business",
        });

        // Redirect to Stripe checkout
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error("Error creating subscription session:", error);
      alert("Failed to create subscription session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!userData) return;

    setIsLoading(true);
    try {
      const portalUrl = await createPortalSession({
        userId: userData._id,
      });

      // Redirect to Stripe customer portal
      window.location.href = portalUrl;
    } catch (error) {
      console.error("Error creating portal session:", error);
      alert("Failed to access billing portal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!userData || !userData.stripeSubscriptionId) return;

    if (!confirm("Are you sure you want to cancel your subscription? You'll keep all your existing credits, but won't receive new monthly credits after your current billing period ends.")) {
      return;
    }

    setIsCanceling(true);
    try {
      await cancelSubscription({
        userId: userData._id,
        stripeSubscriptionId: userData.stripeSubscriptionId,
      });

      alert("Your subscription has been canceled. You'll keep all your existing credits until the end of your current billing period.");
      window.location.reload(); // Refresh to show updated status
    } catch (error) {
      console.error("Error canceling subscription:", error);
      alert("Failed to cancel subscription. Please try again or contact support.");
    } finally {
      setIsCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!userData || !userData.stripeSubscriptionId) return;

    setIsReactivating(true);
    try {
      await reactivateSubscription({
        userId: userData._id,
        stripeSubscriptionId: userData.stripeSubscriptionId,
      });

      alert("Your subscription has been reactivated!");
      window.location.reload(); // Refresh to show updated status
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      alert("Failed to reactivate subscription. Please try again or contact support.");
    } finally {
      setIsReactivating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Show loading state while user data is being fetched
  if (!userData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
          <p className="text-muted-foreground mt-2">
            Loading subscription plans...
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Subscription Management</h2>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing preferences
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscriptionStats?.hasActiveSubscription && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Current Subscription</span>
            </CardTitle>
            <CardDescription>
              Your active subscription details and usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Plan</div>
                <div className="text-lg font-semibold capitalize">{subscriptionStats.tier}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Monthly Credits</div>
                <div className="text-lg font-semibold">{subscriptionStats.monthlyCredits}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Used This Period</div>
                <div className="text-lg font-semibold">{subscriptionStats.creditsUsedThisPeriod}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Remaining</div>
                <div className="text-lg font-semibold">{subscriptionStats.creditsRemaining}</div>
              </div>
            </div>

            {subscriptionStats.nextBillingDate && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium">Next Billing Date</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(subscriptionStats.nextBillingDate)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {subscriptionStats.cancelAtPeriodEnd ? (
                    <Badge variant="destructive" className="flex items-center space-x-1">
                      <XCircle className="h-3 w-3" />
                      <span>Canceling</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Active</span>
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Cancellation Notice */}
            {subscriptionStats.cancelAtPeriodEnd && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Subscription Canceling</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your subscription will end on {formatDate(subscriptionStats.nextBillingDate)}.
                      You'll keep all your existing credits, but won't receive new monthly credits after this date.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReactivateSubscription}
                      disabled={isReactivating}
                      className="mt-2"
                    >
                      {isReactivating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Reactivate Subscription
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="flex-1"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>

              {!subscriptionStats.cancelAtPeriodEnd && (
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={isCanceling}
                  className="flex-1"
                >
                  {isCanceling ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="text-center">
        <h3 className="text-2xl font-bold tracking-tight">Available Plans</h3>
        <p className="text-muted-foreground mt-2">
          {subscriptionStats?.hasActiveSubscription
            ? "Upgrade or change your current plan"
            : "Get monthly credits and unlock premium features"
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionPlans?.map((plan) => {
          const Icon = PLAN_ICONS[plan.planId as keyof typeof PLAN_ICONS] || Zap;
          const isCurrentPlan = subscriptionStats?.tier === plan.planId;
          const isUpgrade = subscriptionStats?.hasActiveSubscription && !isCurrentPlan;

          return (
            <Card
              key={plan.planId}
              className={`relative transition-all hover:shadow-lg hover:ring-1 hover:ring-primary/50 ${plan.isPopular ? "border-primary" : ""} ${isCurrentPlan ? "border-green-500 bg-green-50/50" : ""
                }`}
            >
              {plan.isPopular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-500">
                  Most Popular
                </Badge>
              )}

              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4 bg-green-500">
                  Current Plan
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.monthlyCredits.toLocaleString()} credits/month
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">${(plan.price / 100).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.planId)}
                  disabled={isLoading || isCurrentPlan}
                  variant={plan.isPopular ? "default" : "outline"}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  {isCurrentPlan ? "Current Plan" : isUpgrade ? "Change Plan" : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plan Change and Credit Retention Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Plan Changes & Credit Policy</h4>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Plan Changes:</strong> When you change plans, your old subscription is automatically deactivated and replaced with the new one.
              You'll receive the new plan's monthly credits immediately.
            </p>
            <p className="text-sm text-blue-700 mt-2">
              <strong>Credit Retention:</strong> When you cancel your subscription, you keep all credits you've already earned.
              You just won't receive new monthly credits after your current billing period ends.
              This ensures you never lose what you've already paid for.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Secure billing powered by Stripe</p>
      </div>
    </div>
  );
} 