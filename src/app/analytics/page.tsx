"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { VideoAnalytics } from "@/components/VideoAnalytics";
import { Loading } from "@/components/ui/loading";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Sparkles } from "lucide-react";

export default function AnalyticsPage() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Show loading state while authentication and user data are being loaded
  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading analytics..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="lg:p-0 p-4">
        {/* Header */}
        <div className="bg-surface shadow-sm border-b border-border backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gradient-ai">
                  Analytics
                </h1>
                <p className="text-text-secondary mt-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-ai-electric-400" />
                  Track your video performance and usage insights
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <VideoAnalytics />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 