"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { Video, Clock, Play, Eye } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { VideoModal } from "@/components/VideoModal";

interface RecentVideosProps {
  limit?: number;
}

export function RecentVideos({ limit = 12 }: RecentVideosProps) {
  const [selectedVideo, setSelectedVideo] = useState<Doc<"videos"> | null>(null);
  const videos = useQuery(api.videos.getLatestVideosFromOthers, { limit });

  if (videos === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loading text="Loading recent videos..." />
      </div>
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
    <div className="px-4 py-8">
      <Card className="glass-card border-border-light">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-text-primary">
            <div className="p-1.5 rounded-lg bg-ai-neural-100 dark:bg-ai-neural-900/30">
              <Clock className="h-4 w-4 text-ai-neural-600 dark:text-ai-neural-400" />
            </div>
            <span>Recent Videos from Community</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-3 rounded-full bg-ai-primary-50 dark:bg-ai-primary-900/20 w-fit mx-auto mb-3">
                <Video className="h-6 w-6 text-ai-primary-400" />
              </div>
              <p className="text-sm text-text-secondary">
                No videos from the community yet
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Be the first to generate a video!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map((video) => (
                <div
                  key={video._id}
                  className="group cursor-pointer"
                  onClick={() => handleVideoClick(video)}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-border hover:border-ai-primary-300 transition-all duration-200 bg-surface-elevated">
                    {video.thumbnailUrl ? (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title || "Video thumbnail"}
                        fill
                        className="object-cover"
                      />
                    ) : video.videoUrl ? (
                      <video
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      >
                        <source src={video.videoUrl} type="video/mp4" />
                      </video>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-ai-primary-50 to-ai-primary-100 dark:from-ai-primary-900/20 dark:to-ai-primary-800/20 flex items-center justify-center">
                        <Video className="h-8 w-8 text-ai-primary-400" />
                      </div>
                    )}

                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="bg-white/90 dark:bg-black/90 rounded-full p-2">
                        <Play className="h-4 w-4 text-gray-900 dark:text-white" />
                      </div>
                    </div>

                    {/* Video info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <h4 className="text-white text-sm font-medium line-clamp-1">
                        {video.title || "Untitled"}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/80 text-xs">
                          {video.duration}s
                        </span>
                        <span className="text-white/60 text-xs">•</span>
                        <span className="text-white/80 text-xs capitalize">

                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Video details below thumbnail */}
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {video.prompt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-text-tertiary">
                      <span>{video.creditsCost} credits</span>
                      {video.viewCount && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{video.viewCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Modal */}
      <VideoModal
        video={selectedVideo}
        onClose={closeModal}
        variant="detailed"
      />
    </div>
  );
} 