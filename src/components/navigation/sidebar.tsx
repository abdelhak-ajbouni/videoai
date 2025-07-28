"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Video,
  CreditCard,
  User,
  Home,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  HelpCircle
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

const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />,
    description: "Overview and quick actions"
  },
  {
    id: "generate",
    label: "Generate Video",
    href: "/generate",
    icon: <Sparkles className="h-5 w-5" />,
    description: "Create AI-powered videos"
  },
  {
    id: "library",
    label: "Video Library",
    href: "/library",
    icon: <Video className="h-5 w-5" />,
    description: "Manage your videos"
  },
  {
    id: "billing",
    label: "Billing",
    href: "/dashboard/billing",
    icon: <CreditCard className="h-5 w-5" />,
    description: "Credits and subscriptions"
  },
  {
    id: "profile",
    label: "Profile",
    href: "/dashboard/profile",
    icon: <User className="h-5 w-5" />,
    description: "Account settings"
  }
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href.split("?")[0]);
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-surface border-r border-border transition-all duration-normal backdrop-blur-sm",
      collapsed ? "w-20" : "w-80",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-border",
        collapsed ? "justify-center p-4" : "justify-between p-6"
      )}>
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-ai">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-ai">VideoAI</h1>
              <p className="text-xs text-text-secondary">AI Video Platform</p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="p-2 rounded-lg bg-gradient-ai">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
        )}

        {!collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Collapsed Toggle Button - Always visible when collapsed */}
      {collapsed && (
        <div className="p-2 border-b border-border">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* User Info */}
      {!collapsed && currentUser && (
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-ai flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.firstName?.[0] || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-text-secondary truncate">
                {currentUser.credits} credits available
              </p>
            </div>
          </div>

          {/* Quick Credit Balance */}
          <div className="mt-4 p-3 rounded-lg bg-ai-primary-50 dark:bg-ai-primary-900/20 border border-ai-primary-200 dark:border-ai-primary-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-ai-primary-700 dark:text-ai-primary-300">Credit Balance</p>
                <p className="text-lg font-bold text-ai-primary-600 dark:text-ai-primary-400">
                  {currentUser.credits}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-ai-primary-100 dark:bg-ai-primary-900/30">
                <CreditCard className="h-4 w-4 text-ai-primary-600 dark:text-ai-primary-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link key={item.id} href={item.href}>
              <div className={cn(
                "flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-normal group cursor-pointer",
                active
                  ? "bg-gradient-ai text-white shadow-ai"
                  : "text-text-secondary hover:text-text-primary hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20",
                collapsed && "justify-center px-2"
              )}>
                <div className={cn(
                  "flex-shrink-0 transition-transform duration-normal",
                  active ? "text-white" : "text-text-secondary group-hover:text-ai-primary-500",
                  !active && "group-hover:scale-110"
                )}>
                  {item.icon}
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      active ? "text-white" : "text-text-primary"
                    )}>
                      {item.label}
                    </p>
                    {item.description && (
                      <p className={cn(
                        "text-xs truncate mt-0.5",
                        active ? "text-white/80" : "text-text-secondary"
                      )}>
                        {item.description}
                      </p>
                    )}
                  </div>
                )}

                {!collapsed && item.badge && (
                  <div className="flex-shrink-0">
                    <span className={cn(
                      "inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-ai-primary-100 text-ai-primary-600 dark:bg-ai-primary-900/30 dark:text-ai-primary-400"
                    )}>
                      {item.badge}
                    </span>
                  </div>
                )}

                {!collapsed && !active && (
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
        {!collapsed && (
          <>
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
          </>
        )}

        <SignOutButton>
          <div className={cn(
            "flex items-center space-x-3 px-3 py-2 rounded-lg text-text-secondary hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-normal cursor-pointer",
            collapsed && "justify-center"
          )}>
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </div>
        </SignOutButton>
      </div>
    </div>
  );
}