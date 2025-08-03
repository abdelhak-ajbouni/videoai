"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Sparkles,
  ChevronDown,
  LogOut,
  User,
  Mail
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

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const pathname = usePathname();

  // Don't show header on landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <header className={cn(
      "h-16 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-50",
      className
    )}>
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Logo */}
        <Link href="/generate" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-white/90 group-hover:text-white transition-colors">VideoAI</span>
        </Link>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Credit Balance & Subscription */}
          {currentUser && (
            <div className="hidden sm:flex items-center space-x-1">
              {/* Credits */}
              <Link href="/pricing">
                <div className="flex items-center space-x-3 px-4 py-2 rounded-full bg-gray-900 hover:bg-gray-800/80 border border-gray-700/50 hover:border-gray-600/60 transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:bg-blue-300 transition-colors"></div>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                      {currentUser.credits?.toLocaleString() || '0'}
                    </span>
                    <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">credits</span>
                  </div>
                </div>
              </Link>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-700/50"></div>

              {/* Subscription */}
              <Link href="/pricing">
                <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-900 hover:bg-gray-800/80 border border-gray-700/50 hover:border-gray-600/60 transition-all duration-200 cursor-pointer group">
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors capitalize">
                    {currentUser.subscriptionTier || 'Free'}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover:bg-emerald-300 transition-colors"></div>
                </div>
              </Link>
            </div>
          )}

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-3 px-3 py-2 h-auto hover:bg-gray-800/50 rounded-full transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-gray-800 group-hover:ring-gray-700 transition-all duration-200">
                    <span className="text-white text-sm font-semibold">
                      {user.firstName?.[0] || "U"}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                      {user.firstName}
                    </p>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-500 group-hover:text-gray-400 transition-colors" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-52 bg-gray-950/95 backdrop-blur-xl border border-gray-800/50 shadow-2xl"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {user.emailAddresses[0]?.emailAddress}
                    </p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/pricing" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Pricing</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <a href="mailto:support@videoai.com?subject=Support Request&body=Hello VideoAI Support Team,%0D%0A%0D%0A" className="cursor-pointer">
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Contact Us</span>
                  </a>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <SignOutButton>
                  <DropdownMenuItem className="cursor-pointer text-red-400 focus:text-red-400">
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