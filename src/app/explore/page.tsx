"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loading } from "@/components/ui/loading";
import { AppLayout } from "@/components/layouts/app-layout";
import { VideoGallery } from "@/components/VideoGallery";

export default function ExplorePage() {
  const { isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Fetch community videos (from other users)
  const communityVideos = useQuery(
    api.videos.getLatestVideosFromOthers,
    currentUser ? { limit: 24 } : "skip"
  );

  // Show loading while authentication or user data is loading
  if (!isLoaded || currentUser === undefined) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading community videos..." />
        </div>
      </AppLayout>
    );
  }

  // Show account setup while user profile is being created
  if (currentUser === null) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Setting up your account..." />
        </div>
      </AppLayout>
    );
  }


  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <div className="px-6 py-8">
          <h1 className="text-2xl font-semibold text-white/95 mb-1">
            Explore
          </h1>
          <p className="text-gray-400 text-sm">
            Discover videos from the community
          </p>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-8">
          <VideoGallery
            videos={communityVideos || []}
            isLoading={communityVideos === undefined}
            emptyTitle="No videos yet"
            emptyDescription="Be the first to create and share a video with the community"
            showGenerateButton={false}
            showFilters={false}
            showSorting={false}
            showDownloadButton={false}
            showDeleteButton={false}
            variant="explore"
          />
        </div>
      </div>
    </AppLayout>
  );
}