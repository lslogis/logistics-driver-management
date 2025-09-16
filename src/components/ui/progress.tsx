"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const clampProgress = (value?: number) => {
  if (value == null || Number.isNaN(value)) {
    return 0
  }
  return Math.min(Math.max(value, 0), 100)
}

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const LABEL_PROGRESS = "\uC9C4\uD589\uB960"
const TEXT_UPLOAD_FAILURE = "\uC5C5\uB85C\uB4DC \uC2E4\uD328"
const TEXT_RETRY = "\uB2E4\uC2DC \uC2DC\uB3C4"
const TEXT_UPLOAD_IN_PROGRESS = "\uC5C5\uB85C\uB4DC \uC911..."
const TEXT_FILE_UPLOAD_IN_PROGRESS = "\uD30C\uC77C \uC5C5\uB85C\uB4DC \uC911..."

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => {
    const clampedValue = clampProgress(value)

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedValue}
        data-value={clampedValue}
        data-state={clampedValue === 100 ? "complete" : "in-progress"}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
          className
        )}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-indigo-600 transition-all"
          style={{ transform: `translateX(-${100 - clampedValue}%)` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }

interface ProgressBarProps {
  progress: number
  isIndeterminate?: boolean
  className?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'red' | 'yellow'
}

export function ProgressBar({
  progress,
  isIndeterminate = false,
  className = '',
  showPercentage = true,
  size = 'md',
  color = 'blue'
}: ProgressBarProps) {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2', 
    lg: 'h-3'
  }

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  }

  const backgroundColorClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100'
  }

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full ${backgroundColorClasses[color]} rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className={`${heightClasses[size]} ${colorClasses[color]} transition-all duration-300 ease-out ${
            isIndeterminate ? 'animate-pulse' : ''
          }`}
          style={{ width: isIndeterminate ? '100%' : `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
      {showPercentage && !isIndeterminate && (
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{LABEL_PROGRESS}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  )
}

interface UploadProgressProps {
  isUploading: boolean
  progress: number
  uploadError: string | null
  fileName?: string
  onRetry?: () => void
}

export function UploadProgress({
  isUploading,
  progress,
  uploadError,
  fileName,
  onRetry
}: UploadProgressProps) {
  if (!isUploading && !uploadError) return null

  return (
    <div className="mt-4 p-4 border rounded-lg">
      {uploadError ? (
        <div className="text-red-600">
          <div className="flex items-center justify-between">
            <span className="font-medium">{TEXT_UPLOAD_FAILURE}</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {TEXT_RETRY}
              </button>
            )}
          </div>
          <p className="text-sm mt-1">{uploadError}</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              {fileName ? `${fileName} ${TEXT_UPLOAD_IN_PROGRESS}` : TEXT_FILE_UPLOAD_IN_PROGRESS}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <ProgressBar
            progress={progress}
            color="blue"
            size="sm"
            showPercentage={false}
          />
        </div>
      )}
    </div>
  )
}