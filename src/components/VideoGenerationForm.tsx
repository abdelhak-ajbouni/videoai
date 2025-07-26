"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Clock,
  Settings,
  Coins,
  AlertCircle,
  Loader2,
  Video,
  Info
} from "lucide-react";
import { toast } from "sonner";

export function VideoGenerationForm() {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [quality, setQuality] = useState<"standard" | "high">("standard");
  const [duration, setDuration] = useState<"5" | "10">("5");
  const [isGenerating, setIsGenerating] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser);
  const createVideo = useMutation(api.videos.createVideo);

  // Calculate credit cost based on quality and duration
  const calculateCreditCost = (quality: "standard" | "high", duration: "5" | "10"): number => {
    const baseCost = duration === "5" ? 5 : 10;
    const qualityMultiplier = quality === "high" ? 2 : 1;
    return baseCost * qualityMultiplier;
  };

  const creditsCost = calculateCreditCost(quality, duration);
  const hasEnoughCredits = currentUser ? currentUser.credits >= creditsCost : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast.error("Please enter a video description");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title for your video");
      return;
    }

    if (!hasEnoughCredits) {
      toast.error("Insufficient credits to generate this video");
      return;
    }

    setIsGenerating(true);

    try {
      await createVideo({
        title: title.trim(),
        prompt: prompt.trim(),
        quality,
        duration,
      });

      toast.success("Video generation started! Check your library to see progress.");

      // Reset form
      setPrompt("");
      setTitle("");
      setQuality("standard");
      setDuration("5");

    } catch (error) {
      console.error("Error creating video:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start video generation");
    } finally {
      setIsGenerating(false);
    }
  };

  const promptTips = [
    "Be specific about what you want to see in your video",
    "Describe the scene, actions, and visual style clearly",
    "Include camera movements like &apos;close-up&apos;, &apos;wide shot&apos;, or &apos;zoom in&apos;",
    "Mention lighting and mood: &apos;bright daylight&apos;, &apos;cinematic lighting&apos;, &apos;warm tones&apos;",
                    "For dialogue, use format: &apos;A person says: Hello, world!&apos;",
    "Add &apos;(no subtitles)&apos; to avoid unwanted text overlays"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Generate Your Video
        </h2>
        <p className="text-gray-600">
          Describe your vision and watch AI bring it to life
        </p>
      </div>

      {/* Credit Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Available Credits:</span>
              <Badge variant="secondary" className="text-lg">
                {currentUser?.credits || 0}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Cost for this video:</span>
              <Badge variant={hasEnoughCredits ? "default" : "destructive"}>
                {creditsCost} credits
              </Badge>
            </div>
          </div>
          {!hasEnoughCredits && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need {creditsCost - (currentUser?.credits || 0)} more credits to generate this video.
                <Button variant="link" className="p-0 ml-2 h-auto">
                  Buy Credits
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Video Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Video Title</Label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a descriptive title for your video"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                  />
                  <p className="text-sm text-gray-500">{title.length}/100 characters</p>
                </div>

                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">Video Description</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your video in detail. The more specific you are, the better the result will be..."
                    className="min-h-32 resize-none"
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500">{prompt.length}/500 characters</p>
                </div>

                <Separator />

                {/* Settings */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">Generation Settings</span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Quality */}
                    <div className="space-y-2">
                      <Label>Quality</Label>
                      <Select value={quality} onValueChange={(value: "standard" | "high") => setQuality(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">
                            <div className="flex items-center justify-between w-full">
                              <span>Standard (720p)</span>
                              <Badge variant="secondary" className="ml-2">1x cost</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center justify-between w-full">
                              <span>High (1080p)</span>
                              <Badge variant="secondary" className="ml-2">2x cost</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select value={duration} onValueChange={(value: "5" | "10") => setDuration(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">
                            <div className="flex items-center justify-between w-full">
                              <span>5 seconds</span>
                              <Badge variant="secondary" className="ml-2">Base cost</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="10">
                            <div className="flex items-center justify-between w-full">
                              <span>10 seconds</span>
                              <Badge variant="secondary" className="ml-2">2x cost</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!prompt.trim() || !title.trim() || !hasEnoughCredits || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Video ({creditsCost} credits)
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tips Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Prompt Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {promptTips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-600">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Generation Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Standard quality:</strong> 2-5 minutes</p>
                <p><strong>High quality:</strong> 3-7 minutes</p>
                <p className="text-xs text-gray-500 mt-3">
                  You&apos;ll receive real-time updates on the generation progress.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 