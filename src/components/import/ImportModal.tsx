import React from 'react'
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
  Calendar
} from 'lucide-react'
import { ImportModalProps, getImportTypeConfig, isValidImportType } from './types'
import { FileDropZone } from './FileDropZone'
import { ImportResultsDisplay } from './ImportResultsDisplay'
import { useImportModal } from '@/hooks/useImportModal'
import { cn } from '@/lib/utils'

export function ImportModal({ isOpen, onClose, type, onSuccess }: ImportModalProps) {
  // Defensive: allow runtime strings outside of union by coercion to a safe type
  const safeType = isValidImportType(type as unknown as string) ? (type as any) : 'drivers'
  const config = getImportTypeConfig(safeType)
  const {
    state,
    handleFileSelect,
    validateFile,
    importFile,
    downloadTemplate,
    goToPreviousStep,
    resetModal,
    canProceedToValidation,
    canProceedToImport,
    hasErrors,
    isComplete
  } = useImportModal(type)

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess()
    }
    handleClose()
  }

  const getStepIcon = (step: string, isActive: boolean, isCompleted: boolean) => {
    const iconClass = cn(
      "h-4 w-4",
      isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
    )

    switch (step) {
      case 'upload':
        return <Upload className={iconClass} />
      case 'validate':
        return <FileText className={iconClass} />
      case 'import':
        return <Download className={iconClass} />
      case 'complete':
        return <CheckCircle2 className={iconClass} />
      default:
        return null
    }
  }

  const getTypeIcon = () => {
    const iconClass = "h-5 w-5"
    switch (config.icon) {
      case 'users':
        return <Users className={iconClass} />
      case 'map-pin':
        return <MapPin className={iconClass} />
      case 'route':
        return <Route className={iconClass} />
      case 'truck':
        return <Truck className={iconClass} />
      case 'navigation':
        return <Navigation className={iconClass} />
      case 'calendar':
        return <Calendar className={iconClass} />
      default:
        return <Users className={iconClass} />
    }
  }

  const steps = [
    { key: 'upload', label: '파일 업로드' },
    { key: 'validate', label: '검증' },
    { key: 'import', label: '가져오기' },
    { key: 'complete', label: '완료' }
  ]

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === state.step)
  }

  const isStepCompleted = (stepKey: string) => {
    const stepIndex = steps.findIndex(step => step.key === stepKey)
    const currentIndex = getCurrentStepIndex()
    return stepIndex < currentIndex || (stepKey === 'complete' && isComplete)
  }

  const renderStepContent = () => {
    switch (state.step) {
      case 'upload':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded mr-3">
                  {getTypeIcon()}
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
              isLoading={state.isLoading}
              progress={state.uploadProgress}
              error={state.error}
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
            {state.results && (
              <ImportResultsDisplay
                results={state.results}
                type={type}
              />
            )}
            
            {hasErrors && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex items-start">
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
              
              {state.uploadProgress > 0 && (
                <div className="mt-4 max-w-xs mx-auto">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${state.uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{state.uploadProgress.toFixed(0)}%</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="space-y-6">
            {state.results && (
              <ImportResultsDisplay
                results={state.results}
                type={type}
                onViewDetails={handleSuccess}
              />
            )}
          </div>
        )

      default:
        return null
    }
  }

  const renderFooter = () => {
    switch (state.step) {
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
              disabled={!canProceedToValidation}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-base font-medium"
            >
              검증하기
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )

      case 'validate':
        return (
          <div className="flex justify-between items-center w-full">
            <Button 
              variant="outline" 
              onClick={goToPreviousStep}
              disabled={state.isLoading}
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
                disabled={!canProceedToImport}
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
              disabled={state.isLoading}
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
              onClick={goToPreviousStep}
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
                {getTypeIcon()}
              </div>
              <span>{config.title}</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 단계 표시 - 컴팩트하게 */}
          <div className="flex items-center justify-center space-x-3">
            {steps.map((step, index) => {
              const isActive = state.step === step.key
              const isCompleted = isStepCompleted(step.key)
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={cn(
                    "flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                    isActive ? "bg-blue-600 text-white" : 
                    isCompleted ? "bg-green-600 text-white" : 
                    "bg-gray-200 text-gray-600"
                  )}>
                    <div className="w-4 h-4">
                      {getStepIcon(step.key, isActive, isCompleted)}
                    </div>
                    <span>{step.label}</span>
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

          {/* 진행 상태 - 컴팩트하게 */}
          {state.results && (
            <div className="flex items-center justify-center space-x-3 text-sm">
              <span className="text-gray-600">전체 <span className="font-semibold text-gray-900">{state.results.total}</span></span>
              <span className="text-gray-300">|</span>
              <span className="text-green-600">유효 <span className="font-semibold text-green-700">{state.results.valid}</span></span>
              {state.results.invalid > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-red-600">오류 <span className="font-semibold text-red-700">{state.results.invalid}</span></span>
                </>
              )}
              {state.results.imported > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-blue-600">완료 <span className="font-semibold text-blue-700">{state.results.imported}</span></span>
                </>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6">
          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-base text-red-800 font-medium">{state.error}</p>
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
