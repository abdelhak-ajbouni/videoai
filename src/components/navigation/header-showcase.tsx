"use client";

import { Header } from "@/components/navigation/header";
import { Breadcrumb, breadcrumbPresets } from "@/components/navigation/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Bell,
  User,
  CreditCard,
  Video,
  Sparkles,
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react";

export function HeaderShowcase() {
  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gradient-ai mb-2">
          Responsive Header System
        </h2>
        <p className="text-text-secondary">
          Modern header with search, notifications, user menu, and responsive design
        </p>
      </div>

      {/* Header Variants */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Header Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Header */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-3">Basic Header</h4>
            <div className="border border-border rounded-xl overflow-hidden">
              <Header
                title="Dashboard"
                subtitle="Overview and quick actions"
                showSearch={false}
              />
            </div>
          </div>

          {/* Header with Search */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-3">Header with Search</h4>
            <div className="border border-border rounded-xl overflow-hidden">
              <Header
                title="Video Library"
                subtitle="Manage your AI-generated videos"
                showSearch={true}
              />
            </div>
          </div>

          {/* Header with Custom Content */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-3">Header with Breadcrumbs</h4>
            <div className="border border-border rounded-xl overflow-hidden">
              <Header showSearch={false}>
                <div className="space-y-2">
                  <Breadcrumb items={[
                    { label: "Video Library", href: "/dashboard/library" },
                    { label: "My Video", icon: <Video className="h-4 w-4" /> }
                  ]} />
                  <h1 className="text-2xl font-bold text-text-primary">Sunset Over Mountains</h1>
                  <p className="text-sm text-text-secondary">Generated 2 hours ago • 8 seconds • HD Quality</p>
                </div>
              </Header>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header Features */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Header Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Feature */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-4">Search Functionality</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-ai-primary-50 dark:bg-ai-primary-900/20 border border-ai-primary-200 dark:border-ai-primary-800">
                  <div className="p-2 rounded-lg bg-ai-primary-100 dark:bg-ai-primary-900/30">
                    <Search className="h-4 w-4 text-ai-primary-600 dark:text-ai-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Global Search</p>
                    <p className="text-xs text-text-secondary">Search videos, prompts, and content</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg bg-ai-neural-50 dark:bg-ai-neural-900/20 border border-ai-neural-200 dark:border-ai-neural-800">
                  <div className="p-2 rounded-lg bg-ai-neural-100 dark:bg-ai-neural-900/30">
                    <Monitor className="h-4 w-4 text-ai-neural-600 dark:text-ai-neural-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Desktop Full Width</p>
                    <p className="text-xs text-text-secondary">Centered search bar on larger screens</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-ai-electric-50 dark:bg-ai-electric-900/20 border border-ai-electric-200 dark:border-ai-electric-800">
                  <div className="p-2 rounded-lg bg-ai-electric-100 dark:bg-ai-electric-900/30">
                    <Smartphone className="h-4 w-4 text-ai-electric-600 dark:text-ai-electric-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Mobile Icon</p>
                    <p className="text-xs text-text-secondary">Compact search icon on mobile</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg bg-surface border border-border">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Sparkles className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Focus States</p>
                    <p className="text-xs text-text-secondary">AI-themed focus rings and transitions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Menu Features */}
          <div>
            <h4 className="text-sm font-medium text-text-secondary mb-4">User Menu & Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-br from-ai-primary-50 to-ai-electric-50 border border-ai-primary-200 dark:from-ai-primary-900/10 dark:to-ai-electric-900/10 dark:border-ai-primary-800">
                <div className="p-2 rounded-lg bg-gradient-ai">
                  <Bell className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Notifications</p>
                  <p className="text-xs text-text-secondary">Badge with count</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-br from-ai-electric-50 to-ai-neural-50 border border-ai-electric-200 dark:from-ai-electric-900/10 dark:to-ai-neural-900/10 dark:border-ai-electric-800">
                <div className="p-2 rounded-lg bg-ai-electric-100 dark:bg-ai-electric-900/30">
                  <CreditCard className="h-4 w-4 text-ai-electric-600 dark:text-ai-electric-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Credit Balance</p>
                  <p className="text-xs text-text-secondary">Real-time balance display</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-br from-ai-neural-50 to-ai-primary-50 border border-ai-neural-200 dark:from-ai-neural-900/10 dark:to-ai-primary-900/10 dark:border-ai-neural-800">
                <div className="p-2 rounded-lg bg-ai-neural-100 dark:bg-ai-neural-900/30">
                  <User className="h-4 w-4 text-ai-neural-600 dark:text-ai-neural-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">User Dropdown</p>
                  <p className="text-xs text-text-secondary">Profile, settings, sign out</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breadcrumb System */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Breadcrumb Navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-text-secondary mb-2">Dashboard Root</p>
              <div className="p-3 rounded-lg bg-surface-elevated border border-border">
                <Breadcrumb items={breadcrumbPresets.dashboard} />
              </div>
            </div>

            <div>
              <p className="text-xs text-text-secondary mb-2">Profile Page</p>
              <div className="p-3 rounded-lg bg-surface-elevated border border-border">
                <Breadcrumb items={breadcrumbPresets.profile} />
              </div>
            </div>

            <div>
              <p className="text-xs text-text-secondary mb-2">Video Library</p>
              <div className="p-3 rounded-lg bg-surface-elevated border border-border">
                <Breadcrumb items={[
                  { label: "Video Library", href: "/dashboard/library" },
                  { label: "AI Landscapes", href: "/dashboard/library/category/landscapes" },
                  { label: "Sunset Over Mountains", icon: <Video className="h-4 w-4" /> }
                ]} />
              </div>
            </div>


          </div>
        </CardContent>
      </Card>

      {/* Responsive Behavior */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Responsive Design</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Desktop */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 rounded-lg bg-ai-primary-100 dark:bg-ai-primary-900/30">
                  <Monitor className="h-5 w-5 text-ai-primary-600 dark:text-ai-primary-400" />
                </div>
              </div>
              <h4 className="text-sm font-medium text-text-primary mb-2">Desktop (1024px+)</h4>
              <ul className="text-xs text-text-secondary space-y-1">
                <li>• Full search bar in center</li>
                <li>• Credit balance visible</li>
                <li>• User name and tier shown</li>
                <li>• All actions accessible</li>
              </ul>
            </div>

            {/* Tablet */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 rounded-lg bg-ai-electric-100 dark:bg-ai-electric-900/30">
                  <Tablet className="h-5 w-5 text-ai-electric-600 dark:text-ai-electric-400" />
                </div>
              </div>
              <h4 className="text-sm font-medium text-text-primary mb-2">Tablet (768px+)</h4>
              <ul className="text-xs text-text-secondary space-y-1">
                <li>• Search bar maintained</li>
                <li>• Credit balance hidden</li>
                <li>• Compact user menu</li>
                <li>• Essential actions only</li>
              </ul>
            </div>

            {/* Mobile */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 rounded-lg bg-ai-neural-100 dark:bg-ai-neural-900/30">
                  <Smartphone className="h-5 w-5 text-ai-neural-600 dark:text-ai-neural-400" />
                </div>
              </div>
              <h4 className="text-sm font-medium text-text-primary mb-2">Mobile (&lt; 768px)</h4>
              <ul className="text-xs text-text-secondary space-y-1">
                <li>• Search icon only</li>
                <li>• Logo visible</li>
                <li>• Avatar only in menu</li>
                <li>• Minimal interface</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ai-primary-500"></div>
                  <span>Sticky positioning with backdrop blur</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ai-electric-500"></div>
                  <span>Real-time user data integration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ai-neural-500"></div>
                  <span>Responsive breakpoint management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ai-primary-500"></div>
                  <span>Glass-morphism dropdown menus</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-ai-electric-500"></div>
                  <span>Theme toggle integration</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-3">Accessibility</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  <span>Keyboard navigation support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  <span>Screen reader compatibility</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  <span>Focus management and indicators</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  <span>ARIA labels and descriptions</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  <span>Color contrast compliance</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}