"use client";

import { Loading, Skeleton, AIProcessing } from "@/components/ui/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function LoadingShowcase() {
  const [aiProcessingStage, setAiProcessingStage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulate AI processing stages
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setAiProcessingStage((prev) => {
        if (prev >= 4) {
          setIsProcessing(false);
          return 0;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isProcessing]);

  const startProcessing = () => {
    setIsProcessing(true);
    setAiProcessingStage(0);
  };

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gradient-ai mb-2">
          AI-Themed Loading & Animations
        </h2>
        <p className="text-text-secondary">
          Neural networks, pulse effects, and modern loading states
        </p>
      </div>

      {/* Loading Variants */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Loading Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Spinner Variants */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-4">Spinner Variants</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="text-center">
                <Loading variant="spinner" size="md" text="Default Spinner" />
              </div>
              <div className="text-center">
                <Loading variant="neural" size="md" text="Neural Network" />
              </div>
              <div className="text-center">
                <Loading variant="pulse" size="md" text="Pulse Rings" />
              </div>
              <div className="text-center">
                <Loading variant="dots" size="md" text="Bouncing Dots" />
              </div>
              <div className="text-center">
                <Loading variant="ai-processing" size="md" text="AI Processing" />
              </div>
            </div>
          </div>

          {/* Size Variations */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-4">Size Variations</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <Loading variant="ai-processing" size="sm" text="Small" />
              </div>
              <div className="text-center">
                <Loading variant="ai-processing" size="md" text="Medium" />
              </div>
              <div className="text-center">
                <Loading variant="ai-processing" size="lg" text="Large" />
              </div>
              <div className="text-center">
                <Loading variant="ai-processing" size="xl" text="Extra Large" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Processing Demo */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>AI Processing Stages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Button
              variant="ai-gradient"
              onClick={startProcessing}
              disabled={isProcessing}
              className="mb-6"
            >
              {isProcessing ? "Processing..." : "Start AI Generation"}
            </Button>
          </div>

          {isProcessing && (
            <AIProcessing
              currentStage={aiProcessingStage}
              stages={[
                "Analyzing your prompt...",
                "Initializing AI model...",
                "Generating video frames...",
                "Processing final video...",
                "Complete! 🎉"
              ]}
            />
          )}

          {!isProcessing && aiProcessingStage === 0 && (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-ai-primary-50 dark:bg-ai-primary-900/20 w-fit mx-auto mb-4">
                <Loading variant="ai-processing" size="lg" text="" className="mb-0" />
              </div>
              <p className="text-text-secondary">Click the button above to see AI processing stages</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skeleton Loading */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Skeleton Loading States</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Single Line Skeletons */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-4">Single Line Skeletons</h4>
            <div className="space-y-3">
              <Skeleton width="100%" height="1rem" animation="shimmer" />
              <Skeleton width="80%" height="1rem" animation="pulse" />
              <Skeleton width="60%" height="1rem" animation="wave" />
            </div>
          </div>

          {/* Multi-line Skeletons */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-4">Multi-line Content</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h5 className="text-xs font-medium text-text-tertiary mb-2">Shimmer Animation</h5>
                <Skeleton lines={4} animation="shimmer" />
              </div>
              <div>
                <h5 className="text-xs font-medium text-text-tertiary mb-2">Pulse Animation</h5>
                <Skeleton lines={4} animation="pulse" />
              </div>
              <div>
                <h5 className="text-xs font-medium text-text-tertiary mb-2">Wave Animation</h5>
                <Skeleton lines={4} animation="wave" />
              </div>
            </div>
          </div>

          {/* Card Skeleton Example */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-4">Card Skeleton Example</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="glass">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Skeleton width="40px" height="40px" className="rounded-full" />
                    <div className="flex-1">
                      <Skeleton width="60%" height="1rem" className="mb-2" />
                      <Skeleton width="40%" height="0.75rem" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton lines={3} className="mb-4" />
                  <div className="flex space-x-2">
                    <Skeleton width="80px" height="32px" className="rounded-lg" />
                    <Skeleton width="80px" height="32px" className="rounded-lg" />
                  </div>
                </CardContent>
              </Card>

              <Card variant="glass">
                <CardHeader>
                  <Skeleton width="100%" height="200px" className="rounded-lg mb-4" />
                  <Skeleton width="80%" height="1.25rem" className="mb-2" />
                  <Skeleton width="60%" height="0.875rem" />
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Skeleton width="60px" height="24px" className="rounded-full" />
                    <Skeleton width="100px" height="36px" className="rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Loading States */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Interactive Loading Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video Generation Loading */}
            <Card variant="neural" className="p-6">
              <div className="text-center">
                <Loading
                  variant="ai-processing"
                  size="lg"
                  text="Generating your video..."
                />
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Progress</span>
                    <span>73%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-ai h-2 rounded-full w-3/4 transition-all duration-slow" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Upload Loading */}
            <Card variant="electric" className="p-6">
              <div className="text-center">
                <Loading
                  variant="neural"
                  size="lg"
                  text="Uploading to cloud..."
                />
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Upload Speed</span>
                    <span>2.4 MB/s</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-ai-electric-500 h-2 rounded-full w-1/2 transition-all duration-slow animate-pulse" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Button Loading States */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Button Loading States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="ai-gradient" loading>
              Generating Video
            </Button>
            <Button variant="default" loading>
              Processing
            </Button>
            <Button variant="outline" loading>
              Uploading
            </Button>
            <Button variant="secondary" loading>
              Analyzing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}