'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Upload, Download, FileText, AlertCircle, CheckCircle, XCircle, Eye, Truck, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { useVehiclesImportWorkflow, useFileValidation } from '@/hooks/useImports'
import { ImportResult } from '@/lib/api/imports'
import { UploadProgress } from '@/components/ui/progress'
import { ImportResultsDisplay } from '@/components/import/ImportResultsDisplay'
import { ErrorBoundary, ImportErrorDisplay } from '@/components/ErrorBoundary'


// 파일 드래그 앤 드롭 컴포넌트
function FileDropZone({ 
  onFileSelect, 
  isDragOver, 
  setIsDragOver,
  disabled 
}: {
  onFileSelect: (file: File) => void
  isDragOver: boolean
  setIsDragOver: (isDragOver: boolean) => void
  disabled: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const fileName = file.name.toLowerCase()
      const supportedExtensions = ['.csv', '.xlsx', '.xls']
      if (supportedExtensions.some(ext => fileName.endsWith(ext))) {
        onFileSelect(file)
      } else {
        toast.error('CSV 또는 Excel 파일만 선택 가능합니다 (.csv, .xlsx, .xls)')
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragOver
          ? 'border-blue-500 bg-blue-50'
          : disabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
      
      <Upload className={`mx-auto h-12 w-12 mb-4 ${
        disabled ? 'text-gray-300' : isDragOver ? 'text-blue-500' : 'text-gray-400'
      }`} />
      
      <p className={`text-lg font-medium mb-2 ${
        disabled ? 'text-gray-400' : 'text-gray-900'
      }`}>
        CSV 또는 Excel 파일을 드래그하거나 클릭하여 선택하세요
      </p>
      <p className={`text-sm ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
        최대 10MB, CSV 또는 Excel 형식 지원 (.csv, .xlsx, .xls)
      </p>
    </div>
  )
}


// 메인 컴포넌트
export default function ImportVehiclesPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [validationResults, setValidationResults] = useState<ImportResult | null>(null)

  const {
    validate,
    importData,
    downloadTemplate,
    isLoading,
    progress,
    isUploading,
    uploadError,
    resetProgress
  } = useVehiclesImportWorkflow()

  const { getFileFormat } = useFileValidation()

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setValidationResults(null)
    resetProgress()
  }

  const handleValidate = async () => {
    if (!selectedFile) return

    try {
      const response = await validate(selectedFile)
      if (response) {
        setValidationResults(response.data.results)
      }
    } catch (error) {
      // Error handled by the workflow hook
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    try {
      const response = await importData(selectedFile)
      if (response) {
        setValidationResults(response.data.results)
        // Reset the file after successful import
        setTimeout(() => {
          setSelectedFile(null)
          setValidationResults(null)
        }, 3000)
      }
    } catch (error) {
      // Error handled by the workflow hook
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setValidationResults(null)
    resetProgress()
  }

  const handleRetry = () => {
    resetProgress()
  }

  const canImport = validationResults && validationResults.valid > 0 && validationResults.imported === 0

  // Auto-reset upload error when file changes
  useEffect(() => {
    if (selectedFile && uploadError) {
      resetProgress()
    }
  }, [selectedFile, uploadError, resetProgress])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-orange-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                차량 데이터 가져오기
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/vehicles"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                차량 목록
              </Link>
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                메인으로
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="w-full py-6 px-4">
        <div className="space-y-6">
          {/* 안내사항 */}
          <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">
                  차량 데이터 가져오기 안내
                </h3>
                <div className="mt-2 text-sm text-orange-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>CSV 또는 Excel 파일의 첫 번째 행은 헤더로 사용됩니다</li>
                    <li>필수 컬럼: 차량번호(plateNumber), 차량유형(vehicleType), 소유권(ownership)</li>
                    <li>선택 컬럼: 연식(year), 정원(capacity), 배정기사ID(driverId), 활성상태(isActive)</li>
                    <li>소유권 값: OWNED(자차), CHARTER(용차), CONSIGNED(지입)</li>
                    <li>중복된 차량번호는 자동으로 제외됩니다</li>
                    <li>최대 파일 크기: 10MB</li>
                  </ul>
                </div>
                <div className="mt-3">
                  <button
                    onClick={downloadTemplate}
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-600 bg-white border border-orange-300 rounded-md hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? '다운로드 중...' : '템플릿 다운로드'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 파일 업로드 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">1. 파일 선택</h2>
            
            <FileDropZone
              onFileSelect={handleFileSelect}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              disabled={isLoading}
            />

            {selectedFile && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {getFileFormat(selectedFile)}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={handleReset}
                      disabled={isLoading || isUploading}
                      className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      다시 선택
                    </button>
                  </div>
                </div>

                {/* Upload progress indicator */}
                <UploadProgress
                  isUploading={isUploading}
                  progress={progress}
                  uploadError={uploadError}
                  fileName={selectedFile.name}
                  onRetry={handleRetry}
                />
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          {selectedFile && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">2. 가져오기 단계</h2>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleValidate}
                  disabled={isLoading || !selectedFile || isUploading || !!uploadError}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? '검증 중...' : '검증 및 미리보기'}
                </button>

                {canImport && (
                  <button
                    onClick={handleImport}
                    disabled={isLoading || isUploading || !!uploadError}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? '가져오는 중...' : `${validationResults.valid}개 차량 등록`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 결과 표시 */}
          {validationResults && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">3. 처리 결과</h2>
              <ImportResultsDisplay 
                results={validationResults} 
                type="vehicles"
                onViewDetails={() => window.location.href = '/vehicles'}
              />
            </div>
          )}

          {/* Upload Error Display */}
          {uploadError && !isUploading && (
            <ImportErrorDisplay
              error={uploadError}
              onRetry={handleRetry}
              onReset={handleReset}
            />
          )}
        </div>
      </main>
      </div>
    </ErrorBoundary>
  )
}