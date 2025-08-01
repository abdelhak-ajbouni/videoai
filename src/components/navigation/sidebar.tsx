"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Video,
  Globe,
  ChevronRight
} from "lucide-react";

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
      "flex flex-col h-screen bg-gray-950/95 backdrop-blur-xl border-r border-gray-800/50 w-64",
      className
    )}>
      {/* Header */}
      <div className="border-b border-gray-800/50 p-6">
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          const isGenerateVideo = item.id === "generate";

          return (
            <div key={item.id}>
              <Link href={item.href}>
                <div className={cn(
                  "flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                  isGenerateVideo
                    ? "bg-white text-gray-900 shadow-lg"
                    : active
                    ? "bg-gray-800/50 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/30"
                )}>
                  <div className={cn(
                    "flex-shrink-0 transition-all duration-200",
                    isGenerateVideo 
                      ? "text-gray-900" 
                      : active
                      ? "text-white"
                      : "text-gray-400 group-hover:text-white"
                  )}>
                    {item.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isGenerateVideo 
                        ? "text-gray-900" 
                        : active 
                        ? "text-white" 
                        : "text-gray-400 group-hover:text-white"
                    )}>
                      {item.label}
                    </p>
                  </div>

                  {!isGenerateVideo && !active && (
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </div>
              </Link>
              
              {/* Divider after Generate Video */}
              {isGenerateVideo && (
                <div className="my-6">
                  <div className="h-px bg-gray-800/50"></div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

    </div>
  );
}