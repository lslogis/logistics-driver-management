import { useState, useCallback } from 'react'
import { ImportType, ImportState, ImportStep } from '@/components/import/types'
import { ImportResult } from '@/lib/api/imports'
import { 
  useDriversImportWorkflow,
  useLoadingPointsImportWorkflow,
  useFixedContractsImportWorkflow,
  useVehiclesImportWorkflow,
  useRoutesImportWorkflow,
  useChartersImportWorkflow,
  useCenterFaresImportWorkflow
} from '@/hooks/useImports'

const INITIAL_STATE: ImportState = {
  step: 'upload',
  file: null,
  results: null,
  error: null,
  isLoading: false,
  uploadProgress: 0
}

export function useImportModal(type: ImportType) {
  const [state, setState] = useState<ImportState>(INITIAL_STATE)

  // 타입별 워크플로우 훅 선택
  const driversWorkflow = useDriversImportWorkflow()
  const loadingPointsWorkflow = useLoadingPointsImportWorkflow()
  const fixedContractsWorkflow = useFixedContractsImportWorkflow()
  const vehiclesWorkflow = useVehiclesImportWorkflow()
  const routesWorkflow = useRoutesImportWorkflow()
  const chartersWorkflow = useChartersImportWorkflow()
  const centerFaresWorkflow = useCenterFaresImportWorkflow()

  const getWorkflow = useCallback(() => {
    switch (type) {
      case 'drivers':
        return driversWorkflow
      case 'loading-points':
        return loadingPointsWorkflow
      case 'fixed-contracts':
        return fixedContractsWorkflow
      case 'vehicles':
        return vehiclesWorkflow
      case 'routes':
        return routesWorkflow
      case 'trips':
        return chartersWorkflow
      case 'center-fares':
        return centerFaresWorkflow
      default:
        throw new Error(`Unsupported import type: ${type}`)
    }
  }, [type, driversWorkflow, loadingPointsWorkflow, fixedContractsWorkflow, vehiclesWorkflow, routesWorkflow, chartersWorkflow, centerFaresWorkflow])

  // 파일 선택 처리
  const handleFileSelect = useCallback((file: File) => {
    setState(prev => ({
      ...prev,
      file,
      error: null,
      results: null
    }))
  }, [])

  // 다음 단계로 이동
  const goToNextStep = useCallback(() => {
    setState(prev => {
      const stepOrder: ImportStep[] = ['upload', 'validate', 'import', 'complete']
      const currentIndex = stepOrder.indexOf(prev.step)
      const nextStep = stepOrder[currentIndex + 1]
      
      return {
        ...prev,
        step: nextStep || prev.step
      }
    })
  }, [])

  // 이전 단계로 이동
  const goToPreviousStep = useCallback(() => {
    setState(prev => {
      const stepOrder: ImportStep[] = ['upload', 'validate', 'import', 'complete']
      const currentIndex = stepOrder.indexOf(prev.step)
      const prevStep = stepOrder[currentIndex - 1]
      
      return {
        ...prev,
        step: prevStep || prev.step,
        error: null
      }
    })
  }, [])

  // 특정 단계로 이동
  const goToStep = useCallback((step: ImportStep) => {
    setState(prev => ({
      ...prev,
      step,
      error: null
    }))
  }, [])

  // 검증 실행
  const validateFile = useCallback(async () => {
    if (!state.file) return

    const workflow = getWorkflow()
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      uploadProgress: 0
    }))

    try {
      // 프로그레스 시뮬레이션
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 10, 90)
        }))
      }, 200)

      const result = await workflow.validate(state.file)
      
      clearInterval(progressInterval)
      
      if (result) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          uploadProgress: 100,
          results: result.data.results,
          step: 'validate'
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        uploadProgress: 0,
        error: error instanceof Error ? error.message : '검증 중 오류가 발생했습니다.'
      }))
    }
  }, [state.file, getWorkflow])

  // 가져오기 실행
  const importFile = useCallback(async () => {
    if (!state.file) return

    const workflow = getWorkflow()
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      uploadProgress: 0
    }))

    try {
      // 프로그레스 시뮬레이션
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 8, 90)
        }))
      }, 300)

      const result = await workflow.importData(state.file)
      
      clearInterval(progressInterval)
      
      if (result) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          uploadProgress: 100,
          results: result.data.results,
          step: 'complete'
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        uploadProgress: 0,
        error: error instanceof Error ? error.message : '가져오기 중 오류가 발생했습니다.'
      }))
    }
  }, [state.file, getWorkflow])

  // 템플릿 다운로드
  const downloadTemplate = useCallback(() => {
    const workflow = getWorkflow()
    workflow.downloadTemplate()
  }, [getWorkflow])

  // 모달 초기화
  const resetModal = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  // 에러 클리어
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }))
  }, [])

  // 파일 제거
  const removeFile = useCallback(() => {
    setState(prev => ({
      ...prev,
      file: null,
      results: null,
      error: null,
      step: 'upload'
    }))
  }, [])

  return {
    // State
    state,
    
    // Actions
    handleFileSelect,
    validateFile,
    importFile,
    downloadTemplate,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    resetModal,
    clearError,
    removeFile,
    
    // Computed
    canProceedToValidation: state.file !== null && !state.isLoading,
    canProceedToImport: state.results !== null && state.results.valid > 0 && !state.isLoading,
    hasErrors: state.results !== null && state.results.invalid > 0,
    isComplete: state.step === 'complete' && state.results !== null && state.results.imported > 0
  }
}