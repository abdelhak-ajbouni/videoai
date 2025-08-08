"use client";

import { Doc } from "../../convex/_generated/dataModel";
import { Video, Filter, ArrowUpDown, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { VideoModal } from "@/components/VideoModal";
import { VideoCard } from "@/components/ui/video-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  showSearch?: boolean;
  showDownloadButton?: boolean;
  showDeleteButton?: boolean;
  showFavoriteButton?: boolean;
  onDownload?: (video: Doc<"videos">) => void;
  onDelete?: (video: Doc<"videos">) => void;
  onToggleFavorite?: (video: Doc<"videos">) => void;
  variant?: "my-videos" | "explore" | "gallery";
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
  showSearch = false,
  showDownloadButton = false,
  showDeleteButton = false,
  showFavoriteButton = false,
  onDownload,
  onDelete,
  onToggleFavorite,
  variant = "explore"
}: VideoGalleryProps) {
  const router = useRouter();
  const [selectedVideo, setSelectedVideo] = useState<Doc<"videos"> | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleVideoClick = (video: Doc<"videos">) => {
    if (video.videoUrl) {
      setSelectedVideo(video);
    }
  };

  const closeModal = () => {
    setSelectedVideo(null);
  };


  // Filter and sort videos with search functionality
  const filteredAndSortedVideos = useMemo(() => {
    if (!videos) return [];

    // Filter by search query
    const filtered = videos.filter(video => {
      const matchesSearch = searchQuery === "" || 
        video.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by status/quality
      let matchesFilter = true;
      if (filterBy === "all") {
        matchesFilter = true;
      } else if (filterBy === "completed" || filterBy === "processing") {
        matchesFilter = video.status === filterBy;
      } else if (filterBy === "standard" || filterBy === "high" || filterBy === "ultra") {
        matchesFilter = video.quality === filterBy;
      }

      // Always exclude failed videos for explore view
      if (variant === "explore" && video.status === "failed") {
        matchesFilter = false;
      }

      return matchesSearch && matchesFilter;
    });

    // Sort videos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (b._creationTime || b.createdAt) - (a._creationTime || a.createdAt);
        case "oldest":
          return (a._creationTime || a.createdAt) - (b._creationTime || b.createdAt);
        case "duration":
          const durationA = parseInt(a.duration) || 0;
          const durationB = parseInt(b.duration) || 0;
          return durationB - durationA;
        case "cost":
          return b.creditsCost - a.creditsCost;
        default:
          return (b._creationTime || b.createdAt) - (a._creationTime || a.createdAt);
      }
    });

    return filtered;
  }, [videos, searchQuery, filterBy, sortBy, variant]);

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
      {/* Search and Filters */}
      {(showSearch || showFilters || showSorting) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            )}

            <div className="flex gap-3">
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
            </div>
          </div>

          {/* Results counter */}
          <span className="text-sm text-gray-400 whitespace-nowrap">
            {filteredAndSortedVideos.length} video{filteredAndSortedVideos.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Video Gallery */}
      {variant === "my-videos" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedVideos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              variant="my-videos"
              showDownloadButton={showDownloadButton}
              showDeleteButton={showDeleteButton}
              showFavoriteButton={showFavoriteButton}
              onPlay={handleVideoClick}
              onDownload={onDownload}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filteredAndSortedVideos.map((video) => (
            <VideoCard
              key={video._id}
              video={video}
              variant="gallery"
              showDownloadButton={showDownloadButton}
              showDeleteButton={showDeleteButton}
              showFavoriteButton={showFavoriteButton}
              onPlay={handleVideoClick}
              onDownload={onDownload}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}

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