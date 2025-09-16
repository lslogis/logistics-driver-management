import React, { useCallback, useState } from 'react'
import { Upload, FileText, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { FileDropZoneProps } from './types'
import { cn } from '@/lib/utils'

export function FileDropZone({
  onFileSelect,
  acceptedTypes = ['.csv', '.xlsx', '.xls'],
  maxSize = 10,
  disabled = false,
  isLoading = false,
  progress = 0,
  error = null
}: FileDropZoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file type
    const fileName = file.name.toLowerCase()
    const hasValidExtension = acceptedTypes.some(ext => fileName.endsWith(ext))
    
    if (!hasValidExtension) {
      return { 
        isValid: false, 
        error: `지원하지 않는 파일 형식입니다. (${acceptedTypes.join(', ')})` 
      }
    }

    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return { 
        isValid: false, 
        error: `파일 크기는 ${maxSize}MB 이하여야 합니다.` 
      }
    }

    // Check if file is empty
    if (file.size === 0) {
      return { 
        isValid: false, 
        error: '빈 파일은 업로드할 수 없습니다.' 
      }
    }

    return { isValid: true }
  }, [acceptedTypes, maxSize])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const validation = validateFile(file)
    
    if (!validation.isValid) {
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }, [validateFile, onFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled || isLoading) return
    
    handleFiles(e.dataTransfer.files)
  }, [disabled, isLoading, handleFiles])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled || isLoading) return
    
    handleFiles(e.target.files)
  }, [disabled, isLoading, handleFiles])

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null)
  }, [])

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().endsWith('.csv')) {
      return <FileText className="h-8 w-8 text-green-500" />
    }
    return <FileText className="h-8 w-8 text-blue-500" />
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      {/* File Input Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-all duration-200",
          {
            "border-blue-300 bg-blue-50": dragActive && !disabled,
            "border-gray-300 bg-gray-50": !dragActive && !disabled,
            "border-gray-200 bg-gray-100 cursor-not-allowed": disabled,
            "border-red-300 bg-red-50": error,
          }
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          disabled={disabled || isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="text-center">
          {isLoading ? (
            <>
              <Upload className="mx-auto h-12 w-12 text-blue-400 animate-pulse" />
              <div className="mt-4">
                <p className="text-sm text-gray-600">파일 업로드 중...</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{progress.toFixed(0)}%</p>
              </div>
            </>
          ) : (
            <>
              <Upload className={cn(
                "mx-auto h-12 w-12",
                disabled ? "text-gray-400" : error ? "text-red-400" : "text-gray-400"
              )} />
              <div className="mt-4">
                <p className={cn(
                  "text-sm font-medium",
                  disabled ? "text-gray-400" : error ? "text-red-600" : "text-gray-900"
                )}>
                  파일을 드래그하거나 클릭하여 선택하세요
                </p>
                <p className={cn(
                  "text-xs mt-1",
                  disabled ? "text-gray-300" : "text-gray-500"
                )}>
                  {acceptedTypes.join(', ')} 파일, 최대 {maxSize}MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Selected File Display */}
      {selectedFile && !isLoading && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(selectedFile.name)}
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="파일 제거"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {selectedFile && !error && !isLoading && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm text-green-800">
                파일이 선택되었습니다. 다음 단계를 진행하세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}