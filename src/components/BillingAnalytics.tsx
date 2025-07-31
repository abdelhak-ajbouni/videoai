"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  Target,
  Zap,
  Star,
  Crown
} from "lucide-react";

export function BillingAnalytics() {

  // Get current user data and analytics
  const userData = useQuery(api.users.getCurrentUser);
  const creditStats = useQuery(
    api.userProfiles.getCreditStats,
    userData?.clerkId ? { clerkId: userData.clerkId } : "skip"
  );
  // TODO: Fix getSubscriptionStats API export issue
  // const subscriptionStats = useQuery(
  //   api.subscriptions.getSubscriptionStats,
  //   userData?._id ? { userId: userData._id } : "skip"
  // );
  const creditHistory = useQuery(
    api.userProfiles.getCreditHistory,
    userData?.clerkId ? { clerkId: userData.clerkId } : "skip"
  );



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100); // Convert cents to dollars
  };

  // Calculate analytics insights
  const getAnalyticsInsights = () => {
    if (!creditStats || !creditHistory) return null;

    const totalPurchased = creditStats.totalPurchased || 0;
    const totalUsed = creditStats.totalUsed || 0;
    const currentBalance = userData?.credits || 0;
    const monthlyUsage = creditStats.monthlyUsage || 0;
    const averagePerMonth = creditStats.averagePerMonth || 0;

    // Calculate usage efficiency
    const usageEfficiency = totalPurchased > 0 ? (totalUsed / totalPurchased) * 100 : 0;

    // Calculate cost per video (assuming average 100 credits per video)
    const estimatedVideos = totalUsed / 100;
    const costPerVideo = estimatedVideos > 0 ? (totalPurchased * 0.02) / estimatedVideos : 0;

    // Calculate monthly spending
    const monthlySpending = monthlyUsage * 0.02;

    // Calculate projected annual spending
    const projectedAnnualSpending = monthlySpending * 12;

    // Calculate savings with subscription
    // TODO: Fix subscriptionStats API issue
    const subscriptionSavings = 0; // subscriptionStats?.hasActiveSubscription ?
    // (monthlySpending - (subscriptionStats.monthlyPrice / 100)) * 12 : 0;

    return {
      totalPurchased,
      totalUsed,
      currentBalance,
      monthlyUsage,
      averagePerMonth,
      usageEfficiency,
      costPerVideo,
      monthlySpending,
      projectedAnnualSpending,
      subscriptionSavings,
      estimatedVideos,
    };
  };

  const insights = getAnalyticsInsights();

  // Show loading state while data is being fetched
  if (!userData || !insights) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Billing Analytics</h2>
          <p className="text-muted-foreground mt-2">
            Loading analytics data...
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
        <h2 className="text-3xl font-bold tracking-tight">Billing Analytics</h2>
        <p className="text-muted-foreground mt-2">
          Understand your spending patterns and optimize your usage
        </p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(insights.monthlySpending * 100)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
            <div className="flex items-center space-x-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">
                {insights.averagePerMonth > 0 ? Math.round((insights.monthlyUsage / insights.averagePerMonth) * 100) : 0}% vs avg
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage Efficiency</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(insights.usageEfficiency)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Credits utilized
            </p>
            <Progress value={insights.usageEfficiency} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Video</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(insights.costPerVideo * 100)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average cost
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ~{Math.round(insights.estimatedVideos)} videos created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Projection</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(insights.projectedAnnualSpending * 100)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on current usage
            </p>
            {insights.subscriptionSavings > 0 && (
              <div className="flex items-center space-x-1 mt-1">
                <TrendingDown className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">
                  Save {formatCurrency(insights.subscriptionSavings * 100)}/year
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Credit Usage Breakdown</CardTitle>
            <CardDescription>
              How you've used your credits over time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Total Purchased</span>
                </div>
                <span className="text-sm font-medium">{insights.totalPurchased.toLocaleString()} credits</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Total Used</span>
                </div>
                <span className="text-sm font-medium">{insights.totalUsed.toLocaleString()} credits</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Current Balance</span>
                </div>
                <span className="text-sm font-medium">{insights.currentBalance.toLocaleString()} credits</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">This Month</span>
                </div>
                <span className="text-sm font-medium">{insights.monthlyUsage.toLocaleString()} credits</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Usage Efficiency</span>
                <span className="text-sm text-muted-foreground">{Math.round(insights.usageEfficiency)}%</span>
              </div>
              <Progress value={insights.usageEfficiency} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending Analysis</CardTitle>
            <CardDescription>
              Your spending patterns and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Monthly Average</div>
                  <div className="text-sm text-muted-foreground">
                    {insights.averagePerMonth.toLocaleString()} credits/month
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(insights.averagePerMonth * 0.02 * 100)}</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">Current Month</div>
                  <div className="text-sm text-muted-foreground">
                    {insights.monthlyUsage.toLocaleString()} credits used
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(insights.monthlySpending * 100)}</div>
                  <div className="text-sm text-muted-foreground">this month</div>
                </div>
              </div>

              {insights.subscriptionSavings > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <div className="font-medium text-green-800">Subscription Savings</div>
                    <div className="text-sm text-green-600">
                      You're saving with your subscription
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-800">
                      {formatCurrency(insights.subscriptionSavings * 100)}
                    </div>
                    <div className="text-sm text-green-600">per year</div>
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {insights.usageEfficiency < 80 && (
                  <li>• Consider using more credits to improve efficiency</li>
                )}
                {insights.monthlySpending > 50 && (
                  <li>• A subscription plan could save you money</li>
                )}
                {insights.currentBalance < 50 && (
                  <li>• Consider purchasing more credits soon</li>
                )}
                {insights.averagePerMonth > 500 && (
                  <li>• High usage detected - subscription recommended</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Comparison */}
      {true && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Savings Calculator</CardTitle>
            <CardDescription>
              See how much you could save with a subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="flex justify-center mb-2">
                  <Zap className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="font-medium">Starter Plan</h3>
                <p className="text-sm text-muted-foreground mb-2">$9.99/month</p>
                <div className="text-lg font-bold text-green-600">
                  Save {insights.monthlySpending > 9.99 ? formatCurrency((insights.monthlySpending - 9.99) * 100) : "$0"}/month
                </div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="flex justify-center mb-2">
                  <Star className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="font-medium">Pro Plan</h3>
                <p className="text-sm text-muted-foreground mb-2">$29.99/month</p>
                <div className="text-lg font-bold text-green-600">
                  Save {insights.monthlySpending > 29.99 ? formatCurrency((insights.monthlySpending - 29.99) * 100) : "$0"}/month
                </div>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="flex justify-center mb-2">
                  <Crown className="h-8 w-8 text-yellow-500" />
                </div>
                <h3 className="font-medium">Max Plan</h3>
                <p className="text-sm text-muted-foreground mb-2">$99.99/month</p>
                <div className="text-lg font-bold text-green-600">
                  Save {insights.monthlySpending > 99.99 ? formatCurrency((insights.monthlySpending - 99.99) * 100) : "$0"}/month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Trends</CardTitle>
          <CardDescription>
            Your credit usage patterns over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Average Monthly Usage</div>
                <div className="text-sm text-muted-foreground">
                  Based on your account history
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{insights.averagePerMonth.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">credits/month</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Current Month Usage</div>
                <div className="text-sm text-muted-foreground">
                  Credits used this month
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{insights.monthlyUsage.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">credits</div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Monthly Usage vs Average</span>
                <span className="text-sm text-muted-foreground">
                  {insights.averagePerMonth > 0 ? Math.round((insights.monthlyUsage / insights.averagePerMonth) * 100) : 0}%
                </span>
              </div>
              <Progress
                value={insights.averagePerMonth > 0 ? Math.min((insights.monthlyUsage / insights.averagePerMonth) * 100, 100) : 0}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 