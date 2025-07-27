"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  Video,
  CreditCard,
  User,
  TrendingUp,
  Home,
  Settings,
  Bell,
  ChevronRight,
  Menu
} from "lucide-react";

export function NavigationShowcase() {
  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gradient-ai mb-2">
          Modern Navigation System
        </h2>
        <p className="text-text-secondary">
          Collapsible sidebar with AI theming, mobile responsiveness, and smooth interactions
        </p>
      </div>

      {/* Navigation Features */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Navigation Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Desktop Sidebar Features */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-4">Desktop Sidebar Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-ai-primary-50 dark:bg-ai-primary-900/20 border border-ai-primary-200 dark:border-ai-primary-800">
                  <div className="p-2 rounded-lg bg-ai-primary-100 dark:bg-ai-primary-900/30">
                    <Settings className="h-4 w-4 text-ai-primary-600 dark:text-ai-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Collapsible Design</p>
                    <p className="text-xs text-text-secondary">280px expanded, 80px collapsed</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg bg-ai-electric-50 dark:bg-ai-electric-900/20 border border-ai-electric-200 dark:border-ai-electric-800">
                  <div className="p-2 rounded-lg bg-ai-electric-100 dark:bg-ai-electric-900/30">
                    <Sparkles className="h-4 w-4 text-ai-electric-600 dark:text-ai-electric-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">AI-Themed Styling</p>
                    <p className="text-xs text-text-secondary">Gradients, glass effects, animations</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg bg-ai-neural-50 dark:bg-ai-neural-900/20 border border-ai-neural-200 dark:border-ai-neural-800">
                  <div className="p-2 rounded-lg bg-ai-neural-100 dark:bg-ai-neural-900/30">
                    <TrendingUp className="h-4 w-4 text-ai-neural-600 dark:text-ai-neural-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Active State Indicators</p>
                    <p className="text-xs text-text-secondary">Gradient backgrounds, shadows</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-surface border border-border">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">User Information</p>
                    <p className="text-xs text-text-secondary">Avatar, name, credit balance</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg bg-surface border border-border">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Quick Actions</p>
                    <p className="text-xs text-text-secondary">Help, notifications, sign out</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg bg-surface border border-border">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Hover Effects</p>
                    <p className="text-xs text-text-secondary">Smooth transitions, scale effects</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Features */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-4">Mobile Navigation Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-br from-ai-primary-50 to-ai-electric-50 border border-ai-primary-200 dark:from-ai-primary-900/10 dark:to-ai-electric-900/10 dark:border-ai-primary-800">
                <div className="p-2 rounded-lg bg-gradient-ai">
                  <Menu className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Hamburger Menu</p>
                  <p className="text-xs text-text-secondary">Touch-friendly toggle</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-br from-ai-electric-50 to-ai-neural-50 border border-ai-electric-200 dark:from-ai-electric-900/10 dark:to-ai-neural-900/10 dark:border-ai-electric-800">
                <div className="p-2 rounded-lg bg-ai-electric-100 dark:bg-ai-electric-900/30">
                  <Video className="h-4 w-4 text-ai-electric-600 dark:text-ai-electric-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Slide-out Panel</p>
                  <p className="text-xs text-text-secondary">Full-height overlay</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-br from-ai-neural-50 to-ai-primary-50 border border-ai-neural-200 dark:from-ai-neural-900/10 dark:to-ai-primary-900/10 dark:border-ai-neural-800">
                <div className="p-2 rounded-lg bg-ai-neural-100 dark:bg-ai-neural-900/30">
                  <CreditCard className="h-4 w-4 text-ai-neural-600 dark:text-ai-neural-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Quick Credit Info</p>
                  <p className="text-xs text-text-secondary">Always visible balance</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Items Demo */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Navigation Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Active Item Example */}
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-ai text-white shadow-ai">
              <Home className="h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Dashboard</p>
                <p className="text-xs text-white/80">Overview and quick actions</p>
              </div>
            </div>

            {/* Hover State Examples */}
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20 transition-all duration-normal cursor-pointer group">
              <Sparkles className="h-5 w-5 group-hover:text-ai-primary-500 group-hover:scale-110 transition-all duration-normal" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Generate Video</p>
                <p className="text-xs">Create AI-powered videos</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity duration-normal" />
            </div>

            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-ai-electric-50 dark:hover:bg-ai-electric-900/20 transition-all duration-normal cursor-pointer group">
              <Video className="h-5 w-5 group-hover:text-ai-electric-500 group-hover:scale-110 transition-all duration-normal" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Video Library</p>
                <p className="text-xs">Manage your videos</p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-ai-electric-100 text-ai-electric-600 dark:bg-ai-electric-900/30 dark:text-ai-electric-400">
                  12
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-ai-neural-50 dark:hover:bg-ai-neural-900/20 transition-all duration-normal cursor-pointer group">
              <TrendingUp className="h-5 w-5 group-hover:text-ai-neural-500 group-hover:scale-110 transition-all duration-normal" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Analytics</p>
                <p className="text-xs">Usage insights and stats</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity duration-normal" />
            </div>

            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20 transition-all duration-normal cursor-pointer group">
              <CreditCard className="h-5 w-5 group-hover:text-ai-primary-500 group-hover:scale-110 transition-all duration-normal" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">Billing</p>
                <p className="text-xs">Credits and subscriptions</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity duration-normal" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collapsed State Demo */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Collapsed Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-8 p-6 bg-surface-elevated rounded-xl border border-border">
            <div className="text-center">
              <p className="text-sm font-medium text-text-secondary mb-4">Expanded (280px)</p>
              <div className="w-48 h-32 bg-gradient-to-br from-ai-primary-50 to-ai-electric-50 rounded-lg border border-ai-primary-200 dark:from-ai-primary-900/10 dark:to-ai-electric-900/10 dark:border-ai-primary-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="p-1 rounded bg-gradient-ai">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-medium">VideoAI</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <Home className="h-3 w-3" />
                      <span>Dashboard</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <Video className="h-3 w-3" />
                      <span>Library</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-text-secondary mb-4">Collapsed (80px)</p>
              <div className="w-16 h-32 bg-gradient-to-b from-ai-primary-50 to-ai-electric-50 rounded-lg border border-ai-primary-200 dark:from-ai-primary-900/10 dark:to-ai-electric-900/10 dark:border-ai-primary-800 flex flex-col items-center justify-center space-y-3">
                <div className="p-1 rounded bg-gradient-ai">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <div className="space-y-2">
                  <Home className="h-3 w-3 mx-auto" />
                  <Video className="h-3 w-3 mx-auto" />
                  <TrendingUp className="h-3 w-3 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Implementation Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-3">Technical Features</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ai-primary-500"></div>
                  <span>Next.js App Router integration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ai-electric-500"></div>
                  <span>Real-time user data from Convex</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ai-neural-500"></div>
                  <span>Responsive breakpoints (lg:hidden/flex)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ai-primary-500"></div>
                  <span>Clerk authentication integration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ai-electric-500"></div>
                  <span>Tailwind CSS with custom design tokens</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-3">User Experience</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  <span>Smooth 300ms transitions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  <span>Touch-friendly 44px minimum targets</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  <span>Keyboard navigation support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  <span>Visual feedback on all interactions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  <span>Consistent AI-themed styling</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}