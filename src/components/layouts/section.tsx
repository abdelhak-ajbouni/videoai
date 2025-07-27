"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const sectionVariants = cva(
  "w-full",
  {
    variants: {
      spacing: {
        none: "py-0",
        sm: "py-8",
        md: "py-12",
        lg: "py-16",
        xl: "py-20",
        "2xl": "py-24",
      },
      background: {
        none: "",
        surface: "bg-surface",
        elevated: "bg-surface-elevated",
        primary: "bg-ai-primary-50 dark:bg-ai-primary-900/10",
        electric: "bg-ai-electric-50 dark:bg-ai-electric-900/10",
        neural: "bg-ai-neural-50 dark:bg-ai-neural-900/10",
        gradient: "bg-gradient-to-br from-ai-primary-50 via-ai-electric-50 to-ai-neural-50 dark:from-ai-primary-900/10 dark:via-ai-electric-900/10 dark:to-ai-neural-900/10",
      },
      border: {
        none: "",
        top: "border-t border-border",
        bottom: "border-b border-border",
        both: "border-y border-border",
      },
    },
    defaultVariants: {
      spacing: "lg",
      background: "none",
      border: "none",
    },
  }
);

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
  VariantProps<typeof sectionVariants> {
  as?: React.ElementType;
}

export function Section({
  className,
  spacing,
  background,
  border,
  as: Component = "section",
  ...props
}: SectionProps) {
  return (
    <Component
      className={cn(sectionVariants({ spacing, background, border }), className)}
      {...props}
    />
  );
}

// Section header component
export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  centered?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  centered = false,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 mb-8",
        centered ? "text-center items-center" : "items-start",
        className
      )}
      {...props}
    >
      <div className={cn(
        "flex items-center justify-between w-full",
        centered && "flex-col space-y-2"
      )}>
        <div className={centered ? "text-center" : ""}>
          <h2 className="text-3xl font-bold text-text-primary">
            {title}
          </h2>
          {subtitle && (
            <p className="text-text-secondary mt-2 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {action && !centered && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      {action && centered && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}

// Preset section configurations
export const sectionPresets = {
  hero: { spacing: "2xl" as const, background: "gradient" as const },
  content: { spacing: "lg" as const, background: "none" as const },
  feature: { spacing: "xl" as const, background: "surface" as const, border: "both" as const },
  stats: { spacing: "lg" as const, background: "elevated" as const },
  cta: { spacing: "xl" as const, background: "primary" as const },
};