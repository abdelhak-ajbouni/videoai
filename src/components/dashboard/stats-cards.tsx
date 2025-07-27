"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Video, TrendingUp, DollarSign, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
    period: string;
  };
  icon: React.ReactNode;
  color: "primary" | "electric" | "neural" | "success";
  visualization?: React.ReactNode;
  className?: string;
}

interface StatsCardsProps {
  creditBalance: number;
  videosGenerated: number;
  successRate: number;
  totalSavings: number;
  className?: string;
}

// Credit Meter Visualization
const CreditMeter = ({ value, max = 1000 }: { value: number; max?: number }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const isLow = percentage < 20;
  const isMedium = percentage < 50;

  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-text-secondary mb-2">
        <span>Credits</span>
        <span>{value}/{max}</span>
      </div>
      <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-slow",
            isLow ? "bg-gradient-to-r from-red-400 to-red-500" :
              isMedium ? "bg-gradient-to-r from-yellow-400 to-orange-500" :
                "bg-gradient-to-r from-ai-primary-400 to-ai-primary-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isLow && (
        <p className="text-xs text-red-500 mt-1 font-medium">Low balance - consider purchasing more credits</p>
      )}
    </div>
  );
};

// Generation Chart Visualization (Mini Bar Chart)
const GenerationChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data, 1);

  return (
    <div className="mt-4">
      <div className="flex items-end space-x-1 h-12">
        {data.map((value, index) => (
          <div
            key={index}
            className="flex-1 bg-gradient-to-t from-ai-electric-400 to-ai-electric-500 rounded-t-sm min-h-[4px] transition-all duration-normal hover:from-ai-electric-500 hover:to-ai-electric-600"
            style={{ height: `${(value / max) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-text-secondary mt-2">
        <span>7 days</span>
        <span>Today</span>
      </div>
    </div>
  );
};

// Success Rate Gauge
const SuccessGauge = ({ percentage }: { percentage: number }) => {
  const circumference = 2 * Math.PI * 20;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (rate: number) => {
    if (rate >= 90) return "text-green-500";
    if (rate >= 70) return "text-ai-neural-500";
    return "text-yellow-500";
  };

  return (
    <div className="mt-4 flex items-center justify-center">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 44 44">
          {/* Background circle */}
          <circle
            cx="22"
            cy="22"
            r="20"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-surface-elevated"
          />
          {/* Progress circle */}
          <circle
            cx="22"
            cy="22"
            r="20"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn("transition-all duration-slow", getColor(percentage))}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-sm font-bold", getColor(percentage))}>
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  );
};

// Savings Trend Visualization
const SavingsTrend = ({ amount, trend }: { amount: number; trend: number }) => {
  const points = Array.from({ length: 12 }, (_, i) => {
    const base = 50 + Math.sin(i * 0.5) * 20;
    const trendEffect = (trend / 100) * i * 2;
    return Math.max(10, Math.min(90, base + trendEffect));
  });

  const pathData = points.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${(index / (points.length - 1)) * 100} ${100 - point}`
  ).join(' ');

  return (
    <div className="mt-4">
      <svg className="w-full h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="savingsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path
          d={`${pathData} L 100 100 L 0 100 Z`}
          fill="url(#savingsGradient)"
        />
        <path
          d={pathData}
          stroke="rgb(34, 197, 94)"
          strokeWidth="2"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-xs text-text-secondary mt-1">
        <span>12 months</span>
        <span className="text-green-500 font-medium">+${amount.toFixed(2)} saved</span>
      </div>
    </div>
  );
};

// Individual Stat Card Component
const StatCard = ({ title, value, change, icon, color, visualization, className }: StatCardProps) => {
  const colorClasses = {
    primary: "bg-ai-primary-50/50 border-ai-primary-200 dark:bg-ai-primary-900/10 dark:border-ai-primary-800",
    electric: "bg-ai-electric-50/50 border-ai-electric-200 dark:bg-ai-electric-900/10 dark:border-ai-electric-800",
    neural: "bg-ai-neural-50/50 border-ai-neural-200 dark:bg-ai-neural-900/10 dark:border-ai-neural-800",
    success: "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
  };

  const iconColorClasses = {
    primary: "bg-ai-primary-100 dark:bg-ai-primary-900/30 text-ai-primary-600 dark:text-ai-primary-400",
    electric: "bg-ai-electric-100 dark:bg-ai-electric-900/30 text-ai-electric-600 dark:text-ai-electric-400",
    neural: "bg-ai-neural-100 dark:bg-ai-neural-900/30 text-ai-neural-600 dark:text-ai-neural-400",
    success: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
  };

  const valueColorClasses = {
    primary: "text-ai-primary-600 dark:text-ai-primary-400",
    electric: "text-ai-electric-600 dark:text-ai-electric-400",
    neural: "text-ai-neural-600 dark:text-ai-neural-400",
    success: "text-green-600 dark:text-green-400"
  };

  const titleColorClasses = {
    primary: "text-ai-primary-700 dark:text-ai-primary-300",
    electric: "text-ai-electric-700 dark:text-ai-electric-300",
    neural: "text-ai-neural-700 dark:text-ai-neural-300",
    success: "text-green-700 dark:text-green-300"
  };

  return (
    <Card className={cn(
      "glass-card hover:glass-card-elevated transition-all duration-normal group cursor-pointer",
      colorClasses[color],
      className
    )}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-lg transition-transform duration-normal group-hover:scale-110", iconColorClasses[color])}>
            {icon}
          </div>
          {change && (
            <div className={cn(
              "flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full",
              change.type === "increase" ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20" :
                change.type === "decrease" ? "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20" :
                  "text-text-secondary bg-surface-elevated"
            )}>
              {change.type === "increase" && <ArrowUp className="h-3 w-3" />}
              {change.type === "decrease" && <ArrowDown className="h-3 w-3" />}
              {change.type === "neutral" && <Minus className="h-3 w-3" />}
              <span>{Math.abs(change.value)}%</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-1">
          <p className={cn("text-sm font-medium", titleColorClasses[color])}>
            {title}
          </p>
          <p className={cn("text-3xl font-bold transition-all duration-normal group-hover:scale-105", valueColorClasses[color])}>
            {value}
          </p>
          {change && (
            <p className="text-xs text-text-secondary">
              vs {change.period}
            </p>
          )}
        </div>

        {/* Visualization */}
        {visualization && (
          <div className="transition-opacity duration-normal group-hover:opacity-90">
            {visualization}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main Stats Cards Component
export const StatsCards = ({
  creditBalance,
  videosGenerated,
  successRate,
  totalSavings,
  className
}: StatsCardsProps) => {
  // Mock data for visualizations (in real app, this would come from props or API)
  const generationData = [3, 7, 2, 8, 5, 12, 9]; // Last 7 days
  const savingsTrend = 15; // 15% increase in savings

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {/* Credit Balance Card */}
      <StatCard
        title="Available Credits"
        value={creditBalance.toLocaleString()}
        change={{
          value: 12,
          type: creditBalance > 500 ? "increase" : creditBalance < 100 ? "decrease" : "neutral",
          period: "last week"
        }}
        icon={<CreditCard className="h-5 w-5" />}
        color="primary"
        visualization={<CreditMeter value={creditBalance} max={1000} />}
      />

      {/* Videos Generated Card */}
      <StatCard
        title="Videos Generated"
        value={videosGenerated.toLocaleString()}
        change={{
          value: 23,
          type: "increase",
          period: "last week"
        }}
        icon={<Video className="h-5 w-5" />}
        color="electric"
        visualization={<GenerationChart data={generationData} />}
      />

      {/* Success Rate Card */}
      <StatCard
        title="Success Rate"
        value={`${successRate}%`}
        change={{
          value: 5,
          type: successRate >= 90 ? "increase" : "neutral",
          period: "last month"
        }}
        icon={<TrendingUp className="h-5 w-5" />}
        color="neural"
        visualization={<SuccessGauge percentage={successRate} />}
      />

      {/* Total Savings Card */}
      <StatCard
        title="Total Savings"
        value={`$${totalSavings.toFixed(2)}`}
        change={{
          value: savingsTrend,
          type: "increase",
          period: "this year"
        }}
        icon={<DollarSign className="h-5 w-5" />}
        color="success"
        visualization={<SavingsTrend amount={totalSavings} trend={savingsTrend} />}
      />
    </div>
  );
};