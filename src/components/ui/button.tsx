import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  // Base styles with modern design system tokens
  [
    "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-60",
    "active:scale-[0.98] transform",
    "relative overflow-hidden",
    // Modern interaction improvements
    "before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-0",
    "hover:before:opacity-100 before:transition-opacity before:duration-200",
  ],
  {
    variants: {
      variant: {
        // Primary - Brand color, main CTAs
        primary: [
          "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-md",
          "hover:from-brand-600 hover:to-brand-700 hover:shadow-lg hover:shadow-brand/25",
          "focus-visible:ring-brand-500",
          "disabled:from-brand-300 disabled:to-brand-400",
        ],
        // Secondary - Subtle, professional
        secondary: [
          "bg-gradient-to-b from-neutral-100 to-neutral-200 text-neutral-900 border border-neutral-300 shadow-sm",
          "hover:from-neutral-200 hover:to-neutral-300 hover:border-neutral-400 hover:shadow-md",
          "focus-visible:ring-neutral-500",
          "disabled:from-neutral-50 disabled:to-neutral-100",
          "dark:from-neutral-800 dark:to-neutral-900 dark:text-neutral-100 dark:border-neutral-700",
          "dark:hover:from-neutral-700 dark:hover:to-neutral-800",
        ],
        // Outline - Clean, professional borders
        outline: [
          "border-2 border-brand-300 bg-transparent text-brand-700 shadow-sm",
          "hover:bg-brand-50 hover:border-brand-400 hover:shadow-md",
          "focus-visible:ring-brand-500",
          "disabled:border-neutral-200 disabled:text-neutral-400",
          "dark:border-brand-600 dark:text-brand-400",
          "dark:hover:bg-brand-950 dark:hover:border-brand-500",
        ],
        // Ghost - Minimal, subtle
        ghost: [
          "bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
          "focus-visible:ring-neutral-500",
          "dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
        ],
        // Destructive - For dangerous actions
        destructive: [
          "bg-gradient-to-b from-danger-500 to-danger-600 text-white shadow-md",
          "hover:from-danger-600 hover:to-danger-700 hover:shadow-lg hover:shadow-danger/25",
          "focus-visible:ring-danger-500",
          "disabled:from-danger-300 disabled:to-danger-400",
        ],
        // Success - For positive actions
        success: [
          "bg-gradient-to-b from-success-500 to-success-600 text-white shadow-md",
          "hover:from-success-600 hover:to-success-700 hover:shadow-lg hover:shadow-success/25",
          "focus-visible:ring-success-500",
          "disabled:from-success-300 disabled:to-success-400",
        ],
        // Warning - For attention-requiring actions
        warning: [
          "bg-gradient-to-b from-warning-500 to-warning-600 text-white shadow-md",
          "hover:from-warning-600 hover:to-warning-700 hover:shadow-lg hover:shadow-warning/25",
          "focus-visible:ring-warning-500",
          "disabled:from-warning-300 disabled:to-warning-400",
        ],
        // Glass - Modern glassmorphism effect
        glass: [
          "glass-effect text-neutral-900 backdrop-blur-md shadow-lg border-white/20",
          "hover:bg-white/20 hover:border-white/30 hover:shadow-xl",
          "dark:text-neutral-100 dark:glass-effect-dark dark:border-white/10",
          "dark:hover:bg-white/10 dark:hover:border-white/20",
        ],
        // Link - Text-only, minimal
        link: [
          "bg-transparent text-brand-600 underline-offset-4 hover:underline",
          "shadow-none p-0 h-auto font-medium",
          "focus-visible:ring-1 focus-visible:ring-offset-1",
          "dark:text-brand-400",
        ],
      },
      size: {
        xs: "h-8 px-3 text-xs rounded-md",
        sm: "h-9 px-4 text-sm rounded-md",
        default: "h-10 px-6 text-sm rounded-lg",
        lg: "h-12 px-8 text-base rounded-lg",
        xl: "h-14 px-10 text-lg rounded-xl font-bold",
        icon: "h-10 w-10 p-0 rounded-lg",
        "icon-sm": "h-8 w-8 p-0 rounded-md",
        "icon-lg": "h-12 w-12 p-0 rounded-lg",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      // Link variant size adjustments
      {
        variant: "link",
        size: ["xs", "sm", "default", "lg", "xl"],
        class: "h-auto p-0",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    asChild = false, 
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? "span" : "button"
    
    const isDisabled = disabled || loading
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        
        {!loading && leftIcon && (
          <span className="inline-flex items-center" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        <span className={cn(
          "inline-flex items-center",
          loading && "opacity-0"
        )}>
          {loading && loadingText ? loadingText : children}
        </span>
        
        {!loading && rightIcon && (
          <span className="inline-flex items-center" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }