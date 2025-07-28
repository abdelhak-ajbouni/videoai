"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loading } from "@/components/ui/loading";
import { WelcomeHero } from "@/components/dashboard/welcome-hero";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { RecentVideos } from "@/components/RecentVideos";

export default function Dashboard() {
  const { isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Show loading state while authentication and user data are being loaded
  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading your dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="lg:p-0 p-4">
        <div className="px-4 py-8">
          <WelcomeHero />
        </div>

        <RecentVideos limit={12} />
      </div>
    </DashboardLayout>
  );
} 