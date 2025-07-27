"use client";

import { useState, useEffect } from "react";
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
  Info,
  Crown,
  Zap
} from "lucide-react";
import { toast } from "sonner";

export function VideoGenerationForm() {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [modelId, setModelId] = useState<string>("");
  const [quality, setQuality] = useState<"standard" | "high" | "ultra">("standard");
  const [duration, setDuration] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser);
  const createVideo = useMutation(api.videos.createVideo);
  const activeModels = useQuery(api.models.getActiveModels);
  const defaultModel = useQuery(api.models.getDefaultModel);

  const creditCost = useQuery(api.pricing.getCreditCost, {
    modelId,
    quality,
    duration
  });
  const pricingMatrix = useQuery(api.pricing.getPricingMatrix);

  const creditsCost = creditCost || 0;
  const hasEnoughCredits = currentUser ? currentUser.credits >= creditsCost : false;

  // Set default model when available
  useEffect(() => {
    if (defaultModel && !modelId) {
      setModelId(defaultModel.modelId);
    }
  }, [defaultModel, modelId]);

  // Get current model information
  const currentModel = activeModels?.find(m => m.modelId === modelId);

  // Check if user can access quality tiers based on subscription
  const canAccessQuality = (qualityTier: string) => {
    if (!currentUser) return false;

    switch (qualityTier) {
      case "standard":
        return true; // Available to all
      case "high":
        return ["starter", "pro", "business"].includes(currentUser.subscriptionTier);
      case "ultra":
        return ["business"].includes(currentUser.subscriptionTier);
      default:
        return false;
    }
  };

  // Get valid durations for the selected model
  const getValidDurations = (model: any) => {
    if (!model) return [];

    if (model.fixedDuration) {
      return [{ value: model.fixedDuration, label: `${model.fixedDuration} seconds`, badge: "Fixed duration" }];
    } else {
      return model.supportedDurations.map((d: number) => ({
        value: d,
        label: `${d} seconds`,
        badge: d === Math.min(...model.supportedDurations) ? "Base cost" : `${d}s option`
      }));
    }
  };

  // Update duration when model changes
  useEffect(() => {
    if (currentModel) {
      if (currentModel.fixedDuration) {
        setDuration(currentModel.fixedDuration);
      } else if (!currentModel.supportedDurations.includes(duration)) {
        setDuration(Math.min(...currentModel.supportedDurations));
      }
    }
  }, [currentModel, duration]);

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

    if (!modelId) {
      toast.error("Please select a model");
      return;
    }

    if (!hasEnoughCredits) {
      toast.error("Insufficient credits to generate this video");
      return;
    }

    if (!canAccessQuality(quality)) {
      toast.error("Your subscription plan doesn't support this quality tier");
      return;
    }

    setIsGenerating(true);

    try {
      await createVideo({
        title: title.trim(),
        prompt: prompt.trim(),
        model: modelId,
        quality,
        duration: duration.toString(),
      });

      toast.success("Video generation started! Check your library to see progress.");

      // Reset form
      setPrompt("");
      setTitle("");
      setModelId(defaultModel?.modelId || "");
      setQuality("standard");
      setDuration(5);

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
    "Include camera movements like 'close-up', 'wide shot', or 'zoom in'",
    "Mention lighting and mood: 'bright daylight', 'cinematic lighting', 'warm tones'",
    "For dialogue, use format: 'A person says: Hello, world!'",
    "Add '(no subtitles)' to avoid unwanted text overlays"
  ];

  const getQualityBadge = (qualityTier: string, available: boolean) => {
    if (!available) {
      return <Badge variant="secondary" className="opacity-50">Upgrade Required</Badge>;
    }

    switch (qualityTier) {
      case "standard":
        return <Badge variant="secondary">720p</Badge>;
      case "high":
        return <Badge className="bg-blue-100 text-blue-800">1080p HD</Badge>;
      case "ultra":
        return <Badge className="bg-purple-100 text-purple-800">4K Ultra</Badge>;
      default:
        return <Badge variant="secondary">{qualityTier}</Badge>;
    }
  };

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
                    {/* Model Selection */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label>AI Model</Label>
                      <Select value={modelId} onValueChange={(value: string) => setModelId(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activeModels?.map((model) => (
                            <SelectItem key={model.modelId} value={model.modelId}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center space-x-2">
                                  <Zap className="h-4 w-4 text-blue-500" />
                                  <div>
                                    <div className="font-medium">{model.name}</div>
                                    <div className="text-xs text-gray-500">{model.description}</div>
                                  </div>
                                </div>
                                <Badge className="bg-blue-100 text-blue-800 ml-2">Default</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quality */}
                    <div className="space-y-2">
                      <Label>Quality</Label>
                      <Select value={quality} onValueChange={(value: "standard" | "high" | "ultra") => setQuality(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                <span>Standard (720p)</span>
                                {getQualityBadge("standard", canAccessQuality("standard"))}
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="high" disabled={!canAccessQuality("high")}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                <Zap className="h-4 w-4 text-blue-500" />
                                <span>High (1080p)</span>
                                {getQualityBadge("high", canAccessQuality("high"))}
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="ultra" disabled={!canAccessQuality("ultra")}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                <Crown className="h-4 w-4 text-purple-500" />
                                <span>Ultra (4K)</span>
                                {getQualityBadge("ultra", canAccessQuality("ultra"))}
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {!canAccessQuality(quality) && (
                        <p className="text-xs text-amber-600">
                          Upgrade your subscription to access this quality
                        </p>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select value={duration.toString()} onValueChange={(value: string) => setDuration(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getValidDurations(currentModel).map((item: any) => (
                            <SelectItem key={item.value} value={item.value.toString()}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-gray-500" />
                                  <span>{item.label}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {item.badge}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
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
                  disabled={!prompt.trim() || !title.trim() || !modelId || !hasEnoughCredits || isGenerating || !canAccessQuality(quality)}
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
                <p><strong>Standard (720p):</strong> 2-5 minutes</p>
                <p><strong>High (1080p):</strong> 3-7 minutes</p>
                <p><strong>Ultra (4K):</strong> 5-10 minutes</p>
                <p className="text-xs text-gray-500 mt-3">
                  You&apos;ll receive real-time updates on the generation progress.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Coins className="h-5 w-5" />
                <span>Pricing Guide</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Luma Ray Flash 2-540p (Default)</h4>
                  <div className="space-y-1 text-gray-600">
                    <p>• 5s Standard: {pricingMatrix?.["luma/ray-flash-2-540p"]?.["standard"]?.["5"] || 0} credits</p>
                    <p>• 5s High: {pricingMatrix?.["luma/ray-flash-2-540p"]?.["high"]?.["5"] || 0} credits</p>
                    <p>• 9s Standard: {pricingMatrix?.["luma/ray-flash-2-540p"]?.["standard"]?.["9"] || 0} credits</p>
                    <p>• 9s High: {pricingMatrix?.["luma/ray-flash-2-540p"]?.["high"]?.["9"] || 0} credits</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Luma Ray-2-720p (Budget)</h4>
                  <div className="space-y-1 text-gray-600">
                    <p>• 5s Standard: {pricingMatrix?.["luma/ray-2-720p"]?.["standard"]?.["5"] || 0} credits</p>
                    <p>• 5s High: {pricingMatrix?.["luma/ray-2-720p"]?.["high"]?.["5"] || 0} credits</p>
                    <p>• 9s Standard: {pricingMatrix?.["luma/ray-2-720p"]?.["standard"]?.["9"] || 0} credits</p>
                    <p>• 9s High: {pricingMatrix?.["luma/ray-2-720p"]?.["high"]?.["9"] || 0} credits</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Google Veo-3 (Premium)</h4>
                  <div className="space-y-1 text-gray-600">
                    <p>• 8s Standard: {pricingMatrix?.["google/veo-3"]?.["standard"]?.["8"] || 0} credits</p>
                    <p>• 8s High: {pricingMatrix?.["google/veo-3"]?.["high"]?.["8"] || 0} credits</p>
                    <p>• 8s Ultra: {pricingMatrix?.["google/veo-3"]?.["ultra"]?.["8"] || 0} credits</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-xs text-blue-800">
                    <strong>💡 Tip:</strong> Luma Ray Flash 2-540p is the cheapest option at ~6x cheaper than Google Veo-3!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Upgrade Prompt */}
          {currentUser?.subscriptionTier === "free" && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-700">
                  <Crown className="h-5 w-5" />
                  <span>Upgrade for More</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-600 mb-3">
                  Unlock HD quality, longer durations, and more credits with a subscription.
                </p>
                <Button size="sm" className="w-full">
                  View Plans
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 