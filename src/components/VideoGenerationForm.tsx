"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  Clock,
  AlertCircle,
  Loader2,
  Video,
  Crown,
  Zap,
  Wand2,
  Target,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { Doc } from "../../convex/_generated/dataModel";

export function VideoGenerationForm() {
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState<string>("");
  const [duration, setDuration] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Model-specific options
  const [resolution, setResolution] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<string>("");
  const [loop, setLoop] = useState<boolean>(false);
  const [cameraConcept, setCameraConcept] = useState<string>("none");

  const currentUser = useQuery(api.users.getCurrentUser);
  const createVideo = useMutation(api.videos.createVideo);
  const activeModels = useQuery(api.models.getActiveModels);

  const creditCost = useQuery(api.pricing.getCreditCost, {
    modelId: modelId || "",
    quality: "standard",
    duration
  });

  const creditsCost = creditCost || 0;
  const hasEnoughCredits = currentUser ? currentUser.credits >= creditsCost : false;

  // Check if data is still loading
  const isLoading = !activeModels;

  // Set default model when available, or use first available model as fallback
  useEffect(() => {
    if (!modelId && activeModels && activeModels.length > 0) {
      // Try to find the default model first
      const defaultModelFromList = activeModels.find(model => model.isDefault);
      if (defaultModelFromList) {
        setModelId(defaultModelFromList.modelId);
      } else {
        // Fallback to first available model
        setModelId(activeModels[0].modelId);
      }
    }
  }, [activeModels, modelId]);

  // Get current model information
  const currentModel = activeModels?.find(m => m.modelId === modelId);

  // Get valid durations for the selected model
  const getValidDurations = (model: Doc<"models"> | undefined) => {
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

  // Reset model-specific options when model changes
  useEffect(() => {
    if (currentModel) {
      // Set default resolution
      if (currentModel.supportedResolutions && currentModel.defaultResolution) {
        setResolution(currentModel.defaultResolution);
      } else {
        setResolution("");
      }

      // Set default aspect ratio
      if (currentModel.supportedAspectRatios && currentModel.defaultAspectRatio) {
        setAspectRatio(currentModel.defaultAspectRatio);
      } else {
        setAspectRatio("");
      }

      // Reset other options
      setLoop(false);
      setCameraConcept("none");
    }
  }, [currentModel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast.error("Please enter a video description");
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

    setIsGenerating(true);

    try {
      await createVideo({
        prompt: prompt.trim(),
        model: modelId,
        quality: "standard",
        duration: duration.toString(),
        resolution: resolution || undefined,
        aspectRatio: aspectRatio || undefined,
        loop: loop || undefined,
        cameraConcept: cameraConcept === "none" ? undefined : cameraConcept || undefined,
      });

      // Reset form
      setPrompt("");
      // Reset to first available model or empty string
      setModelId(activeModels && activeModels.length > 0 ? activeModels[0].modelId : "");
      setDuration(5);
      // Reset model-specific options
      setResolution("");
      setAspectRatio("");
      setLoop(false);
      setCameraConcept("none");

    } catch (error) {
      console.error("Error creating video:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start video generation");
    } finally {
      setIsGenerating(false);
    }
  };

  const getModelIcon = (model: Doc<"models">) => {
    if (model.isPremium) return <Crown className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />;
    if (model.isFast) return <Zap className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />;
    if (model.isDefault) return <Star className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />;
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-medium text-white/95">
            Create New Video
          </CardTitle>
          <p className="text-sm text-gray-400">
            Generate AI-powered videos from your description
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Prompt */}
            <div className="space-y-3">
              <Label htmlFor="prompt" className="text-sm font-medium text-white/90">
                Video Description
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your video in detail... Be specific about scenes, actions, and visual style for best results."
                className="min-h-32 resize-none bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
                maxLength={500}
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">{prompt.length}/500 characters</span>
                {prompt.length > 450 && (
                  <span className="text-yellow-400">Almost at limit</span>
                )}
              </div>
            </div>

            {/* AI Model Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-white/90">AI Model</Label>
              <Select value={modelId} onValueChange={(value: string) => setModelId(value)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800/70 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 h-12">
                  <SelectValue placeholder="Select an AI model" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 shadow-2xl">
                  {activeModels?.map((model) => (
                    <SelectItem key={model.modelId} value={model.modelId} className="focus:bg-gray-800 focus:text-white">
                      <div className="flex items-start space-x-3 py-1 text-left">
                        {getModelIcon(model)}
                        <div className="text-left">
                          <div className="font-medium text-white text-sm text-left">{model.name}</div>
                          <div className="text-xs text-gray-400 line-clamp-1 text-left">{model.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoading && (
                <p className="text-sm text-gray-500">Loading available models...</p>
              )}
            </div>


            {/* Duration */}
            <div className="space-y-3 w-1/2">
              <Label className="text-sm font-medium text-white/90">Duration</Label>
              <Select value={duration.toString()} onValueChange={(value: string) => setDuration(parseInt(value))}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800/70 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 shadow-2xl">
                  {getValidDurations(currentModel).map((item) => (
                    <SelectItem key={item.value} value={item.value.toString()} className="focus:bg-gray-800 focus:text-white">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{item.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model-Specific Options */}
            {currentModel && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resolution (for Google Veo-3) */}
                {currentModel.supportedResolutions && currentModel.supportedResolutions.length > 1 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-white/90">Resolution</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800/70 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 h-12">
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700 shadow-2xl">
                        {currentModel.supportedResolutions.map((res) => (
                          <SelectItem key={res} value={res} className="focus:bg-gray-800 focus:text-white">
                            <div className="flex items-center space-x-2">
                              <Video className="h-4 w-4 text-gray-400" />
                              <span>{res}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Aspect Ratio (for Luma Ray models) */}
                {currentModel.supportedAspectRatios && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-white/90">Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800/70 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 h-12">
                        <SelectValue placeholder="select aspect ratio" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700 shadow-2xl">
                        {currentModel.supportedAspectRatios.map((ratio) => (
                          <SelectItem key={ratio} value={ratio} className="focus:bg-gray-800 focus:text-white">
                            <div className="flex items-center space-x-2">
                              <Target className="h-4 w-4 text-gray-400" />
                              <span>{ratio}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Camera Concept (for Luma Ray models) */}
                {currentModel.supportsCameraConcepts && currentModel.cameraConcepts && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-white/90">Camera Movement</Label>
                    <Select value={cameraConcept} onValueChange={setCameraConcept}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800/70 focus:border-gray-600 focus:ring-1 focus:ring-gray-600 h-12">
                        <SelectValue placeholder="Optional camera movement" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700 shadow-2xl">
                        <SelectItem value="none" className="focus:bg-gray-800 focus:text-white">
                          <div className="flex items-center space-x-2">
                            <Wand2 className="h-4 w-4 text-gray-400" />
                            <span>None (Auto)</span>
                          </div>
                        </SelectItem>
                        {currentModel.cameraConcepts.map((concept) => (
                          <SelectItem key={concept} value={concept} className="focus:bg-gray-800 focus:text-white">
                            <div className="flex items-center space-x-2">
                              <Video className="h-4 w-4 text-gray-400" />
                              <span className="capitalize">{concept.replace('_', ' ')}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Loop Option (for Luma Ray models) */}
                {currentModel.supportsLoop && (
                  <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-800/30 border border-gray-700/50 md:col-span-2">
                    <input
                      id="loop"
                      type="checkbox"
                      checked={loop}
                      onChange={(e) => setLoop(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <Label htmlFor="loop" className="text-sm font-medium text-white/90 cursor-pointer">
                      Create looping video
                    </Label>
                  </div>
                )}
              </div>
            )}


            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium h-12"
              disabled={!prompt.trim() || !modelId || !hasEnoughCredits || isGenerating || isLoading}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <div className="flex items-center justify-center w-full relative">
                  <div className="flex items-center">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Video
                  </div>
                  {creditsCost > 0 && (
                    <div className="absolute right-0 flex items-center space-x-1 text-sm opacity-80">
                      <span>{creditsCost}</span>
                      <span>credits</span>
                    </div>
                  )}
                </div>
              )}
            </Button>

            {/* Error Messages */}
            {!hasEnoughCredits && (
              <div className="flex items-start space-x-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400">Insufficient credits</p>
                  <p className="text-xs text-red-300/80 mt-1">You need {creditsCost} credits but only have {currentUser?.credits || 0}. Upgrade your plan to get more credits.</p>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 