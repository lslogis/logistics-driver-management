import React from 'react'

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
          <span>진행률</span>
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
            <span className="font-medium">업로드 실패</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                다시 시도
              </button>
            )}
          </div>
          <p className="text-sm mt-1">{uploadError}</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              {fileName ? `${fileName} 업로드 중...` : '파일 업로드 중...'}
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