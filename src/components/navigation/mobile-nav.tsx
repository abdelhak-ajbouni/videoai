"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Sparkles,
  Video,
  Globe,
  ChevronRight
} from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  description?: string;
}

const mobileNavItems: NavigationItem[] = [
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

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  const isActive = (href: string) => {
    return pathname.startsWith(href.split("?")[0]);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className={cn(
        "lg:hidden flex items-center justify-end p-4 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800/50",
        className
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="hover:bg-gray-800/50 text-gray-400 hover:text-white h-10 w-10"
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-80 bg-gray-950/95 backdrop-blur-xl border-r border-gray-800/50 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white/90">VideoAI</h1>
                  <p className="text-xs text-gray-400">AI Video Platform</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-gray-800/50 text-gray-400 hover:text-white h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* User Info */}
            {currentUser && (
              <div className="p-6 border-b border-gray-800/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-gray-800">
                    <span className="text-white font-semibold">
                      {user?.firstName?.[0] || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {currentUser.credits?.toLocaleString() || '0'} credits available
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Items */}
            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
              {mobileNavItems.map((item) => {
                const active = isActive(item.href);
                const isGenerateVideo = item.id === "generate";

                return (
                  <div key={item.id}>
                    <Link href={item.href} onClick={() => setIsOpen(false)}>
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

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800/50 bg-gray-950/95">
              <SignOutButton>
                <div className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200 cursor-pointer">
                  <span className="text-sm">Sign Out</span>
                </div>
              </SignOutButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}