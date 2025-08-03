"use client";

import { Doc } from "../../convex/_generated/dataModel";
import { Video, Calendar, Eye, Filter, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { VideoModal } from "@/components/VideoModal";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoGalleryProps {
  videos: Doc<"videos">[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  showGenerateButton?: boolean;
  showFilters?: boolean;
  showSorting?: boolean;
  showDownloadButton?: boolean;
  showDeleteButton?: boolean;
  onDownload?: (video: Doc<"videos">) => void;
  onDelete?: (video: Doc<"videos">) => void;
  variant?: "my-videos" | "explore";
}

type SortOption = "newest" | "oldest" | "duration" | "cost";
type FilterOption = "all" | "completed" | "processing" | "failed" | "standard" | "high" | "ultra";

export function VideoGallery({
  videos,
  isLoading = false,
  emptyTitle = "No videos yet",
  emptyDescription = "Videos will appear here once available",
  showGenerateButton = false,
  showFilters = false,
  showSorting = false,
  showDownloadButton = false,
  showDeleteButton = false,
  onDownload,
  onDelete,
  variant = "explore"
}: VideoGalleryProps) {
  const router = useRouter();
  const [selectedVideo, setSelectedVideo] = useState<Doc<"videos"> | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  const handleVideoClick = (video: Doc<"videos">) => {
    if (video.videoUrl) {
      setSelectedVideo(video);
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
        return null; // Don't show badge for completed videos
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

  // Filter videos based on selected filter
  const filteredVideos = videos.filter(video => {
    // Always exclude failed videos
    if (video.status === "failed") return false;

    if (filterBy === "all") return true;
    if (filterBy === "completed" || filterBy === "processing") {
      return video.status === filterBy;
    }
    if (filterBy === "standard" || filterBy === "high" || filterBy === "ultra") {
      return video.quality === filterBy;
    }
    return true;
  });

  // Sort videos based on selected sort option
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b._creationTime - a._creationTime;
      case "oldest":
        return a._creationTime - b._creationTime;
      case "duration":
        const durationA = parseInt(a.duration) || 0;
        const durationB = parseInt(b.duration) || 0;
        return durationB - durationA;
      case "cost":
        return b.creditsCost - a.creditsCost;
      default:
        return b._creationTime - a._creationTime;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-white/20 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-white/20 rounded-full animate-pulse delay-75"></div>
          <div className="w-4 h-4 bg-white/20 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <Video className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          {emptyTitle}
        </h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
          {emptyDescription}
        </p>
        {showGenerateButton && (
          <Button
            onClick={() => router.push('/generate')}
            className="bg-white hover:bg-gray-100 text-gray-900"
          >
            Generate Video
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sorting */}
      {(showFilters || showSorting) && (
        <div className="flex items-center gap-4">
          {showFilters && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-700 bg-gray-800 hover:bg-gray-700">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter: {filterBy === "all" ? "All" : filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                <DropdownMenuItem onClick={() => setFilterBy("all")} className="hover:bg-gray-700">
                  All Videos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("completed")} className="hover:bg-gray-700">
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("processing")} className="hover:bg-gray-700">
                  Processing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("standard")} className="hover:bg-gray-700">
                  Standard Quality
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("high")} className="hover:bg-gray-700">
                  High Quality
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy("ultra")} className="hover:bg-gray-700">
                  Ultra Quality
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showSorting && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-700 bg-gray-800 hover:bg-gray-700">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort: {sortBy === "newest" ? "Newest" : sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                <DropdownMenuItem onClick={() => setSortBy("newest")} className="hover:bg-gray-700">
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")} className="hover:bg-gray-700">
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("duration")} className="hover:bg-gray-700">
                  Duration
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("cost")} className="hover:bg-gray-700">
                  Credits Cost
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Results counter */}
          <span className="text-sm text-gray-400">
            {sortedVideos.length} video{sortedVideos.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Video Gallery */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
        {sortedVideos.map((video) => (
          <div
            key={video._id}
            className="group cursor-pointer break-inside-avoid mb-4"
            onClick={() => handleVideoClick(video)}
          >
            {/* Video Preview */}
            <div className="relative bg-gray-900 overflow-hidden rounded-lg">
              {video.status === 'completed' && video.videoUrl ? (
                <video
                  className="w-full h-auto object-contain"
                  muted
                  loop
                  preload="metadata"
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    const videoEl = e.target as HTMLVideoElement;
                    videoEl.currentTime = 0;
                    videoEl.play().catch(() => {
                      // Handle autoplay restrictions
                    });
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    const videoEl = e.target as HTMLVideoElement;
                    videoEl.pause();
                    videoEl.currentTime = 0;
                  }}
                >
                  <source src={video.videoUrl} type="video/mp4" />
                </video>
              ) : (
                <div className="w-full aspect-video flex items-center justify-center">
                  <Video className="h-8 w-8 text-gray-600" />
                </div>
              )}

              {/* Status Badge */}
              {variant === "my-videos" && (
                <div className="absolute top-3 left-3">
                  {getStatusBadge(video.status)}
                </div>
              )}


              {/* Duration Badge */}
              {video.status === 'completed' && (
                <div className="absolute bottom-3 right-3">
                  <span className="px-2 py-1 text-sm font-medium bg-black/80 text-white rounded-md">
                    {video.duration}s
                  </span>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-3 space-y-2">
              <p className="text-gray-400 text-sm line-clamp-3">
                {video.prompt}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-600">
                {variant === "my-videos" ? (
                  <>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(video._creationTime)}
                    </span>
                    <span className="text-gray-500">
                      {video.creditsCost} credits
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500">
                      {video.quality} • {video.duration}s
                    </span>
                    {video.viewCount && (
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {video.viewCount}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      <VideoModal
        video={selectedVideo}
        onClose={closeModal}
        showDownloadButton={showDownloadButton}
        showDeleteButton={showDeleteButton}
        onDownload={onDownload}
        onDelete={onDelete}
        variant="detailed"
      />
    </div>
  );
}