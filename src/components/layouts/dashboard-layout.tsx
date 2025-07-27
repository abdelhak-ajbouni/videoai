"use client";

import { Sidebar } from "@/components/navigation/sidebar";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className={cn("flex-1 overflow-y-auto", className)}>
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="lg:hidden">
        <main className={cn("min-h-screen", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}