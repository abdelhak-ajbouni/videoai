"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Video,
  Globe,
  ChevronRight,
  LogOut,
  Bell,
  HelpCircle
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: "generate",
    label: "Generate Video",
    href: "/generate",
    icon: <Sparkles className="h-5 w-5" />,
    description: "Create AI-powered videos"
  },
  {
    id: "explore",
    label: "Explore",
    href: "/explore",
    icon: <Globe className="h-5 w-5" />,
    description: "Latest videos from community"
  },
  {
    id: "my-videos",
    label: "My Videos",
    href: "/my-videos",
    icon: <Video className="h-5 w-5" />,
    description: "Your video collection"
  }
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname.startsWith(href.split("?")[0]);
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-surface border-r border-border transition-all duration-normal backdrop-blur-sm w-80",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-center border-b border-border p-4">
        <div className="p-2 rounded-lg bg-gradient-ai">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
      </div>


      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          const isGenerateVideo = item.id === "generate";

          return (
            <Link key={item.id} href={item.href}>
              <div className={cn(
                "flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-normal group cursor-pointer",
                isGenerateVideo
                  ? "bg-gradient-ai text-white shadow-ai"
                  : active
                  ? "bg-gradient-ai text-white shadow-ai"
                  : "text-text-secondary hover:text-text-primary hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20"
              )}>
                <div className={cn(
                  "flex-shrink-0 transition-transform duration-normal",
                  isGenerateVideo || active 
                    ? "text-white" 
                    : "text-text-secondary group-hover:text-ai-primary-500",
                  !active && !isGenerateVideo && "group-hover:scale-110"
                )}>
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isGenerateVideo || active ? "text-white" : "text-text-primary"
                  )}>
                    {item.label}
                  </p>
                </div>

                {item.badge && (
                  <div className="flex-shrink-0">
                    <span className={cn(
                      "inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full",
                      active || isGenerateVideo
                        ? "bg-white/20 text-white"
                        : "bg-ai-primary-100 text-ai-primary-600 dark:bg-ai-primary-900/30 dark:text-ai-primary-400"
                    )}>
                      {item.badge}
                    </span>
                  </div>
                )}

                {!active && !isGenerateVideo && (
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-normal">
                    <ChevronRight className="h-4 w-4 text-text-tertiary" />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Link href="/help">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20 transition-all duration-normal cursor-pointer">
            <HelpCircle className="h-5 w-5" />
            <span className="text-sm">Help & Support</span>
          </div>
        </Link>

        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20 transition-all duration-normal cursor-pointer">
          <Bell className="h-5 w-5" />
          <span className="text-sm">Notifications</span>
          <div className="ml-auto w-2 h-2 bg-ai-electric-500 rounded-full"></div>
        </div>

        <SignOutButton>
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-text-secondary hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-normal cursor-pointer">
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Sign Out</span>
          </div>
        </SignOutButton>
      </div>
    </div>
  );
}