"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const containerVariants = cva(
  "w-full mx-auto px-4 sm:px-6 lg:px-8",
  {
    variants: {
      size: {
        sm: "max-w-container-sm",      // 640px
        md: "max-w-container-md",      // 768px
        lg: "max-w-container-lg",      // 1024px
        xl: "max-w-container-xl",      // 1280px
        "2xl": "max-w-container-2xl",  // 1536px
        full: "max-w-full",
        none: "max-w-none",
      },
      padding: {
        none: "px-0",
        sm: "px-4",
        md: "px-6",
        lg: "px-8",
        xl: "px-12",
      },
    },
    defaultVariants: {
      size: "xl",
      padding: "lg",
    },
  }
);

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof containerVariants> {
  as?: React.ElementType;
}

export function Container({
  className,
  size,
  padding,
  as: Component = "div",
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(containerVariants({ size, padding }), className)}
      {...props}
    />
  );
}

// Preset container configurations
export const containerPresets = {
  page: { size: "xl" as const, padding: "lg" as const },
  content: { size: "lg" as const, padding: "md" as const },
  narrow: { size: "md" as const, padding: "sm" as const },
  wide: { size: "2xl" as const, padding: "xl" as const },
  full: { size: "full" as const, padding: "none" as const },
};