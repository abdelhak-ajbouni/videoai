"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)}>
      {/* Home icon */}
      <Link
        href="/dashboard"
        className="flex items-center text-text-secondary hover:text-ai-primary-500 transition-colors duration-normal"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.length > 0 && (
        <ChevronRight className="h-4 w-4 text-text-tertiary" />
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center space-x-1">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center space-x-1 text-text-secondary hover:text-ai-primary-500 transition-colors duration-normal"
              >
                {item.icon && (
                  <span className="flex-shrink-0">{item.icon}</span>
                )}
                <span className="truncate">{item.label}</span>
              </Link>
            ) : (
              <div className="flex items-center space-x-1">
                {item.icon && (
                  <span className="flex-shrink-0 text-text-secondary">{item.icon}</span>
                )}
                <span className={cn(
                  "truncate",
                  isLast ? "text-text-primary font-medium" : "text-text-secondary"
                )}>
                  {item.label}
                </span>
              </div>
            )}

            {!isLast && (
              <ChevronRight className="h-4 w-4 text-text-tertiary flex-shrink-0" />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Preset breadcrumb configurations for common pages
export const breadcrumbPresets = {
  dashboard: [],
  profile: [{ label: "Profile", href: "/dashboard/profile" }],
  billing: [{ label: "Billing", href: "/dashboard/billing" }],
  videoLibrary: [{ label: "Video Library" }],
  videoGeneration: [{ label: "Generate Video" }],
  analytics: [{ label: "Analytics" }],
  settings: [{ label: "Settings" }],
  help: [{ label: "Help & Support" }],
};