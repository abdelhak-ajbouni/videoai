"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Calendar,
  Timer
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function VideoLibrary() {
  const videos = useQuery(api.videos.getUserVideos);

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
    quality: string;
  }) => {
    if (video.status === "processing" && video.processingStartedAt) {
      const processingTime = Date.now() - video.processingStartedAt;
      const estimatedTotal = video.quality === "high" ? 300000 : 180000; // 5min or 3min
      const remaining = Math.max(0, estimatedTotal - processingTime);
      const remainingMinutes = Math.ceil(remaining / 60000);
      return `~${remainingMinutes} min remaining`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Videos</h2>
          <p className="text-gray-600 mt-1">
            {videos.length} {videos.length === 1 ? 'video' : 'videos'} in your library
          </p>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video._id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">
                  {video.title}
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
                    poster={video.thumbnailUrl}
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
                    <span className="capitalize">
                      {video.quality}
                    </span>
                  </div>
                  <span className="text-blue-600 font-medium">
                    {video.creditsCost} credits
                  </span>
                </div>

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
                {video.status === "completed" && video.videoUrl && (
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 