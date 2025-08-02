"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Calendar,
  Timer,
  Search,
  Filter,
  Heart,
  Eye
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export function VideoLibrary() {
  const videos = useQuery(api.videos.getUserVideos);
  const deleteVideo = useMutation(api.videos.deleteVideo);
  const trackInteraction = useMutation(api.videos.trackVideoInteraction);
  const toggleFavorite = useMutation(api.videos.toggleVideoFavorite);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Filter and sort videos
  const filteredAndSortedVideos = useMemo(() => {
    if (!videos) return [];

    const filtered = videos.filter((video) => {
      const matchesSearch =
        video.prompt.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || video.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort videos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt - a.createdAt;
        case "oldest":
          return a.createdAt - b.createdAt;
        case "most-credits":
          return b.creditsCost - a.creditsCost;
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return filtered;
  }, [videos, searchQuery, statusFilter, sortBy]);

  const handleDownload = async (video: { _id: Id<"videos">; videoUrl?: string; title?: string }) => {
    if (!video.videoUrl) {
      toast.error("Video not ready for download");
      return;
    }

    try {
      // Track download interaction
      await trackInteraction({
        videoId: video._id,
        action: "download"
      });

      // Create a temporary link to download the video
      const link = document.createElement('a');
      link.href = video.videoUrl;
      link.download = `video-${video._id}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started");
    } catch {

      toast.error("Failed to download video");
    }
  };

  const handleToggleFavorite = async (videoId: Id<"videos">, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFavorite({ videoId });
      toast.success("Video favorite status updated");
    } catch {

      toast.error("Failed to update favorite status");
    }
  };

  const handleVideoView = async (videoId: Id<"videos">) => {
    try {
      await trackInteraction({
        videoId,
        action: "view"
      });
    } catch {

      // Don't show error to user for analytics
    }
  };

  const handleDelete = async (videoId: Id<"videos">, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteVideo({ videoId });
      toast.success("Video deleted successfully");
    } catch {

      toast.error("Failed to delete video");
    }
  };

  if (videos === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your videos...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No videos yet
        </h3>
        <p className="text-gray-600 mb-6">
          Generate your first video to see it here!
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  const getEstimatedTime = (video: {
    status: string;
    processingStartedAt?: number;
  }) => {
    if (video.status === "processing" && video.processingStartedAt) {
      const processingTime = Date.now() - video.processingStartedAt;
      const estimatedTotal = 180000; // 3min default
      const remaining = Math.max(0, estimatedTotal - processingTime);
      const remainingMinutes = Math.ceil(remaining / 60000);
      return `~${remainingMinutes} min remaining`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Videos</h2>
          <p className="text-gray-600 mt-1">
            {filteredAndSortedVideos.length} of {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-xl">
              <SelectItem value="all" className="py-2 text-gray-900 dark:text-white">All Status</SelectItem>
              <SelectItem value="completed" className="py-2 text-gray-900 dark:text-white">Completed</SelectItem>
              <SelectItem value="processing" className="py-2 text-gray-900 dark:text-white">Processing</SelectItem>
              <SelectItem value="pending" className="py-2 text-gray-900 dark:text-white">Pending</SelectItem>
              <SelectItem value="failed" className="py-2 text-gray-900 dark:text-white">Failed</SelectItem>
            </SelectContent>
          </Select>



          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-32 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-xl">
              <SelectItem value="newest" className="py-2 text-gray-900 dark:text-white">Newest</SelectItem>
              <SelectItem value="oldest" className="py-2 text-gray-900 dark:text-white">Oldest</SelectItem>
              <SelectItem value="most-credits" className="py-2 text-gray-900 dark:text-white">Most Credits</SelectItem>
              <SelectItem value="title" className="py-2 text-gray-900 dark:text-white">Title A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Video Grid */}
      {filteredAndSortedVideos.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No videos match your filters
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search or filter criteria
          </p>
          <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setStatusFilter("all");
          }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedVideos.map((video) => (
            <Card key={video._id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-3">
                    {video.prompt}
                  </CardTitle>
                  {getStatusBadge(video.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Video Preview Area */}
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  {video.status === "completed" && video.videoUrl ? (
                    <video
                      className="w-full h-full object-cover rounded-lg"
                      controls
                      preload="metadata"
                      onPlay={() => handleVideoView(video._id)}
                      onLoadedMetadata={(e) => {
                        const videoEl = e.target as HTMLVideoElement;
                        videoEl.currentTime = 0.5; // Seek to 0.5 seconds for better thumbnail
                      }}
                    >
                      <source src={video.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="text-center text-gray-500">
                      <Play className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">
                        {video.status === "processing" ? "Generating..." : "Preview unavailable"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Video Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="line-clamp-2">{video.prompt}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Timer className="h-4 w-4 mr-1" />
                        {video.duration}s
                      </span>
                    </div>
                    <span className="text-blue-600 font-medium">
                      {video.creditsCost} credits
                    </span>
                  </div>

                  {/* Video Analytics */}
                  {video.status === "completed" && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {video.viewCount || 0} views
                        </span>
                        <span className="flex items-center">
                          <Download className="h-3 w-3 mr-1" />
                          {video.downloadCount || 0} downloads
                        </span>
                        {video.fileSize && (
                          <span>
                            {Math.round((video.fileSize || 0) / 1024 / 1024 * 10) / 10} MB
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                  </div>

                  {/* Processing Status */}
                  {video.status === "processing" && (
                    <div className="text-xs text-blue-600 font-medium">
                      {getEstimatedTime(video)}
                    </div>
                  )}

                  {/* Error Message */}
                  {video.status === "failed" && video.errorMessage && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {video.errorMessage}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`${video.isFavorite ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-600'}`}
                    onClick={(e) => handleToggleFavorite(video._id, e)}
                  >
                    <Heart className={`h-4 w-4 ${video.isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                  {video.status === "completed" && video.videoUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDownload(video)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(video._id, video.prompt)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 