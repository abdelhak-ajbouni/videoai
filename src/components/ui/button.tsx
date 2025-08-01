import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden cursor-pointer",
  {
    variants: {
      variant: {
        // Primary variant with AI theming
        default:
          "bg-ai-primary-500 text-white shadow-ai hover:bg-ai-primary-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 dark:bg-ai-primary-600 dark:hover:bg-ai-primary-500",

        // AI Gradient variant - the star of our design system
        "ai-gradient":
          "bg-gradient-ai text-white shadow-ai hover:shadow-xl hover:-translate-y-1 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700",

        // Enhanced destructive variant
        destructive:
          "bg-error text-error-foreground shadow-sm hover:bg-error/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",

        // Enhanced outline variant with AI theming
        outline:
          "border-2 border-ai-primary-500 bg-transparent text-ai-primary-500 shadow-sm hover:bg-ai-primary-50 hover:text-ai-primary-600 hover:border-ai-primary-600 hover:shadow-md dark:hover:bg-ai-primary-900/20 dark:text-ai-primary-400 dark:border-ai-primary-400 dark:hover:text-ai-primary-300",

        // Enhanced secondary variant
        secondary:
          "bg-surface-elevated text-text-primary border border-border shadow-sm hover:bg-ai-primary-50 hover:text-ai-primary-600 hover:border-ai-primary-300 hover:shadow-md dark:hover:bg-ai-primary-900/20",

        // Enhanced ghost variant
        ghost:
          "text-text-secondary hover:bg-ai-primary-50 hover:text-ai-primary-600 dark:hover:bg-ai-primary-900/20 dark:hover:text-ai-primary-400",

        // Link variant with AI theming
        link:
          "text-ai-primary-500 underline-offset-4 hover:underline hover:text-ai-primary-600 dark:text-ai-primary-400 dark:hover:text-ai-primary-300",

        // Success variant
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",

        // Warning variant  
        warning:
          "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base rounded-xl",
        xl: "h-14 px-8 text-lg rounded-xl",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon, iconPosition = "left", children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}

        {!loading && icon && iconPosition === "left" && (
          <span className="mr-2 flex items-center">
            {icon}
          </span>
        )}

        {children}

        {!loading && icon && iconPosition === "right" && (
          <span className="ml-2 flex items-center">
            {icon}
          </span>
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 