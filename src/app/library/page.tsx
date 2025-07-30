"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { VideoLibrary } from "@/components/VideoLibrary";
import { Loading } from "@/components/ui/loading";
import { AppLayout } from "@/components/layouts/app-layout";
import { Video } from "lucide-react";

export default function LibraryPage() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Show loading state while authentication and user data are being loaded
  if (!isLoaded || !currentUser) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading your video library..." />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="lg:p-0 p-4">
        {/* Header */}
        <div className="bg-surface shadow-sm border-b border-border backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gradient-ai">
                  Video Library
                </h1>
                <p className="text-text-secondary mt-1 flex items-center gap-2">
                  <Video className="h-4 w-4 text-ai-electric-400" />
                  Manage and organize your AI-generated videos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <VideoLibrary />
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 