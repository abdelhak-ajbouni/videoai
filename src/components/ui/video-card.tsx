"use client";

import { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  Trash2,
  Clock,
  XCircle,
  Loader2,
  Play,
  Calendar,
  Timer,
  Heart,
  Eye,
  Video
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VideoCardProps {
  video: Doc<"videos">;
  variant?: "my-videos" | "explore" | "gallery";
  showDownloadButton?: boolean;
  showDeleteButton?: boolean;
  showFavoriteButton?: boolean;
  onPlay?: (video: Doc<"videos">) => void;
  onDownload?: (video: Doc<"videos">) => void;
  onDelete?: (video: Doc<"videos">) => void;
  onToggleFavorite?: (video: Doc<"videos">) => void;
}

export function VideoCard({
  video,
  variant = "explore",
  showDownloadButton = false,
  showDeleteButton = false,
  showFavoriteButton = false,
  onPlay,
  onDownload,
  onDelete,
  onToggleFavorite
}: VideoCardProps) {

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return null;
      case 'processing':
        return (
          <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
            <Loader2 className="h-3 w-3 mr-1 animate-spin inline" />
            Processing
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1 inline" />
            Queued
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded border border-red-500/30">
            <XCircle className="h-3 w-3 mr-1 inline" />
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

  if (variant === "my-videos") {
    return (
      <Card className="bg-gray-900 border-gray-800/50 overflow-hidden hover:bg-gray-800/30 transition-all duration-200">
        <CardContent className="p-4 space-y-4">
          {/* Video Preview Area */}
          <div className="aspect-video bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden">
            {video.status === "completed" && video.videoUrl ? (
              <video
                className="w-full h-full object-cover rounded-lg cursor-pointer"
                controls
                preload="metadata"
                onClick={() => onPlay?.(video)}
                onLoadedMetadata={(e) => {
                  const videoEl = e.target as HTMLVideoElement;
                  videoEl.currentTime = 0.5;
                }}
              >
                <source src={video.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="text-center text-gray-500">
                {getStatusBadge(video.status) || (
                  <>
                    <Play className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Preview unavailable</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Video Details */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-gray-300 text-sm line-clamp-2 flex-1">
                {video.prompt}
              </p>
              {getStatusBadge(video.status)}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                <span className="flex items-center">
                  <Timer className="h-3 w-3 mr-1" />
                  {video.duration}s
                </span>
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                </span>
              </div>
              <span className="text-blue-400 font-medium">
                {video.creditsCost} credits
              </span>
            </div>

            {/* Video Analytics */}
            {video.status === "completed" && (
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-4">
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

            {/* Error Message */}
            {video.status === "failed" && video.errorMessage && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded">
                {video.errorMessage}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2 pt-2">
              {showFavoriteButton && (
                <Button
                  size="sm"
                  variant="outline"
                  className={`min-h-[44px] border-gray-700 hover:border-gray-600 ${
                    video.isFavorite ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(video);
                  }}
                >
                  <Heart className={`h-4 w-4 ${video.isFavorite ? 'fill-current' : ''}`} />
                </Button>
              )}
              
              {showDownloadButton && video.status === "completed" && video.videoUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 min-h-[44px] border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload?.(video);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              )}
              
              {showDeleteButton && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50 min-h-[44px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(video);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gallery/masonry variant (for explore page)
  return (
    <div
      className="group cursor-pointer break-inside-avoid mb-4 hover:scale-[1.02] transition-transform duration-200"
      onClick={() => onPlay?.(video)}
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

        {/* Status Badge - only show for non-completed videos in gallery variant */}
        {variant === "gallery" && video.status !== "completed" && (
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
          <span className="text-gray-500">
            {video.quality} • {video.duration}s
          </span>
          {video.viewCount && (
            <span className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {video.viewCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}