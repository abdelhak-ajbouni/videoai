"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Loading } from "@/components/ui/loading";
import { AppLayout } from "@/components/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Compass, Play, Clock, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { VideoModal } from "@/components/VideoModal";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ExplorePage() {
  const { isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const [selectedVideo, setSelectedVideo] = useState<Doc<"videos"> | null>(null);
  const router = useRouter();

  // Fetch community videos (from other users)
  const communityVideos = useQuery(
    api.videos.getLatestVideosFromOthers,
    currentUser ? { limit: 24 } : "skip"
  );

  // Redirect to landing page if user is not authenticated
  useEffect(() => {
    if (isLoaded && currentUser === null) {
      router.push("/");
    }
  }, [isLoaded, currentUser, router]);

  // Show loading state while authentication and user data are being loaded
  if (!isLoaded || currentUser === undefined) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading community videos..." />
        </div>
      </AppLayout>
    );
  }

  // This should not happen due to the useEffect redirect, but keep as fallback
  if (!currentUser) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Redirecting..." />
        </div>
      </AppLayout>
    );
  }

  const handleVideoClick = (video: Doc<"videos">) => {
    if (video.videoUrl) {
      setSelectedVideo(video);
    }
  };

  const closeModal = () => {
    setSelectedVideo(null);
  };

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
          {communityVideos === undefined ? (
            <div className="flex items-center justify-center py-16">
              <Loading text="Loading..." />
            </div>
          ) : communityVideos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Video className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                No videos yet
              </h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Be the first to create and share a video with the community
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {communityVideos.map((video) => (
                <div
                  key={video._id}
                  className="group cursor-pointer"
                  onClick={() => handleVideoClick(video)}
                >
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-gray-900 overflow-hidden rounded-lg mb-3">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title || "Video thumbnail"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : video.videoUrl ? (
                      <video
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        muted
                        preload="metadata"
                      >
                        <source src={video.videoUrl} type="video/mp4" />
                      </video>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-8 w-8 text-gray-600" />
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Play className="h-5 w-5 text-gray-900 ml-0.5" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2">
                      <span className="px-2 py-1 text-xs font-medium bg-black/70 text-white rounded">
                        {video.duration}s
                      </span>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-white text-sm line-clamp-2 group-hover:text-gray-300 transition-colors">
                      {video.title || "Untitled"}
                    </h3>
                    <p className="text-gray-500 text-xs line-clamp-2">
                      {video.prompt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="capitalize">{video.quality}</span>
                      {video.viewCount && (
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {video.viewCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video Modal */}
        <VideoModal
          video={selectedVideo}
          onClose={closeModal}
          variant="detailed"
        />
      </div>
    </AppLayout>
  );
}