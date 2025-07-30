"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Loading } from "@/components/ui/loading";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Compass, Play, Clock, Eye } from "lucide-react";
import { useState } from "react";
import { VideoModal } from "@/components/VideoModal";
import Image from "next/image";

export default function ExplorePage() {
  const { isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const [selectedVideo, setSelectedVideo] = useState<Doc<"videos"> | null>(null);

  // Fetch community videos (from other users)
  const communityVideos = useQuery(
    api.videos.getLatestVideosFromOthers,
    currentUser ? { limit: 24 } : "skip"
  );

  // Show loading state while authentication and user data are being loaded
  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading text="Loading community videos..." />
        </div>
      </DashboardLayout>
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
    <DashboardLayout>
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <div className="border-b border-gray-800">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                <Compass className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Explore Community
                </h1>
                <p className="text-gray-400 mt-1">
                  Discover amazing videos created by our community
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          {communityVideos === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Loading text="Loading community videos..." />
            </div>
          ) : communityVideos.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-16">
                <div className="p-4 rounded-full bg-gray-700 w-fit mx-auto mb-4">
                  <Video className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No community videos yet
                </h3>
                <p className="text-gray-400 mb-4 max-w-md mx-auto">
                  Be the first to create and share a video with the community!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {communityVideos.map((video) => (
                <Card
                  key={video._id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gray-800 border-gray-700 overflow-hidden cursor-pointer"
                  onClick={() => handleVideoClick(video)}
                >
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-gray-700 overflow-hidden">
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
                        <Video className="h-12 w-12 text-gray-500" />
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                      <div className="p-3 rounded-full bg-white bg-opacity-90 group-hover:bg-opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100">
                        <Play className="h-5 w-5 text-gray-800 ml-0.5" />
                      </div>
                    </div>

                    {/* Quality Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 text-xs font-medium bg-black bg-opacity-70 text-white rounded-full capitalize">
                        {video.quality}
                      </span>
                    </div>
                  </div>

                  {/* Video Info */}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {video.title || "Untitled"}
                    </h3>

                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {video.prompt}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {video.duration}s
                        </span>
                        {video.viewCount && (
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {video.viewCount}
                          </span>
                        )}
                      </div>
                      <span className="text-blue-400 font-medium">
                        {video.creditsCost} credits
                      </span>
                    </div>
                  </CardContent>
                </Card>
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
    </DashboardLayout>
  );
}