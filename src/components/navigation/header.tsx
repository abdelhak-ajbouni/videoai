"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Search,
  Bell,
  Settings,
  User,
  CreditCard,
  Sparkles,
  ChevronDown,
  LogOut,
  HelpCircle
} from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showUserMenu?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  showSearch = true,
  showUserMenu = true,
  className,
  children
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <header className={cn(
      "h-18 bg-surface/80 backdrop-blur-xl border-b border-border sticky top-0 z-40",
      className
    )}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section - Title/Logo */}
        <div className="flex items-center space-x-4">
          {/* Logo for standalone header */}
          <Link href="/generate" className="flex items-center space-x-3 lg:hidden">
            <div className="p-2 rounded-lg bg-gradient-ai">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient-ai">VideoAI</h1>
            </div>
          </Link>

          {/* Page Title */}
          {title && (
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
              {subtitle && (
                <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
              )}
            </div>
          )}

          {/* Custom content */}
          {children}
        </div>

        {/* Center Section - Search */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search videos, prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-surface-elevated",
                  "text-sm text-text-primary placeholder:text-text-secondary",
                  "focus:outline-none focus:ring-2 focus:ring-ai-primary-500 focus:border-transparent",
                  "transition-all duration-normal"
                )}
              />
            </div>
          </div>
        )}

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-3">
          {/* Mobile Search Button */}
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20"
            >
              <Bell className="h-4 w-4" />
              {/* Notification badge */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-ai-electric-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">3</span>
              </div>
            </Button>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Credit Balance & Subscription (Desktop) */}
          {currentUser && (
            <div className="hidden lg:flex items-center space-x-3">
              {/* Credits */}
              <Link href="/subscriptions">
                <div className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-ai-primary-50 to-ai-primary-100 dark:from-ai-primary-900/20 dark:to-ai-primary-800/20 border border-ai-primary-200 dark:border-ai-primary-700 hover:from-ai-primary-100 hover:to-ai-primary-150 dark:hover:from-ai-primary-800/30 dark:hover:to-ai-primary-700/30 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md">
                  <div className="p-1.5 rounded-lg bg-ai-primary-500 group-hover:bg-ai-primary-600 transition-colors">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-ai-primary-700 dark:text-ai-primary-300 uppercase tracking-wide">Credits</p>
                    <p className="text-lg font-bold text-ai-primary-800 dark:text-ai-primary-200 leading-tight">
                      {currentUser.credits?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Subscription */}
              <Link href="/subscriptions">
                <div className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700 hover:from-emerald-100 hover:to-emerald-150 dark:hover:from-emerald-800/30 dark:hover:to-emerald-700/30 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md">
                  <div className="p-1.5 rounded-lg bg-emerald-500 group-hover:bg-emerald-600 transition-colors">
                    <CreditCard className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Plan</p>
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200 leading-tight capitalize">
                      {currentUser.subscriptionTier || 'Free'}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* User Menu */}
          {showUserMenu && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 px-3 py-2 h-auto hover:bg-ai-primary-50 dark:hover:bg-ai-primary-900/20"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-ai flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.firstName?.[0] || "U"}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-text-primary">
                      {user.firstName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {currentUser?.subscriptionTier || "Free"}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-56 glass-card border-border-light"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-text-primary">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {user.emailAddresses[0]?.emailAddress}
                    </p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/subscriptions" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing & Credits</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Preferences</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <SignOutButton>
                  <DropdownMenuItem className="cursor-pointer text-error focus:text-error">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </SignOutButton>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}