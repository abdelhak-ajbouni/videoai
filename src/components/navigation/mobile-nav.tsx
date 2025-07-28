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
  CreditCard,
  User,
  Home
} from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const mobileNavItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />
  },
  {
    id: "generate",
    label: "Generate",
    href: "/generate",
    icon: <Sparkles className="h-5 w-5" />
  },
  {
    id: "library",
    label: "Library",
    href: "/library",
    icon: <Video className="h-5 w-5" />
  },
  {
    id: "billing",
    label: "Billing",
    href: "/dashboard/billing",
    icon: <CreditCard className="h-5 w-5" />
  },
  {
    id: "profile",
    label: "Profile",
    href: "/dashboard/profile",
    icon: <User className="h-5 w-5" />
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
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href.split("?")[0]);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className={cn(
        "lg:hidden flex items-center justify-between p-4 bg-surface border-b border-border backdrop-blur-sm",
        className
      )}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-ai">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gradient-ai">VideoAI</h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {currentUser && (
            <div className="text-right">
              <p className="text-xs text-text-secondary">Credits</p>
              <p className="text-sm font-bold text-ai-primary-500">
                {currentUser.credits}
              </p>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20"
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-80 bg-surface border-r border-border shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-ai">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gradient-ai">VideoAI</h1>
                  <p className="text-xs text-text-secondary">AI Video Platform</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsOpen(false)}
                className="hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* User Info */}
            {currentUser && (
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
              </div>
            )}

            {/* Navigation Items */}
            <nav className="p-4 space-y-2">
              {mobileNavItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-normal",
                      active
                        ? "bg-gradient-ai text-white shadow-ai"
                        : "text-text-secondary hover:text-text-primary hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20"
                    )}>
                      <div className={cn(
                        "flex-shrink-0",
                        active ? "text-white" : "text-text-secondary"
                      )}>
                        {item.icon}
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        active ? "text-white" : "text-text-primary"
                      )}>
                        {item.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-surface">
              <SignOutButton>
                <div className="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-normal cursor-pointer">
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