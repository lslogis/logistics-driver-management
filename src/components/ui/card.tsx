import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  [
    "rounded-xl border bg-white shadow-sm transition-all duration-200",
    "group relative overflow-hidden",
  ],
  {
    variants: {
      variant: {
        default: [
          "border-neutral-200 bg-white shadow-sm",
          "hover:shadow-md hover:shadow-neutral-900/5",
          "dark:border-neutral-800 dark:bg-neutral-900",
        ],
        elevated: [
          "border-neutral-200/50 bg-white shadow-lg shadow-neutral-900/10",
          "hover:shadow-xl hover:shadow-neutral-900/15 hover:-translate-y-1",
          "dark:border-neutral-800/50 dark:bg-neutral-900 dark:shadow-neutral-950/20",
        ],
        glass: [
          "glass-effect backdrop-blur-md shadow-xl",
          "border-white/20 hover:bg-white/20 hover:border-white/30",
          "dark:glass-effect-dark dark:border-white/10",
          "dark:hover:bg-white/10 dark:hover:border-white/20",
        ],
        outline: [
          "border-2 border-neutral-300 bg-transparent",
          "hover:border-brand-300 hover:shadow-sm",
          "dark:border-neutral-700 dark:hover:border-brand-600",
        ],
        success: [
          "border-success-200 bg-success-50 shadow-sm shadow-success-900/5",
          "hover:shadow-md hover:shadow-success-900/10",
          "dark:border-success-800 dark:bg-success-950",
        ],
        warning: [
          "border-warning-200 bg-warning-50 shadow-sm shadow-warning-900/5",
          "hover:shadow-md hover:shadow-warning-900/10",
          "dark:border-warning-800 dark:bg-warning-950",
        ],
        danger: [
          "border-danger-200 bg-danger-50 shadow-sm shadow-danger-900/5",
          "hover:shadow-md hover:shadow-danger-900/10",
          "dark:border-danger-800 dark:bg-danger-950",
        ],
      },
      padding: {
        none: "",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
      interactive: {
        true: [
          "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        ],
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "none",
      interactive: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, interactive, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "div" : "div"
    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ variant, padding, interactive }), className)}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? "button" : undefined}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    gradient?: boolean
  }
>(({ className, gradient = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "flex flex-col space-y-2 p-6",
      gradient && [
        "bg-gradient-to-r from-brand-500/5 to-brand-600/5",
        "border-b border-brand-200/50 dark:border-brand-800/50",
        "dark:from-brand-500/10 dark:to-brand-600/10",
      ],
      className
    )} 
    {...props} 
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  }
>(({ className, as: Comp = "h3", ...props }, ref) => (
  <Comp
    ref={ref}
    className={cn(
      "font-semibold leading-tight tracking-tight text-neutral-900",
      "dark:text-neutral-100",
      {
        "text-2xl": Comp === "h1",
        "text-xl": Comp === "h2",
        "text-lg": Comp === "h3",
        "text-base": Comp === "h4",
        "text-sm": Comp === "h5",
        "text-xs": Comp === "h6",
      },
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-neutral-600 leading-relaxed",
      "dark:text-neutral-400",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("p-6 pt-0", className)} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    separator?: boolean
  }
>(({ className, separator = false, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "flex items-center p-6 pt-0",
      separator && [
        "border-t border-neutral-200 pt-6 mt-6",
        "dark:border-neutral-700",
      ],
      className
    )} 
    {...props} 
  />
))
CardFooter.displayName = "CardFooter"

// Specialized Card variants for common use cases

const StatsCard = React.forwardRef<
  HTMLDivElement,
  CardProps & {
    title: string
    value: string | number
    description?: string
    trend?: {
      value: number
      isPositive: boolean
    }
    icon?: React.ReactNode
  }
>(({ className, title, value, description, trend, icon, ...props }, ref) => (
  <Card
    ref={ref}
    variant="elevated"
    className={cn("p-6", className)}
    {...props}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {title}
        </p>
        <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
          {value}
        </p>
        {description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium mt-2",
            trend.isPositive 
              ? "text-success-600 dark:text-success-400" 
              : "text-danger-600 dark:text-danger-400"
          )}>
            <span>{trend.isPositive ? "↗" : "↘"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      {icon && (
        <div className="text-brand-500 opacity-80">
          {icon}
        </div>
      )}
    </div>
  </Card>
))
StatsCard.displayName = "StatsCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  StatsCard,
  cardVariants,
}