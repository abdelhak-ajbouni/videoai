"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const gridVariants = cva(
  "grid",
  {
    variants: {
      cols: {
        1: "grid-cols-1",
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
        5: "grid-cols-5",
        6: "grid-cols-6",
        12: "grid-cols-12",
        auto: "grid-cols-[repeat(auto-fit,minmax(0,1fr))]",
        "auto-sm": "grid-cols-[repeat(auto-fit,minmax(200px,1fr))]",
        "auto-md": "grid-cols-[repeat(auto-fit,minmax(250px,1fr))]",
        "auto-lg": "grid-cols-[repeat(auto-fit,minmax(300px,1fr))]",
        "auto-xl": "grid-cols-[repeat(auto-fit,minmax(350px,1fr))]",
      },
      gap: {
        0: "gap-0",
        1: "gap-1",
        2: "gap-2",
        3: "gap-3",
        4: "gap-4",
        5: "gap-5",
        6: "gap-6",
        8: "gap-8",
        10: "gap-10",
        12: "gap-12",
        16: "gap-16",
        20: "gap-20",
        24: "gap-24",
      },
      responsive: {
        true: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        cards: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        stats: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        features: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
        gallery: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
      },
    },
    defaultVariants: {
      cols: 1,
      gap: 4,
    },
  }
);

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof gridVariants> {
  as?: React.ElementType;
}

export function Grid({
  className,
  cols,
  gap,
  responsive,
  as: Component = "div",
  ...props
}: GridProps) {
  return (
    <Component
      className={cn(
        gridVariants({
          cols: responsive ? undefined : cols,
          gap,
          responsive
        }),
        className
      )}
      {...props}
    />
  );
}

// Grid item component for spanning columns
const gridItemVariants = cva(
  "",
  {
    variants: {
      span: {
        1: "col-span-1",
        2: "col-span-2",
        3: "col-span-3",
        4: "col-span-4",
        5: "col-span-5",
        6: "col-span-6",
        7: "col-span-7",
        8: "col-span-8",
        9: "col-span-9",
        10: "col-span-10",
        11: "col-span-11",
        12: "col-span-12",
        full: "col-span-full",
      },
      start: {
        1: "col-start-1",
        2: "col-start-2",
        3: "col-start-3",
        4: "col-start-4",
        5: "col-start-5",
        6: "col-start-6",
        7: "col-start-7",
        8: "col-start-8",
        9: "col-start-9",
        10: "col-start-10",
        11: "col-start-11",
        12: "col-start-12",
      },
    },
  }
);

export interface GridItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof gridItemVariants> {
  as?: React.ElementType;
}

export function GridItem({
  className,
  span,
  start,
  as: Component = "div",
  ...props
}: GridItemProps) {
  return (
    <Component
      className={cn(gridItemVariants({ span, start }), className)}
      {...props}
    />
  );
}

// Preset grid configurations
export const gridPresets = {
  dashboard: { responsive: "stats" as const, gap: 6 },
  cards: { responsive: "cards" as const, gap: 6 },
  gallery: { responsive: "gallery" as const, gap: 4 },
  features: { responsive: "features" as const, gap: 8 },
  sidebar: { cols: 4 as const, gap: 6 },
};