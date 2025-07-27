import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-xl border text-card-foreground transition-all duration-normal",
  {
    variants: {
      variant: {
        // Default card with surface background
        default: "bg-surface border-border shadow-sm hover:shadow-md",

        // Glass-morphism card - the star of our design system
        glass: "glass-card border-border-light backdrop-blur-xl",

        // Elevated glass card with enhanced effects
        "glass-elevated": "glass-card-elevated border-border-light backdrop-blur-xl",

        // AI-themed gradient card
        "ai-gradient": "bg-gradient-ai text-white border-ai-primary-600 shadow-ai",

        // Neural network themed card
        neural: "bg-gradient-to-br from-ai-neural-50 to-ai-primary-50 border-ai-neural-200 dark:from-ai-neural-900/10 dark:to-ai-primary-900/10 dark:border-ai-neural-800",

        // Electric themed card
        electric: "bg-gradient-to-br from-ai-electric-50 to-ai-primary-50 border-ai-electric-200 dark:from-ai-electric-900/10 dark:to-ai-primary-900/10 dark:border-ai-electric-800",

        // Outline card with subtle styling
        outline: "bg-transparent border-2 border-border hover:border-ai-primary-300 hover:bg-surface/50",
      },
      elevation: {
        none: "shadow-none",
        sm: "shadow-sm hover:shadow-md",
        md: "shadow-md hover:shadow-lg",
        lg: "shadow-lg hover:shadow-xl",
        xl: "shadow-xl hover:shadow-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      elevation: "sm",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> {
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, elevation, hoverable = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, elevation }),
        hoverable && "hover:-translate-y-1 hover:scale-[1.02] cursor-pointer",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-tight tracking-tight text-text-primary",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-secondary leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }; 