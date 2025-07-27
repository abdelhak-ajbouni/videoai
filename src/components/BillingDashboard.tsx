"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  CreditCard,
  Calendar,
  TrendingUp,
  Download,
  Settings,
  Zap,
  Star,
  Crown,
  AlertTriangle,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { CreditPurchase } from "./CreditPurchase";
import { SubscriptionPlans } from "./SubscriptionPlans";
import { InvoiceManagement } from "./InvoiceManagement";
import { BillingAnalytics } from "./BillingAnalytics";
import { useState } from "react";

export function BillingDashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("purchase");

  // Fetch user data and billing information using getCurrentUser
  const userData = useQuery(api.users.getCurrentUser);
  const creditStats = useQuery(
    api.credits.getCreditStats,
    userData?._id ? { userId: userData._id } : "skip"
  );
  const subscriptionStats = useQuery(
    api.subscriptions.getSubscriptionStats,
    userData?._id ? { userId: userData._id } : "skip"
  );
  const creditHistory = useQuery(
    api.credits.getCreditHistory,
    userData?._id ? { userId: userData._id } : "skip"
  );
  const subscriptionHistory = useQuery(
    api.subscriptions.getSubscriptionHistory,
    userData?._id ? { userId: userData._id } : "skip"
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100); // Convert cents to dollars
  };

  const getSubscriptionIcon = (tier: string) => {
    switch (tier) {
      case "starter":
        return <Zap className="h-4 w-4" />;
      case "pro":
        return <Star className="h-4 w-4" />;
      case "business":
        return <Crown className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "canceled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "past_due":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Calculate usage insights
  const getUsageInsights = () => {
    if (!creditStats) return null;

    const totalUsed = creditStats.totalUsed || 0;
    const currentBalance = userData?.credits || 0;
    const monthlyUsage = creditStats.monthlyUsage || 0;

    return {
      totalUsed,
      currentBalance,
      monthlyUsage,
      averagePerMonth: monthlyUsage > 0 ? Math.round(monthlyUsage / 1) : 0,
      estimatedMonthsLeft: currentBalance > 0 && monthlyUsage > 0 ? Math.round(currentBalance / monthlyUsage) : 0,
      isLowBalance: currentBalance < 50,
      isVeryLowBalance: currentBalance < 10,
    };
  };

  const usageInsights = getUsageInsights();

  // Show loading state while user data is being fetched
  if (!userData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing & Credits</h1>
            <p className="text-muted-foreground">
              Loading your billing information...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Credits</h1>
          <p className="text-muted-foreground">
            Manage your credits, subscriptions, and billing information
          </p>
        </div>
      </div>

      {/* Billing Alerts */}
      {usageInsights?.isVeryLowBalance && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Low Credit Balance</p>
                <p className="text-sm text-red-600">
                  You have {userData.credits} credits remaining. Consider purchasing more credits to continue generating videos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {usageInsights?.isLowBalance && !usageInsights?.isVeryLowBalance && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Credit Balance Notice</p>
                <p className="text-sm text-yellow-600">
                  You have {userData.credits} credits remaining. Based on your usage, you have approximately {usageInsights.estimatedMonthsLeft} months of credits left.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData?.credits?.toLocaleString() || 0} credits
            </div>
            <p className="text-xs text-muted-foreground">
              ${((userData?.credits || 0) * 0.02).toFixed(2)} value
            </p>
            {usageInsights?.estimatedMonthsLeft && usageInsights.estimatedMonthsLeft > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                ~{usageInsights.estimatedMonthsLeft} months remaining
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditStats?.totalUsed?.toLocaleString() || 0} credits
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime usage
            </p>
            {usageInsights?.averagePerMonth && (
              <p className="text-xs text-muted-foreground mt-1">
                ~{usageInsights.averagePerMonth} credits/month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditStats?.monthlyUsage?.toLocaleString() || 0} credits
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
            {creditStats?.monthlyUsage && creditStats.monthlyUsage > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                ${((creditStats.monthlyUsage * 0.02)).toFixed(2)} value
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {subscriptionStats?.hasActiveSubscription ? (
                <>
                  {getSubscriptionIcon(subscriptionStats.tier || "free")}
                  <span className="text-lg font-semibold capitalize">
                    {subscriptionStats.tier}
                  </span>
                </>
              ) : (
                <span className="text-lg font-semibold">Free</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {subscriptionStats?.hasActiveSubscription
                ? `${subscriptionStats.creditsRemaining} credits remaining`
                : "No active subscription"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Status */}
      {subscriptionStats?.hasActiveSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>
              Your current subscription details and usage
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
                  {subscriptionStats.cancelAtPeriodEnd && (
                    <Badge variant="destructive">Canceling</Badge>
                  )}
                  <Badge variant="outline">
                    {formatCurrency(subscriptionStats.monthlyPrice || 0)}/month
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="purchase">Purchase Credits</TabsTrigger>
          <TabsTrigger value="subscription">Subscriptions</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
          <TabsTrigger value="invoices">Invoices & Billing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase" className="space-y-4">
          <CreditPurchase />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <SubscriptionPlans />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Your credit purchase and usage history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {creditHistory && creditHistory.length > 0 ? (
                <div className="space-y-3">
                  {creditHistory.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col">
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={transaction.amount > 0 ? "default" : "secondary"}>
                          {transaction.amount > 0 ? "+" : ""}{transaction.amount} credits
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          Balance: {transaction.balanceAfter}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Your credit purchases and usage will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <InvoiceManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <BillingAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
} 