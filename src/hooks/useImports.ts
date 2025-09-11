import { useMutation } from '@tanstack/react-query'
import { importsAPI } from '@/lib/api/imports'
import { toast } from 'react-hot-toast'

export function useValidateDriversCSV() {
  return useMutation({
    mutationFn: importsAPI.validateDriversCSV,
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export function useImportDriversCSV() {
  return useMutation({
    mutationFn: importsAPI.importDriversCSV,
    onSuccess: (data) => {
      toast.success(data.data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export function useValidateTripsCSV() {
  return useMutation({
    mutationFn: importsAPI.validateTripsCSV,
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export function useImportTripsCSV() {
  return useMutation({
    mutationFn: importsAPI.importTripsCSV,
    onSuccess: (data) => {
      toast.success(data.data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export function useDownloadDriverTemplate() {
  return useMutation({
    mutationFn: importsAPI.downloadDriverTemplate,
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
      toast.error('템플릿 다운로드 중 오류가 발생했습니다')
    }
  })
}

export function useDownloadTripTemplate() {
  return useMutation({
    mutationFn: importsAPI.downloadTripTemplate,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '운행등록템플릿.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('템플릿 다운로드 완료')
    },
    onError: (error: Error) => {
      toast.error('템플릿 다운로드 중 오류가 발생했습니다')
    }
  })
}