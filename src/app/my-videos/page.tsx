"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Loading } from "@/components/ui/loading";
import { AppLayout } from "@/components/layouts/app-layout";
import { VideoGallery } from "@/components/VideoGallery";
import { useEffect } from "react";
import { toast } from "sonner";

export default function MyVideosPage() {
  const { isLoaded, isSignedIn } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const ensureUserExists = useMutation(api.users.ensureUserExists);

  // Fetch user's videos - only when user is loaded and authenticated
  const userVideos = useQuery(
    api.videos.getUserVideos,
    isLoaded && currentUser ? {} : "skip"
  );

  const deleteVideo = useMutation(api.videos.deleteVideo);

  // Ensure user profile exists on first load
  useEffect(() => {
    if (isLoaded && isSignedIn && currentUser === null) {
      ensureUserExists();
    }
  }, [isLoaded, isSignedIn, currentUser, ensureUserExists]);

  // Show loading while authentication or user data is loading
  if (!isLoaded || currentUser === undefined) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading your videos..." />
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

  const handleDownload = (video: Doc<"videos">) => {
    if (video.videoUrl) {
      const link = document.createElement('a');
      link.href = video.videoUrl;
      link.download = `video-${video._id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Video download started");
    }
  };

  const handleDelete = async (video: Doc<"videos">) => {
    try {
      await deleteVideo({ videoId: video._id });
      toast.success("Video deleted successfully");
    } catch {
      toast.error("Failed to delete video");
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <div className="px-6 py-8">
          <h1 className="text-2xl font-semibold text-white/95 mb-1">
            My Videos
          </h1>
          <p className="text-gray-400 text-sm">
            Manage your video collection
          </p>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-8">
          <VideoGallery
            videos={userVideos || []}
            isLoading={userVideos === undefined}
            emptyTitle="No videos yet"
            emptyDescription="Create your first AI-generated video to get started"
            showGenerateButton={true}
            showFilters={true}
            showSorting={true}
            showDownloadButton={true}
            showDeleteButton={true}
            onDownload={handleDownload}
            onDelete={handleDelete}
            variant="my-videos"
          />
        </div>
      </div>
    </AppLayout>
  );
}