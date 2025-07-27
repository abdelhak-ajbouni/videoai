"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  Download,
  Heart,
  Trash2,
  Settings,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";

export function ButtonShowcase() {
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gradient-ai mb-2">
          Enhanced Button System
        </h2>
        <p className="text-text-secondary">
          AI-themed buttons with gradients, animations, and modern interactions
        </p>
      </div>

      {/* Button Variants */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Variants */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-3">Primary Variants</h4>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">
                Default Button
              </Button>
              <Button variant="ai-gradient" icon={<Sparkles className="h-4 w-4" />}>
                AI Gradient
              </Button>
              <Button variant="ai-gradient" size="lg" icon={<Plus className="h-4 w-4" />}>
                Generate Video
              </Button>
            </div>
          </div>

          {/* Secondary Variants */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-3">Secondary Variants</h4>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" icon={<Download className="h-4 w-4" />}>
                Download
              </Button>
              <Button variant="secondary" icon={<Settings className="h-4 w-4" />}>
                Settings
              </Button>
              <Button variant="ghost">
                Ghost Button
              </Button>
              <Button variant="link">
                Link Button
              </Button>
            </div>
          </div>

          {/* Semantic Variants */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-3">Semantic Variants</h4>
            <div className="flex flex-wrap gap-3">
              <Button variant="success" icon={<CheckCircle className="h-4 w-4" />}>
                Success
              </Button>
              <Button variant="warning" icon={<AlertTriangle className="h-4 w-4" />}>
                Warning
              </Button>
              <Button variant="destructive" icon={<Trash2 className="h-4 w-4" />}>
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Sizes */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Button Sizes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ai-gradient" size="sm">
              Small
            </Button>
            <Button variant="ai-gradient" size="default">
              Default
            </Button>
            <Button variant="ai-gradient" size="lg">
              Large
            </Button>
            <Button variant="ai-gradient" size="xl">
              Extra Large
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Icon Buttons */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Icon Buttons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ai-gradient" size="icon">
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon-sm">
              <Settings className="h-3 w-3" />
            </Button>
            <Button variant="ai-gradient" size="icon-lg">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Loading States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ai-gradient"
              loading={loading}
              onClick={handleLoadingDemo}
            >
              {loading ? "Generating..." : "Start Generation"}
            </Button>
            <Button variant="outline" loading>
              Processing
            </Button>
            <Button variant="secondary" loading>
              Uploading
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Icon Positions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Icon Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ai-gradient"
              icon={<Sparkles className="h-4 w-4" />}
              iconPosition="left"
            >
              Left Icon
            </Button>
            <Button
              variant="outline"
              icon={<ArrowRight className="h-4 w-4" />}
              iconPosition="right"
            >
              Right Icon
            </Button>
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
            >
              Default Left
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Demo */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Interactive Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="ai-gradient"
              size="lg"
              className="w-full"
              icon={<Sparkles className="h-5 w-5" />}
            >
              Generate AI Video
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              icon={<Download className="h-5 w-5" />}
            >
              Download Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}