import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importsAPI, ImportResponse } from '@/lib/api/imports'
import { toast } from 'react-hot-toast'
import { useState, useCallback } from 'react'

export function useValidateDriversCSV() {
  return useMutation<ImportResponse, Error, File>({
    mutationFn: (file: File) => importsAPI.validateDriversCSV(file),
    onSuccess: (data) => {
      const results = data.data.results
      toast.success(`검증 완료: ${results.valid}개 유효, ${results.invalid}개 오류`)
    },
    onError: (error: Error) => {
      toast.error(`검증 실패: ${error.message}`)
    }
  })
}

export function useImportDriversCSV() {
  const queryClient = useQueryClient()
  
  return useMutation<ImportResponse, Error, File>({
    mutationFn: (file: File) => importsAPI.importDriversCSV(file),
    onSuccess: (data) => {
      const results = data.data.results
      toast.success(`가져오기 완료: ${results.imported}개 기사가 등록되었습니다`)
      // Invalidate drivers query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    },
    onError: (error: Error) => {
      toast.error(`가져오기 실패: ${error.message}`)
    }
  })
}

export function useValidateChartersCSV() {
  return useMutation<ImportResponse, Error, File>({
    mutationFn: (file: File) => importsAPI.validateChartersCSV(file),
    onSuccess: (data) => {
      const results = data.data.results
      toast.success(`검증 완료: ${results.valid}개 유효, ${results.invalid}개 오류`)
    },
    onError: (error: Error) => {
      toast.error(`검증 실패: ${error.message}`)
    }
  })
}

export function useImportChartersCSV() {
  const queryClient = useQueryClient()
  
  return useMutation<ImportResponse, Error, File>({
    mutationFn: (file: File) => importsAPI.importChartersCSV(file),
    onSuccess: (data) => {
      const results = data.data.results
      toast.success(`가져오기 완료: ${results.imported}개 용차가 등록되었습니다`)
      // Invalidate charters query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['charters'] })
    },
    onError: (error: Error) => {
      toast.error(`가져오기 실패: ${error.message}`)
    }
  })
}

export function useDownloadDriverTemplate() {
  return useMutation<Blob, Error, void>({
    mutationFn: () => importsAPI.downloadDriverTemplate(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '기사등록템플릿.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('템플릿 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`템플릿 다운로드 실패: ${error.message}`)
    }
  })
}

export function useDownloadCharterTemplate() {
  return useMutation<Blob, Error, void>({
    mutationFn: () => importsAPI.downloadCharterTemplate(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '용차등록템플릿.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('템플릿 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`템플릿 다운로드 실패: ${error.message}`)
    }
  })
}

// File upload progress tracking hook
export function useFileUploadProgress() {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const resetProgress = useCallback(() => {
    setProgress(0)
    setIsUploading(false)
    setUploadError(null)
  }, [])

  const simulateProgress = useCallback(() => {
    setIsUploading(true)
    setUploadError(null)
    setProgress(0)

    // Simulate file upload progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90 // Stop at 90% until actual completion
        }
        return prev + Math.random() * 15
      })
    }, 200)

    return () => {
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => setIsUploading(false), 500)
    }
  }, [])

  const completeProgress = useCallback(() => {
    setProgress(100)
    setTimeout(() => setIsUploading(false), 500)
  }, [])

  const setError = useCallback((error: string) => {
    setUploadError(error)
    setIsUploading(false)
    setProgress(0)
  }, [])

  return {
    progress,
    isUploading,
    uploadError,
    resetProgress,
    simulateProgress,
    completeProgress,
    setError
  }
}

// File validation hook
export function useFileValidation() {
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file type - support CSV and Excel files
    const fileName = file.name.toLowerCase()
    const supportedExtensions = ['.csv', '.xlsx', '.xls']
    const supportedMimeTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    
    const hasValidExtension = supportedExtensions.some(ext => fileName.endsWith(ext))
    const hasValidMimeType = supportedMimeTypes.includes(file.type)
    
    if (!hasValidExtension && !hasValidMimeType) {
      return { isValid: false, error: 'CSV 또는 Excel 파일만 업로드 가능합니다 (.csv, .xlsx, .xls)' }
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      return { isValid: false, error: '파일 크기는 10MB 이하여야 합니다.' }
    }

    // Check if file is empty
    if (file.size === 0) {
      return { isValid: false, error: '빈 파일은 업로드할 수 없습니다.' }
    }

    return { isValid: true }
  }, [])

  const getFileFormat = useCallback((file: File): string => {
    const fileName = file.name.toLowerCase()
    if (fileName.endsWith('.xlsx')) return 'Excel (.xlsx)'
    if (fileName.endsWith('.xls')) return 'Excel (.xls)'
    if (fileName.endsWith('.csv')) return 'CSV'
    return 'Unknown'
  }, [])

  return { validateFile, getFileFormat }
}

// Enhanced import workflow hooks that combine progress tracking
export function useDriversImportWorkflow() {
  const validateMutation = useValidateDriversCSV()
  const importMutation = useImportDriversCSV()
  const downloadTemplateMutation = useDownloadDriverTemplate()
  const { progress, isUploading, uploadError, resetProgress, simulateProgress, completeProgress, setError } = useFileUploadProgress()
  const { validateFile } = useFileValidation()

  const validate = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return null
    }

    const cleanup = simulateProgress()
    try {
      const result = await validateMutation.mutateAsync(file)
      completeProgress()
      cleanup()
      return result
    } catch (error) {
      cleanup()
      setError(error instanceof Error ? error.message : '검증 중 오류가 발생했습니다')
      throw error
    }
  }, [validateMutation, validateFile, simulateProgress, completeProgress, setError])

  const importData = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return null
    }

    const cleanup = simulateProgress()
    try {
      const result = await importMutation.mutateAsync(file)
      completeProgress()
      cleanup()
      return result
    } catch (error) {
      cleanup()
      setError(error instanceof Error ? error.message : '가져오기 중 오류가 발생했습니다')
      throw error
    }
  }, [importMutation, validateFile, simulateProgress, completeProgress, setError])

  return {
    validate,
    importData,
    downloadTemplate: () => downloadTemplateMutation.mutate(),
    isLoading: validateMutation.isPending || importMutation.isPending || downloadTemplateMutation.isPending,
    progress,
    isUploading,
    uploadError,
    resetProgress
  }
}

export function useChartersImportWorkflow() {
  const validateMutation = useValidateChartersCSV()
  const importMutation = useImportChartersCSV()
  const downloadTemplateMutation = useDownloadCharterTemplate()
  const { progress, isUploading, uploadError, resetProgress, simulateProgress, completeProgress, setError } = useFileUploadProgress()
  const { validateFile } = useFileValidation()

  const validate = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return null
    }

    const cleanup = simulateProgress()
    try {
      const result = await validateMutation.mutateAsync(file)
      completeProgress()
      cleanup()
      return result
    } catch (error) {
      cleanup()
      setError(error instanceof Error ? error.message : '검증 중 오류가 발생했습니다')
      throw error
    }
  }, [validateMutation, validateFile, simulateProgress, completeProgress, setError])

  const importData = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return null
    }

    const cleanup = simulateProgress()
    try {
      const result = await importMutation.mutateAsync(file)
      completeProgress()
      cleanup()
      return result
    } catch (error) {
      cleanup()
      setError(error instanceof Error ? error.message : '가져오기 중 오류가 발생했습니다')
      throw error
    }
  }, [importMutation, validateFile, simulateProgress, completeProgress, setError])

  return {
    validate,
    importData,
    downloadTemplate: () => downloadTemplateMutation.mutate(),
    isLoading: validateMutation.isPending || importMutation.isPending || downloadTemplateMutation.isPending,
    progress,
    isUploading,
    uploadError,
    resetProgress
  }
}

// Vehicles import hooks
export function useValidateVehiclesCSV() {
  return useMutation<ImportResponse, Error, File>({
    mutationFn: (file: File) => importsAPI.validateVehiclesCSV(file),
    onSuccess: (data) => {
      const results = data.data.results
      toast.success(`검증 완료: ${results.valid}개 유효, ${results.invalid}개 오류`)
    },
    onError: (error: Error) => {
      toast.error(`검증 실패: ${error.message}`)
    }
  })
}

export function useImportVehiclesCSV() {
  const queryClient = useQueryClient()
  
  return useMutation<ImportResponse, Error, File>({
    mutationFn: (file: File) => importsAPI.importVehiclesCSV(file),
    onSuccess: (data) => {
      const results = data.data.results
      toast.success(`가져오기 완료: ${results.imported}개 차량이 등록되었습니다`)
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: (error: Error) => {
      toast.error(`가져오기 실패: ${error.message}`)
    }
  })
}

export function useDownloadVehicleTemplate() {
  return useMutation<Blob, Error, void>({
    mutationFn: () => importsAPI.downloadVehicleTemplate(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '차량등록템플릿.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('템플릿 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`템플릿 다운로드 실패: ${error.message}`)
    }
  })
}

// Routes import hooks
export function useValidateRoutesCSV() {
  return useMutation<ImportResponse, Error, File>({
    mutationFn: (file: File) => importsAPI.validateRoutesCSV(file),
    onSuccess: (data) => {
      const results = data.data.results
      toast.success(`검증 완료: ${results.valid}개 유효, ${results.invalid}개 오류`)
    },
    onError: (error: Error) => {
      toast.error(`검증 실패: ${error.message}`)
    }
  })
}

export function useImportRoutesCSV() {
  const queryClient = useQueryClient()
  
  return useMutation<ImportResponse, Error, File>({
    mutationFn: (file: File) => importsAPI.importRoutesCSV(file),
    onSuccess: (data) => {
      const results = data.data.results
      toast.success(`가져오기 완료: ${results.imported}개 노선템플릿이 등록되었습니다`)
      queryClient.invalidateQueries({ queryKey: ['routes'] })
    },
    onError: (error: Error) => {
      toast.error(`가져오기 실패: ${error.message}`)
    }
  })
}

export function useDownloadRouteTemplate() {
  return useMutation<Blob, Error, void>({
    mutationFn: () => importsAPI.downloadRouteTemplate(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '노선템플릿등록템플릿.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('템플릿 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`템플릿 다운로드 실패: ${error.message}`)
    }
  })
}

// Export hooks
export function useExportDrivers() {
  return useMutation<void, Error, 'excel' | 'csv'>({
    mutationFn: (format: 'excel' | 'csv') => importsAPI.exportDrivers(format),
    onSuccess: () => {
      toast.success('기사 목록 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`다운로드 실패: ${error.message}`)
    }
  })
}

export function useExportVehicles() {
  return useMutation<void, Error, 'excel' | 'csv'>({
    mutationFn: (format: 'excel' | 'csv') => importsAPI.exportVehicles(format),
    onSuccess: () => {
      toast.success('차량 목록 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`다운로드 실패: ${error.message}`)
    }
  })
}

export function useExportRoutes() {
  return useMutation<void, Error, 'excel' | 'csv'>({
    mutationFn: (format: 'excel' | 'csv') => importsAPI.exportRoutes(format),
    onSuccess: () => {
      toast.success('노선 목록 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`다운로드 실패: ${error.message}`)
    }
  })
}

export function useExportTrips() {
  return useMutation<void, Error, 'excel' | 'csv'>({
    mutationFn: (format: 'excel' | 'csv') => importsAPI.exportTrips(format),
    onSuccess: () => {
      toast.success('운행 목록 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`다운로드 실패: ${error.message}`)
    }
  })
}

export function useExportSettlements() {
  return useMutation<void, Error, { year?: number; month?: number; driverId?: string }>({
    mutationFn: (params: { year?: number; month?: number; driverId?: string }) => importsAPI.exportSettlements(params),
    onSuccess: () => {
      toast.success('정산 내역 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`다운로드 실패: ${error.message}`)
    }
  })
}

// Vehicles import workflow
export function useVehiclesImportWorkflow() {
  const validateMutation = useValidateVehiclesCSV()
  const importMutation = useImportVehiclesCSV()
  const downloadTemplateMutation = useDownloadVehicleTemplate()
  const { progress, isUploading, uploadError, resetProgress, simulateProgress, completeProgress, setError } = useFileUploadProgress()
  const { validateFile } = useFileValidation()

  const validate = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return null
    }

    const cleanup = simulateProgress()
    try {
      const result = await validateMutation.mutateAsync(file)
      completeProgress()
      cleanup()
      return result
    } catch (error) {
      cleanup()
      setError(error instanceof Error ? error.message : '검증 중 오류가 발생했습니다')
      throw error
    }
  }, [validateMutation, validateFile, simulateProgress, completeProgress, setError])

  const importData = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return null
    }

    const cleanup = simulateProgress()
    try {
      const result = await importMutation.mutateAsync(file)
      completeProgress()
      cleanup()
      return result
    } catch (error) {
      cleanup()
      setError(error instanceof Error ? error.message : '가져오기 중 오류가 발생했습니다')
      throw error
    }
  }, [importMutation, validateFile, simulateProgress, completeProgress, setError])

  return {
    validate,
    importData,
    downloadTemplate: () => downloadTemplateMutation.mutate(),
    isLoading: validateMutation.isPending || importMutation.isPending || downloadTemplateMutation.isPending,
    progress,
    isUploading,
    uploadError,
    resetProgress
  }
}

// Routes import workflow
export function useRoutesImportWorkflow() {
  const validateMutation = useValidateRoutesCSV()
  const importMutation = useImportRoutesCSV()
  const downloadTemplateMutation = useDownloadRouteTemplate()
  const { progress, isUploading, uploadError, resetProgress, simulateProgress, completeProgress, setError } = useFileUploadProgress()
  const { validateFile } = useFileValidation()

  const validate = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return null
    }

    const cleanup = simulateProgress()
    try {
      const result = await validateMutation.mutateAsync(file)
      completeProgress()
      cleanup()
      return result
    } catch (error) {
      cleanup()
      setError(error instanceof Error ? error.message : '검증 중 오류가 발생했습니다')
      throw error
    }
  }, [validateMutation, validateFile, simulateProgress, completeProgress, setError])

  const importData = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return null
    }

    const cleanup = simulateProgress()
    try {
      const result = await importMutation.mutateAsync(file)
      completeProgress()
      cleanup()
      return result
    } catch (error) {
      cleanup()
      setError(error instanceof Error ? error.message : '가져오기 중 오류가 발생했습니다')
      throw error
    }
  }, [importMutation, validateFile, simulateProgress, completeProgress, setError])

  return {
    validate,
    importData,
    downloadTemplate: () => downloadTemplateMutation.mutate(),
    isLoading: validateMutation.isPending || importMutation.isPending || downloadTemplateMutation.isPending,
    progress,
    isUploading,
    uploadError,
    resetProgress
  }
}

// Loading Points import hooks
export function useValidateLoadingPointsCSV() {
  return useMutation<ImportResponse, Error, File>({
    mutationFn: (file: File) => importsAPI.validateLoadingPointsCSV(file),
    onSuccess: (data) => {
      const results = data.data.results
      toast.success(`검증 완료: ${results.valid}개 유효, ${results.invalid}개 오류`)
    },
    onError: (error: Error) => {
      toast.error(`검증 실패: ${error.message}`)
    }
  })
}

export function useImportLoadingPointsCSV() {
  const queryClient = useQueryClient()
  
  return useMutation<ImportResponse, Error, File>({
    mutationFn: (file: File) => importsAPI.importLoadingPointsCSV(file),
    onSuccess: (data) => {
      const results = data.data.results
      toast.success(`가져오기 완료: ${results.imported}개 상차지가 등록되었습니다`)
      queryClient.invalidateQueries({ queryKey: ['loading-points'] })
    },
    onError: (error: Error) => {
      toast.error(`가져오기 실패: ${error.message}`)
    }
  })
}

export function useDownloadLoadingPointTemplate() {
  return useMutation<Blob, Error, void>({
    mutationFn: () => importsAPI.downloadLoadingPointTemplate(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '상차지등록템플릿.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('템플릿 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`템플릿 다운로드 실패: ${error.message}`)
    }
  })
}

// Loading Points import workflow
export function useLoadingPointsImportWorkflow() {
  const validateMutation = useValidateLoadingPointsCSV()
  const importMutation = useImportLoadingPointsCSV()
  const downloadTemplateMutation = useDownloadLoadingPointTemplate()
  const { progress, isUploading, uploadError, resetProgress, simulateProgress, completeProgress, setError } = useFileUploadProgress()
  const { validateFile } = useFileValidation()

  const validate = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return null
    }

    const cleanup = simulateProgress()
    try {
      const result = await validateMutation.mutateAsync(file)
      completeProgress()
      cleanup()
      return result
    } catch (error) {
      cleanup()
      setError(error instanceof Error ? error.message : '검증 중 오류가 발생했습니다')
      throw error
    }
  }, [validateMutation, validateFile, simulateProgress, completeProgress, setError])

  const importData = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return null
    }

    const cleanup = simulateProgress()
    try {
      const result = await importMutation.mutateAsync(file)
      completeProgress()
      cleanup()
      return result
    } catch (error) {
      cleanup()
      setError(error instanceof Error ? error.message : '가져오기 중 오류가 발생했습니다')
      throw error
    }
  }, [importMutation, validateFile, simulateProgress, completeProgress, setError])

  return {
    validate,
    importData,
    downloadTemplate: () => downloadTemplateMutation.mutate(),
    isLoading: validateMutation.isPending || importMutation.isPending || downloadTemplateMutation.isPending,
    progress,
    isUploading,
    uploadError,
    resetProgress
  }
}

// Fixed Contracts import hooks
export function useValidateFixedContractsCSV() {
  return useMutation<ImportResponse, Error, File>({
    mutationFn: (file: File) => importsAPI.validateFixedContractsCSV(file),
    onSuccess: (data) => {
      const results = data.data.results
      toast.success(`검증 완료: ${results.valid}개 유효, ${results.invalid}개 오류`)
    },
    onError: (error: Error) => {
      toast.error(`검증 실패: ${error.message}`)
    }
  })
}

export function useImportFixedContractsCSV() {
  const queryClient = useQueryClient()
  
  return useMutation<ImportResponse, Error, File>({
    mutationFn: (file: File) => importsAPI.importFixedContractsCSV(file),
    onSuccess: (data) => {
      const results = data.data.results
      toast.success(`가져오기 완료: ${results.imported}개 고정계약이 등록되었습니다`)
      queryClient.invalidateQueries({ queryKey: ['fixed-contracts'] })
    },
    onError: (error: Error) => {
      toast.error(`가져오기 실패: ${error.message}`)
    }
  })
}

export function useDownloadFixedContractTemplate() {
  return useMutation<Blob, Error, void>({
    mutationFn: () => importsAPI.downloadFixedContractTemplate(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '고정계약등록템플릿.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('템플릿 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error(`템플릿 다운로드 실패: ${error.message}`)
    }
  })
}

// Fixed Contracts import workflow
export function useFixedContractsImportWorkflow() {
  const validateMutation = useValidateFixedContractsCSV()
  const importMutation = useImportFixedContractsCSV()
  const downloadTemplateMutation = useDownloadFixedContractTemplate()
  const { progress, isUploading, uploadError, resetProgress, simulateProgress, completeProgress, setError } = useFileUploadProgress()
  const { validateFile } = useFileValidation()

  const validate = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return null
    }

    const cleanup = simulateProgress()
    try {
      const result = await validateMutation.mutateAsync(file)
      completeProgress()
      cleanup()
      return result
    } catch (error) {
      cleanup()
      setError(error instanceof Error ? error.message : '검증 중 오류가 발생했습니다')
      throw error
    }
  }, [validateMutation, validateFile, simulateProgress, completeProgress, setError])

  const importData = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error!)
      return null
    }

    const cleanup = simulateProgress()
    try {
      const result = await importMutation.mutateAsync(file)
      completeProgress()
      cleanup()
      return result
    } catch (error) {
      cleanup()
      setError(error instanceof Error ? error.message : '가져오기 중 오류가 발생했습니다')
      throw error
    }
  }, [importMutation, validateFile, simulateProgress, completeProgress, setError])

  return {
    validate,
    importData,
    downloadTemplate: () => downloadTemplateMutation.mutate(),
    isLoading: validateMutation.isPending || importMutation.isPending || downloadTemplateMutation.isPending,
    progress,
    isUploading,
    uploadError,
    resetProgress
  }
}