'use client'

import React, { useState, useRef } from 'react'
import { Upload, Download, FileText, AlertCircle, CheckCircle, XCircle, MapPin, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

// File drag and drop component
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
      
      if (!supportedExtensions.some(ext => fileName.endsWith(ext))) {
        toast.error('CSV 또는 Excel 파일만 업로드 가능합니다')
        return
      }
      
      onFileSelect(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
        ${disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : ''}
        ${isDragOver && !disabled ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
        ${!isDragOver && !disabled ? 'hover:border-gray-400 hover:bg-gray-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
      <Upload className={`mx-auto h-12 w-12 mb-4 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
      <p className={`text-lg font-medium mb-2 ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
        {disabled ? '처리 중...' : 'CSV 파일을 드래그하거나 클릭하여 선택'}
      </p>
      <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
        CSV, Excel 파일 지원 (.csv, .xlsx, .xls)
      </p>
    </div>
  )
}

// Import results display component
function ImportResultsDisplay({ results }: { results: any }) {
  if (!results) return null

  const { total, valid, invalid, duplicates, errors, preview } = results

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-sm text-gray-500">전체</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{valid}</div>
            <div className="text-sm text-gray-500">유효</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{invalid}</div>
            <div className="text-sm text-gray-500">오류</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{duplicates}</div>
            <div className="text-sm text-gray-500">중복</div>
          </CardContent>
        </Card>
      </div>

      {/* Errors */}
      {errors && errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              오류 목록 ({errors.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {errors.map((error: any, index: number) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{error.row}행:</strong> {error.error}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {preview && preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              미리보기 ({preview.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">노선명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">계약형태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일매출</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일비용</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.routeName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.contractType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.revenueDaily ? `${item.revenueDaily.toLocaleString()}원` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.costDaily ? `${item.costDaily.toLocaleString()}원` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function FixedRoutesImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [validationResults, setValidationResults] = useState<any>(null)
  const [importResults, setImportResults] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<'select' | 'validate' | 'confirm' | 'complete'>('select')

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setValidationResults(null)
    setImportResults(null)
    setCurrentStep('select')
  }

  const handleValidate = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setCurrentStep('validate')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mode', 'simulate')

      const response = await fetch('/api/import/fixed-routes', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.ok) {
        setValidationResults(result.data.results)
        setCurrentStep('confirm')
        toast.success('파일 검증이 완료되었습니다')
      } else {
        toast.error(result.error.message || '파일 검증에 실패했습니다')
        setCurrentStep('select')
      }
    } catch (error) {
      console.error('Validation error:', error)
      toast.error('파일 검증 중 오류가 발생했습니다')
      setCurrentStep('select')
    } finally {
      setIsUploading(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setCurrentStep('complete')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mode', 'commit')

      const response = await fetch('/api/import/fixed-routes', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.ok) {
        setImportResults(result.data.results)
        toast.success(result.data.message || '고정노선 가져오기가 완료되었습니다')
      } else {
        toast.error(result.error.message || '고정노선 가져오기에 실패했습니다')
        setCurrentStep('confirm')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('고정노선 가져오기 중 오류가 발생했습니다')
      setCurrentStep('confirm')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/import/fixed-routes/template')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'fixed_routes_template.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('템플릿 다운로드가 시작되었습니다')
      } else {
        toast.error('템플릿 다운로드에 실패했습니다')
      }
    } catch (error) {
      console.error('Template download error:', error)
      toast.error('템플릿 다운로드 중 오류가 발생했습니다')
    }
  }

  const resetImport = () => {
    setSelectedFile(null)
    setValidationResults(null)
    setImportResults(null)
    setCurrentStep('select')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/fixed-routes"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <MapPin className="h-4 w-4" />
              고정노선 관리
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-900">Excel 가져오기</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">고정노선 Excel 가져오기</h1>
          <p className="text-gray-600 mt-1">
            CSV 또는 Excel 파일을 업로드하여 고정노선을 일괄 등록하세요.
          </p>
        </div>

        {/* Template Download */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              템플릿 다운로드
            </CardTitle>
            <CardDescription>
              정확한 형식의 파일을 업로드하기 위해 템플릿을 다운로드하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              템플릿 다운로드
            </Button>
          </CardContent>
        </Card>

        {/* File Upload */}
        {currentStep === 'select' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>파일 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <FileDropZone
                onFileSelect={handleFileSelect}
                isDragOver={isDragOver}
                setIsDragOver={setIsDragOver}
                disabled={isUploading}
              />
              
              {selectedFile && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium text-blue-900">{selectedFile.name}</div>
                      <div className="text-sm text-blue-600">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <Button
                      onClick={handleValidate}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          검증 중...
                        </>
                      ) : (
                        '검증 시작'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Validation Results */}
        {currentStep === 'confirm' && validationResults && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                검증 결과
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImportResultsDisplay results={validationResults} />
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleImport}
                  disabled={isUploading || validationResults.valid === 0}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      가져오는 중...
                    </>
                  ) : (
                    `${validationResults.valid}개 고정노선 가져오기`
                  )}
                </Button>
                <Button variant="outline" onClick={resetImport}>
                  다시 선택
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Results */}
        {currentStep === 'complete' && importResults && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                가져오기 완료
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImportResultsDisplay results={importResults} />
              
              <div className="flex gap-3 mt-6">
                <Button asChild>
                  <Link href="/fixed-routes">고정노선 관리로 이동</Link>
                </Button>
                <Button variant="outline" onClick={resetImport}>
                  다시 가져오기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}