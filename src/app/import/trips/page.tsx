'use client'

import React, { useState, useRef } from 'react'
import { Upload, Download, FileText, AlertCircle, CheckCircle, XCircle, Eye, Calendar } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { useValidateTripsCSV, useImportTripsCSV, useDownloadTripTemplate } from '@/hooks/useImports'
import { ImportResult } from '@/lib/api/imports'


// 파일 드래그 앤 드롭 컴포넌트 (drivers와 동일한 컴포넌트 재사용)
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
      if (file.name.toLowerCase().endsWith('.csv')) {
        onFileSelect(file)
      } else {
        toast.error('CSV 파일만 선택 가능합니다')
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
        accept=".csv"
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
        CSV 파일을 드래그하거나 클릭하여 선택하세요
      </p>
      <p className={`text-sm ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
        최대 10MB, CSV 형식만 지원
      </p>
    </div>
  )
}

// 결과 표시 컴포넌트
function ImportResults({ results }: { results: ImportResult }) {
  const successRate = results.total > 0 ? Math.round((results.valid / results.total) * 100) : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* 요약 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600">전체 행</div>
          <div className="text-2xl font-bold text-blue-900">{results.total}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600">유효</div>
          <div className="text-2xl font-bold text-green-900">{results.valid}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-red-600">오류</div>
          <div className="text-2xl font-bold text-red-900">{results.invalid}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600">성공률</div>
          <div className="text-2xl font-bold text-purple-900">{successRate}%</div>
        </div>
      </div>

      {/* 가져오기 완료 상태 */}
      {results.imported > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                가져오기 완료
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{results.imported}개의 운행이 성공적으로 등록되었습니다.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 미리보기 (검증 모드) */}
      {results.preview && results.preview.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">미리보기 (처음 5개)</h3>
          <div className="bg-white border border-gray-200 rounded-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기사</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">차량</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">노선</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">기사요금</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">청구요금</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.preview.map((trip, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {new Date(trip.date).toLocaleDateString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric',
                        weekday: 'short' 
                      })}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div>{trip.driver}</div>
                      <div className="text-xs text-gray-500">{trip.driverPhone}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {trip.vehicle}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {trip.route}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        trip.status === 'ABSENCE' ? 'bg-red-100 text-red-800' :
                        trip.status === 'SUBSTITUTE' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {trip.status === 'COMPLETED' ? '완료' :
                         trip.status === 'ABSENCE' ? '결행' :
                         trip.status === 'SUBSTITUTE' ? '대차' : '예정'}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(trip.driverFare)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(trip.billingFare)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 오류 목록 */}
      {results.errors.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">오류 내역</h3>
          <div className="bg-red-50 border border-red-200 rounded-md max-h-64 overflow-y-auto">
            <ul className="divide-y divide-red-200">
              {results.errors.map((error, index) => (
                <li key={index} className="p-4">
                  <div className="flex">
                    <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-red-800">
                        {error.row}행: {error.error}
                      </div>
                      {error.data && (
                        <div className="mt-1 text-xs text-red-600">
                          데이터: {JSON.stringify(error.data, null, 0)}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

// 메인 컴포넌트
export default function ImportTripsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [validationResults, setValidationResults] = useState<ImportResult | null>(null)

  const validateMutation = useValidateTripsCSV()
  const importMutation = useImportTripsCSV()
  const downloadTemplateMutation = useDownloadTripTemplate()

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setValidationResults(null)
  }

  const handleValidate = async () => {
    if (!selectedFile) return

    try {
      const response = await validateMutation.mutateAsync(selectedFile)
      setValidationResults(response.data.results)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    try {
      const response = await importMutation.mutateAsync(selectedFile)
      setValidationResults(response.data.results)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setValidationResults(null)
  }

  const downloadTemplate = () => {
    downloadTemplateMutation.mutate()
  }

  const isLoading = validateMutation.isPending || importMutation.isPending || downloadTemplateMutation.isPending
  const canImport = validationResults && validationResults.valid > 0 && validationResults.imported === 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                운행 CSV 가져오기
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/trips"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                운행 목록
              </Link>
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                메인으로
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* 안내사항 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  운행 CSV 가져오기 안내
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>필수 컬럼: 날짜, 기사전화번호, 차량번호, 기사요금, 청구요금</li>
                    <li>노선 정보: 노선명 또는 상차지/하차지 중 하나는 필수</li>
                    <li>기사와 차량은 미리 등록되어 있어야 합니다</li>
                    <li>중복된 운행(같은 날짜, 기사, 차량)은 자동으로 제외됩니다</li>
                    <li>상태: 예정(기본), 완료, 결행, 대차</li>
                    <li>대차 상태인 경우 대차기사전화번호와 대차요금이 필요합니다</li>
                  </ul>
                </div>
                <div className="mt-3">
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    템플릿 다운로드
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 파일 업로드 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">1. CSV 파일 선택</h2>
            
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
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={handleReset}
                      disabled={isLoading}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      다시 선택
                    </button>
                  </div>
                </div>
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
                  disabled={isLoading || !selectedFile}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {validateMutation.isPending ? '검증 중...' : '검증 및 미리보기'}
                </button>

                {canImport && (
                  <button
                    onClick={handleImport}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {importMutation.isPending ? '가져오는 중...' : `${validationResults.valid}개 운행 등록`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 결과 표시 */}
          {validationResults && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">3. 처리 결과</h2>
              <ImportResults results={validationResults} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}