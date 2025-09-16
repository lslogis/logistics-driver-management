import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, AlertCircle, Check } from "lucide-react"

const inputVariants = cva(
  [
    "flex w-full rounded-lg border bg-white px-4 py-3 text-sm font-medium",
    "placeholder:text-neutral-500 placeholder:font-normal",
    "transition-all duration-200 ease-out",
    "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-neutral-50",
    "dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100",
    "dark:placeholder:text-neutral-400 dark:disabled:bg-neutral-900",
    "dark:focus:border-brand-400 dark:focus:ring-brand-400/20",
  ],
  {
    variants: {
      variant: {
        default: [
          "border-neutral-300 hover:border-neutral-400",
          "shadow-sm hover:shadow-md focus:shadow-md",
        ],
        success: [
          "border-success-300 bg-success-50 hover:border-success-400",
          "focus:border-success-500 focus:ring-success-500/20",
          "dark:border-success-700 dark:bg-success-950",
        ],
        warning: [
          "border-warning-300 bg-warning-50 hover:border-warning-400",
          "focus:border-warning-500 focus:ring-warning-500/20",
          "dark:border-warning-700 dark:bg-warning-950",
        ],
        error: [
          "border-danger-300 bg-danger-50 hover:border-danger-400",
          "focus:border-danger-500 focus:ring-danger-500/20",
          "dark:border-danger-700 dark:bg-danger-950",
        ],
        ghost: [
          "border-transparent bg-neutral-100 hover:bg-neutral-200",
          "focus:bg-white focus:border-brand-500",
          "dark:bg-neutral-800 dark:hover:bg-neutral-700",
          "dark:focus:bg-neutral-800 dark:focus:border-brand-400",
        ],
      },
      size: {
        sm: "h-9 px-3 py-2 text-sm",
        default: "h-11 px-4 py-3 text-sm",
        lg: "h-12 px-5 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: string
  success?: string
  loading?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    type, 
    leftIcon, 
    rightIcon, 
    error, 
    success, 
    loading,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [internalVariant, setInternalVariant] = React.useState(variant)
    
    // Auto-set variant based on validation state
    React.useEffect(() => {
      if (error) {
        setInternalVariant('error')
      } else if (success) {
        setInternalVariant('success')
      } else {
        setInternalVariant(variant || 'default')
      }
    }, [error, success, variant])

    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400">
            {leftIcon}
          </div>
        )}
        
        <input
          type={inputType}
          className={cn(
            inputVariants({ variant: internalVariant, size }),
            leftIcon && "pl-10",
            (rightIcon || isPassword || error || success || loading) && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-500 border-t-transparent" />
          )}
          
          {error && !loading && (
            <AlertCircle className="h-4 w-4 text-danger-500" />
          )}
          
          {success && !error && !loading && (
            <Check className="h-4 w-4 text-success-500" />
          )}
          
          {isPassword && !loading && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
          
          {rightIcon && !isPassword && !error && !success && !loading && (
            <div className="text-neutral-500 dark:text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error || success) && (
          <div className={cn(
            "mt-2 text-sm font-medium flex items-center gap-2",
            error ? "text-danger-600 dark:text-danger-400" : "text-success-600 dark:text-success-400"
          )}>
            {error ? (
              <>
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 flex-shrink-0" />
                {success}
              </>
            )}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Textarea component using similar design patterns
const textareaVariants = cva(
  [
    "flex w-full rounded-lg border bg-white px-4 py-3 text-sm font-medium",
    "placeholder:text-neutral-500 placeholder:font-normal",
    "transition-all duration-200 ease-out",
    "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
    "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-neutral-50",
    "dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100",
    "dark:placeholder:text-neutral-400 dark:disabled:bg-neutral-900",
    "dark:focus:border-brand-400 dark:focus:ring-brand-400/20",
    "min-h-[80px] py-3 resize-vertical",
    "border-neutral-300 hover:border-neutral-400",
    "shadow-sm hover:shadow-md focus:shadow-md",
  ]
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  success?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, success, ...props }, ref) => {
    return (
      <div className="relative">
        <textarea
          className={cn(
            textareaVariants(),
            error && "border-danger-300 bg-danger-50 focus:border-danger-500 focus:ring-danger-500/20",
            success && "border-success-300 bg-success-50 focus:border-success-500 focus:ring-success-500/20",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {(error || success) && (
          <div className={cn(
            "mt-2 text-sm font-medium flex items-center gap-2",
            error ? "text-danger-600 dark:text-danger-400" : "text-success-600 dark:text-success-400"
          )}>
            {error ? (
              <>
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 flex-shrink-0" />
                {success}
              </>
            )}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

// FormRow component for reusable form rows
export type FormFieldState = 'required' | 'active' | 'auto'

export interface FormRowProps {
  id: string
  label: string
  required?: boolean
  type?: 'text' | 'number' | 'date' | 'tel' | 'email' | 'password' | 'textarea' | 'select'
  placeholder?: string
  className?: string
  state?: FormFieldState
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  options?: { value: string; label: string }[]
  helpText?: string
  readOnly?: boolean
}

import { Label } from "./label"

export function FormRow({
  id,
  label,
  required,
  type = 'text',
  placeholder,
  className,
  state,
  value,
  onChange,
  options,
  helpText,
  readOnly,
}: FormRowProps) {
  const isAuto = state === 'auto'
  const isActive = state === 'active'
  const isRequiredVisual = state === 'required' || required

  // Base width is w-64, allow override via className
  const widthClass = className?.match(/\bw-\S+/) ? '' : 'w-64'

  const commonStateClasses = [
    isActive ? 'ring-2 ring-blue-500 border-blue-500' : '',
    isAuto ? 'bg-gray-100 text-gray-500' : '',
  ].filter(Boolean).join(' ')

  const labelExtra = [
    'text-sm font-medium',
    isRequiredVisual ? 'font-semibold' : '',
  ].filter(Boolean).join(' ')

  const labelSuffix = isAuto ? (
    <span className="ml-1 text-xs text-gray-500">(자동)</span>
  ) : null

  const requiredMark = isRequiredVisual ? (
    <span className="ml-1 text-red-500" aria-hidden>*</span>
  ) : null

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className={labelExtra}>
        {label}
        {requiredMark}
        {labelSuffix}
      </Label>
      {type === 'textarea' ? (
        <Textarea
          id={id}
          placeholder={placeholder}
          value={typeof value === 'number' ? String(value) : value}
          onChange={onChange as any}
          readOnly={readOnly || isAuto}
          className={cn(widthClass, commonStateClasses, className)}
        />
      ) : type === 'select' ? (
        <select
          id={id}
          value={typeof value === 'number' ? String(value) : (value ?? '')}
          onChange={onChange as any}
          className={cn(
            "flex h-11 rounded-lg border bg-white px-4 py-3 text-sm font-medium border-neutral-300 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
            widthClass,
            commonStateClasses,
            className
          )}
          aria-required={!!required}
        >
          {(options || []).map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value as any}
          onChange={onChange as any}
          readOnly={readOnly || isAuto}
          className={cn(widthClass, commonStateClasses, className)}
          aria-required={!!required}
        />
      )}
      {helpText && (
        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  )
}

export { Input, Textarea, inputVariants }
