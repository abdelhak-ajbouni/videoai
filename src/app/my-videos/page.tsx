"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Loading } from "@/components/ui/loading";
import { AppLayout } from "@/components/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { 
  Video, 
  Play, 
  Download, 
  Trash2, 
  Calendar,
  MoreHorizontal 
} from "lucide-react";
import { useState, useEffect } from "react";
import { VideoModal } from "@/components/VideoModal";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MyVideosPage() {
  const { isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const [selectedVideo, setSelectedVideo] = useState<Doc<"videos"> | null>(null);
  const router = useRouter();

  // Fetch user's videos - only when user is loaded and authenticated
  const userVideos = useQuery(
    api.videos.getUserVideos,
    isLoaded && currentUser ? {} : "skip"
  );

  const deleteVideo = useMutation(api.videos.deleteVideo);

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
          <Loading text="Loading..." />
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

  const handleDownload = (video: Doc<"videos">) => {
    if (video.videoUrl) {
      const link = document.createElement('a');
      link.href = video.videoUrl;
      link.download = `${video.title || 'video'}.mp4`;
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
    } catch (error) {
      toast.error("Failed to delete video");
      console.error("Error deleting video:", error);
    }
  };

  const closeModal = () => {
    setSelectedVideo(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
            Ready
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
            Processing
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
            Queued
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded border border-red-500/30">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded border border-gray-500/30">
            {status}
          </span>
        );
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
          {userVideos === undefined ? (
            <div className="flex items-center justify-center py-16">
              <Loading text="Loading videos..." />
            </div>
          ) : userVideos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Video className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                No videos yet
              </h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                Create your first AI-generated video to get started
              </p>
              <Button 
                onClick={() => window.location.href = '/generate'}
                className="bg-white hover:bg-gray-100 text-gray-900"
              >
                Generate Video
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {userVideos.map((video) => (
                <div key={video._id} className="group">
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-gray-900 overflow-hidden rounded-lg mb-3">
                    {video.status === 'completed' && video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title || "Video thumbnail"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => handleVideoClick(video)}
                      />
                    ) : video.status === 'completed' && video.videoUrl ? (
                      <video
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        muted
                        preload="metadata"
                        onClick={() => handleVideoClick(video)}
                      >
                        <source src={video.videoUrl} type="video/mp4" />
                      </video>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-8 w-8 text-gray-600" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      {getStatusBadge(video.status)}
                    </div>

                    {/* Actions Menu */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                          {video.status === 'completed' && video.videoUrl && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleVideoClick(video)}
                                className="focus:bg-gray-800 focus:text-white"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Play
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDownload(video)}
                                className="focus:bg-gray-800 focus:text-white"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDelete(video)}
                            className="focus:bg-red-600 focus:text-white text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Play Button Overlay for completed videos */}
                    {video.status === 'completed' && video.videoUrl && (
                      <div 
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center cursor-pointer"
                        onClick={() => handleVideoClick(video)}
                      >
                        <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Play className="h-5 w-5 text-gray-900 ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Duration Badge for completed videos */}
                    {video.status === 'completed' && (
                      <div className="absolute bottom-2 right-2">
                        <span className="px-2 py-1 text-xs font-medium bg-black/70 text-white rounded">
                          {video.duration}s
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-white text-sm line-clamp-2">
                      {video.title || "Untitled"}
                    </h3>
                    <p className="text-gray-500 text-xs line-clamp-2">
                      {video.prompt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="capitalize">{video.quality}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(video._creationTime)}
                        </span>
                      </div>
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
          showDownloadButton={true}
          onDownload={handleDownload}
          variant="detailed"
        />
      </div>
    </AppLayout>
  );
}