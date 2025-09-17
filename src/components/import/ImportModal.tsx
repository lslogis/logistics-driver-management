import React, { useState, useCallback, useMemo } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Download, 
  Upload, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  FileText,
  Users,
  MapPin,
  Route,
  Truck,
  Navigation,
  Calendar,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { ImportModalProps, getImportTypeConfig, isValidImportType } from './types'
import { FileDropZone } from './FileDropZone'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

// 센터요율 전용 타입 정의
type CenterFarePreviewRow = {
  id: string
  centerName: string
  vehicleType: string
  region: string | null
  fareType: '기본운임' | '경유운임'
  baseFare?: number | null
  extraStopFee?: number | null
  extraRegionFee?: number | null
  status: 'valid' | 'error'
  errorMessage?: string
}

type CenterFareValidateRow = {
  centerName: string
  vehicleType: string
  region: string | null
  fareType: 'BASIC' | 'STOP_FEE'
  baseFare?: number | null
  extraStopFee?: number | null
  extraRegionFee?: number | null
}

export function ImportModal({ isOpen, onClose, type, onSuccess }: ImportModalProps) {
  const safeType = isValidImportType(type as unknown as string) ? (type as any) : 'drivers'
  const config = getImportTypeConfig(safeType)
  
  // 센터요율 전용 상태
  const [step, setStep] = useState<'upload' | 'validate' | 'import' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<CenterFarePreviewRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleClose = () => {
    setStep('upload')
    setFile(null)
    setPreviewRows([])
    setError(null)
    setUploadProgress(0)
    onClose()
  }

  const handleSuccess = () => {
    if (onSuccess) onSuccess()
    handleClose()
  }

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    setPreviewRows([])
  }, [])

  // 필드별 오류 검증 함수
  const validateFields = useCallback((row: any, index: number): { isValid: boolean; errorMessage?: string } => {
    // centerName 검증
    if (!row.centerName || row.centerName.trim() === '') {
      return { isValid: false, errorMessage: '센터명 필수' }
    }

    // vehicleType 검증
    if (!row.vehicleType || row.vehicleType.trim() === '') {
      return { isValid: false, errorMessage: '차량톤수 필수' }
    }

    // fareType별 검증
    if (row.fareType === '기본운임') {
      // region 검증
      if (!row.region || row.region.trim() === '') {
        return { isValid: false, errorMessage: '지역 필수' }
      }
      // baseFare 검증
      if (!row.baseFare || row.baseFare <= 0) {
        return { isValid: false, errorMessage: '기본운임 필수' }
      }
    } else if (row.fareType === '경유운임') {
      // extraStopFee 검증
      if (!row.extraStopFee || row.extraStopFee <= 0) {
        return { isValid: false, errorMessage: '경유운임 필수' }
      }
      // extraRegionFee 검증
      if (!row.extraRegionFee || row.extraRegionFee <= 0) {
        return { isValid: false, errorMessage: '지역운임 필수' }
      }
    }

    return { isValid: true }
  }, [])

  // 엑셀 내부 중복 체크 함수
  const checkInternalDuplicates = useCallback((rows: any[]): Set<number> => {
    const duplicateIndexes = new Set<number>()
    const seen = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      let key: string

      if (row.fareType === '경유운임') {
        // STOP_FEE: (centerName, vehicleType) 조합
        key = `${row.centerName}:${row.vehicleType}:STOP_FEE`
      } else {
        // BASIC: (centerName, vehicleType, region) 조합
        key = `${row.centerName}:${row.vehicleType}:${row.region || ''}:BASIC`
      }

      if (seen.has(key)) {
        duplicateIndexes.add(i)
        // 이전에 나온 같은 키의 인덱스도 찾아서 추가
        for (let j = 0; j < i; j++) {
          const prevRow = rows[j]
          let prevKey: string
          if (prevRow.fareType === '경유운임') {
            prevKey = `${prevRow.centerName}:${prevRow.vehicleType}:STOP_FEE`
          } else {
            prevKey = `${prevRow.centerName}:${prevRow.vehicleType}:${prevRow.region || ''}:BASIC`
          }
          if (prevKey === key) {
            duplicateIndexes.add(j)
          }
        }
      } else {
        seen.add(key)
      }
    }

    return duplicateIndexes
  }, [])

  // Excel 파싱 함수
  const parseExcelFile = useCallback(async (file: File) => {
    const { parseExcelFile: parseUtil } = await import('@/lib/utils/center-fares')
    const parseResult = await parseUtil(file)
    
    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      throw new Error('Excel 파싱 실패: ' + parseResult.errors.join(', '))
    }

    return parseResult.data
  }, [])

  // 검증 실행
  const validateFile = useCallback(async () => {
    if (!file || type !== 'center-fares') return

    setIsLoading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // 1. Excel 파싱
      setUploadProgress(20)
      const parsedData = await parseExcelFile(file)
      
      // 2. 필드별 오류 검증 + 엑셀 내부 중복 체크
      setUploadProgress(40)
      const internalDuplicates = checkInternalDuplicates(parsedData)
      
      const previewData: CenterFarePreviewRow[] = parsedData.map((row, index) => {
        // 필드 검증
        const fieldValidation = validateFields(row, index)
        
        // 내부 중복 체크
        const isDuplicate = internalDuplicates.has(index)
        
        let status: 'valid' | 'error' = 'valid'
        let errorMessage: string | undefined

        if (!fieldValidation.isValid) {
          status = 'error'
          errorMessage = fieldValidation.errorMessage
        } else if (isDuplicate) {
          status = 'error'
          errorMessage = '데이터오류(중복)'
        }

        return {
          id: `row-${index}`,
          centerName: row.centerName,
          vehicleType: row.vehicleTypeName,
          region: row.region,
          fareType: row.fareType,
          baseFare: row.baseFare,
          extraStopFee: row.extraStopFee,
          extraRegionFee: row.extraRegionFee,
          status,
          errorMessage
        }
      })

      // 3. DB 중복 체크 (유효한 행만)
      setUploadProgress(60)
      const validRows = previewData.filter(row => row.status === 'valid')
      
      if (validRows.length > 0) {
        const validateRows: CenterFareValidateRow[] = validRows.map(row => ({
          centerName: row.centerName,
          vehicleType: row.vehicleType,
          region: row.region,
          fareType: row.fareType === '기본운임' ? 'BASIC' : 'STOP_FEE',
          baseFare: row.baseFare,
          extraStopFee: row.extraStopFee,
          extraRegionFee: row.extraRegionFee
        }))

        const response = await fetch('/api/center-fares/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: validateRows })
        })

        if (!response.ok) {
          throw new Error('DB 중복 체크 실패')
        }

        const result = await response.json()
        
        // DB 중복 발견 시 해당 행들 오류 처리
        if (result.data.duplicates && result.data.duplicates.length > 0) {
          const duplicateIndexMap = new Map<number, boolean>()
          
          result.data.duplicates.forEach((dup: any) => {
            duplicateIndexMap.set(dup.index, true)
          })

          let validIndex = 0
          previewData.forEach(row => {
            if (row.status === 'valid') {
              if (duplicateIndexMap.has(validIndex)) {
                row.status = 'error'
                row.errorMessage = '이미 등록된 데이터'
              }
              validIndex++
            }
          })
        }
      }

      setUploadProgress(100)
      setPreviewRows(previewData)
      setStep('validate')

    } catch (error) {
      console.error('검증 중 오류:', error)
      setError(error instanceof Error ? error.message : '검증 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [file, type, parseExcelFile, validateFields, checkInternalDuplicates])

  // 가져오기 실행
  const importFile = useCallback(async () => {
    if (!file || type !== 'center-fares') return

    setIsLoading(true)
    setError(null)
    setUploadProgress(0)
    setStep('import')

    try {
      // 유효한 행만 추출
      const validRows = previewRows.filter(row => row.status === 'valid')
      
      if (validRows.length === 0) {
        throw new Error('가져올 수 있는 유효한 데이터가 없습니다')
      }

      // DTO 변환
      const importData = validRows.map(row => ({
        centerName: row.centerName,
        vehicleType: row.vehicleType,
        region: row.fareType === '기본운임' ? (row.region || '') : null,
        fareType: row.fareType === '기본운임' ? 'BASIC' : 'STOP_FEE',
        baseFare: row.baseFare,
        extraStopFee: row.extraStopFee,
        extraRegionFee: row.extraRegionFee
      }))

      // 프로그레스 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 300)

      // Bulk import API 호출
      const response = await fetch('/api/center-fares/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fares: importData })
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || '가져오기 실패')
      }

      const result = await response.json()
      setUploadProgress(100)
      
      toast.success(`가져오기 완료: ${result.data.created + result.data.updated}개 센터요율이 등록되었습니다`)
      setStep('complete')

    } catch (error) {
      console.error('가져오기 중 오류:', error)
      setError(error instanceof Error ? error.message : '가져오기 중 오류가 발생했습니다')
      setStep('validate')
    } finally {
      setIsLoading(false)
    }
  }, [file, type, previewRows])

  // 템플릿 다운로드
  const downloadTemplate = useCallback(async () => {
    try {
      const { downloadExcelTemplate } = await import('@/lib/utils/center-fares')
      downloadExcelTemplate()
      toast.success('템플릿 다운로드 완료')
    } catch (error) {
      toast.error('템플릿 다운로드 실패')
    }
  }, [])

  // 통계 계산
  const stats = useMemo(() => {
    const total = previewRows.length
    const valid = previewRows.filter(row => row.status === 'valid').length
    const invalid = total - valid
    return { total, valid, invalid }
  }, [previewRows])

  const getStepIcon = (stepKey: string, isActive: boolean, isCompleted: boolean) => {
    const iconClass = cn(
      "h-4 w-4",
      isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
    )

    switch (stepKey) {
      case 'upload': return <Upload className={iconClass} />
      case 'validate': return <FileText className={iconClass} />
      case 'import': return <Download className={iconClass} />
      case 'complete': return <CheckCircle2 className={iconClass} />
      default: return null
    }
  }

  const steps = [
    { key: 'upload', label: '파일 업로드' },
    { key: 'validate', label: '검증' },
    { key: 'import', label: '가져오기' },
    { key: 'complete', label: '완료' }
  ]

  const getCurrentStepIndex = () => steps.findIndex(s => s.key === step)
  const isStepCompleted = (stepKey: string) => {
    const stepIndex = steps.findIndex(s => s.key === stepKey)
    const currentIndex = getCurrentStepIndex()
    return stepIndex < currentIndex || (stepKey === 'complete' && step === 'complete')
  }

  // 센터요율이 아닌 경우 기존 로직 사용
  if (type !== 'center-fares') {
    return <div className="p-4 text-center">센터요율 전용 ImportModal입니다.</div>
  }

  const renderStepContent = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded mr-3">
                  <Navigation className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-gray-900 mb-1">
                    {config.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {config.description}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">필요한 필드:</span>
                      <div className="mt-1 text-xs text-gray-600">
                        {config.sampleFields.join(', ')}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">지원 형식:</span>
                      <div className="mt-1 text-xs text-gray-600 font-mono">
                        {config.acceptedFileTypes.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <FileDropZone
              onFileSelect={handleFileSelect}
              acceptedTypes={config.acceptedFileTypes}
              maxSize={config.maxFileSize}
              isLoading={isLoading}
              progress={uploadProgress}
              error={error}
            />

            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Download className="h-4 w-4 mr-2" />
                템플릿 다운로드
              </Button>
            </div>
          </div>
        )

      case 'validate':
        return (
          <div className="space-y-6">
            {/* 요약 헤더 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 text-gray-600">
                  <Navigation className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">검증 결과</h3>
                  <p className="text-sm text-gray-600">전체 {stats.total}개 중 {stats.valid}개 정상, {stats.invalid}개 오류</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                stats.valid === stats.total ? 'bg-green-100 text-green-800' : 
                stats.valid > 0 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'
              }`}>
                성공률 {stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0}%
              </div>
            </div>

            {/* 전체 데이터 표시 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-white">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">전체 데이터 ({stats.total}개)</h4>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        정상
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                        오류
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12">상태</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">센터명</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">차량톤수</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">지역</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">요율종류</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">기본운임</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">경유운임</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">지역운임</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">오류사유</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewRows.map((row, index) => (
                        <tr key={row.id} className={`hover:bg-gray-50 ${row.status === 'error' ? 'bg-red-50' : ''}`}>
                          <td className="px-3 py-2">
                            <div className={`w-2 h-2 rounded-full ${row.status === 'valid' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500">{index + 1}</td>
                          <td className="px-3 py-2 text-sm">{row.centerName}</td>
                          <td className="px-3 py-2 text-sm">{row.vehicleType}</td>
                          <td className="px-3 py-2 text-sm">{row.region || '-'}</td>
                          <td className="px-3 py-2 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              row.fareType === '기본운임' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {row.fareType}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-right">₩{row.baseFare?.toLocaleString() || '0'}</td>
                          <td className="px-3 py-2 text-sm text-right">₩{row.extraStopFee?.toLocaleString() || '0'}</td>
                          <td className="px-3 py-2 text-sm text-right">₩{row.extraRegionFee?.toLocaleString() || '0'}</td>
                          <td className="px-3 py-2 text-xs text-red-600 max-w-32 truncate" title={row.errorMessage}>
                            {row.errorMessage || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {stats.invalid > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mr-3 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">검증 결과 오류가 발견되었습니다.</p>
                    <p>오류가 있는 행을 수정한 후 다시 업로드하거나, 유효한 데이터만 가져오기를 진행할 수 있습니다.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'import':
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">데이터 가져오기 중...</p>
              <p className="text-sm text-gray-500">잠시만 기다려주세요.</p>
              
              {uploadProgress > 0 && (
                <div className="mt-4 max-w-xs mx-auto">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{uploadProgress.toFixed(0)}%</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    가져오기 완료
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      {stats.valid}개의 센터요율이 성공적으로 등록되었습니다.
                      <button
                        onClick={handleSuccess}
                        className="ml-2 font-medium text-green-600 hover:text-green-800"
                      >
                        목록에서 확인하기
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderFooter = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="flex justify-between items-center w-full">
            <Button 
              variant="outline" 
              onClick={handleClose}
              size="lg"
              className="px-6 py-3 text-base"
            >
              취소
            </Button>
            <Button 
              onClick={validateFile}
              disabled={!file || isLoading}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-base font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  검증 중...
                </>
              ) : (
                <>
                  검증하기
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        )

      case 'validate':
        return (
          <div className="flex justify-between items-center w-full">
            <Button 
              variant="outline" 
              onClick={() => setStep('upload')}
              disabled={isLoading}
              size="lg"
              className="px-6 py-3 text-base"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              이전
            </Button>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleClose}
                size="lg"
                className="px-6 py-3 text-base"
              >
                취소
              </Button>
              <Button 
                onClick={importFile}
                disabled={stats.valid === 0 || isLoading}
                size="lg"
                className="bg-green-600 hover:bg-green-700 px-8 py-3 text-base font-medium"
              >
                가져오기
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 'import':
        return (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={isLoading}
              size="lg"
              className="px-6 py-3 text-base"
            >
              취소
            </Button>
          </div>
        )

      case 'complete':
        return (
          <div className="flex justify-between items-center w-full">
            <Button 
              variant="outline" 
              onClick={() => setStep('validate')}
              size="lg"
              className="px-6 py-3 text-base"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              이전
            </Button>
            <Button 
              onClick={handleSuccess} 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-base font-medium"
            >
              확인
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 space-y-3 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold flex items-center">
              <div className="w-5 h-5 mr-2">
                <Navigation className="h-5 w-5" />
              </div>
              <span>{config.title}</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 단계 표시 */}
          <div className="flex items-center justify-center space-x-3">
            {steps.map((stepItem, index) => {
              const isActive = step === stepItem.key
              const isCompleted = isStepCompleted(stepItem.key)
              
              return (
                <div key={stepItem.key} className="flex items-center">
                  <div className={cn(
                    "flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                    isActive ? "bg-blue-600 text-white" : 
                    isCompleted ? "bg-green-600 text-white" : 
                    "bg-gray-200 text-gray-600"
                  )}>
                    <div className="w-4 h-4">
                      {getStepIcon(stepItem.key, isActive, isCompleted)}
                    </div>
                    <span>{stepItem.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-8 h-0.5 mx-2",
                      index < getCurrentStepIndex() ? "bg-green-600" : "bg-gray-300"
                    )} />
                  )}
                </div>
              )
            })}
          </div>

          {/* 진행 상태 */}
          {previewRows.length > 0 && (
            <div className="flex items-center justify-center space-x-3 text-sm">
              <span className="text-gray-600">전체 <span className="font-semibold text-gray-900">{stats.total}</span></span>
              <span className="text-gray-300">|</span>
              <span className="text-green-600">유효 <span className="font-semibold text-green-700">{stats.valid}</span></span>
              {stats.invalid > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-red-600">오류 <span className="font-semibold text-red-700">{stats.invalid}</span></span>
                </>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-base text-red-800 font-medium">{error}</p>
            </div>
          )}
          
          {renderStepContent()}
        </div>

        <div className="flex-shrink-0 border-t bg-gray-50 px-6 py-4">
          {renderFooter()}
        </div>
      </DialogContent>
    </Dialog>
  )
}