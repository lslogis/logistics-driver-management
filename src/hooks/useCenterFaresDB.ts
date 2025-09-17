import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { centerFareApi, type CreateCenterFareDto, type UpdateCenterFareDto } from '@/lib/api/center-fares-api'
import { toast } from 'react-hot-toast'

export function useCenterFaresDB(filters?: {
  centerId?: string
  vehicleType?: string
  fareType?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['center-fares', filters],
    queryFn: () => centerFareApi.list(filters),
    staleTime: 30000, // 30 seconds
  })
}

export function useCreateCenterFare() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateCenterFareDto) => centerFareApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-fares'] })
      toast.success('요율이 등록되었습니다')
    },
    onError: (error: Error) => {
      if (error.message === 'DUPLICATE') {
        toast.error('이미 존재하는 요율입니다')
      } else {
        toast.error('등록에 실패했습니다')
      }
    }
  })
}

export function useUpdateCenterFare() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateCenterFareDto }) => 
      centerFareApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-fares'] })
      toast.success('요율이 수정되었습니다')
    },
    onError: () => {
      toast.error('수정에 실패했습니다')
    }
  })
}

export function useDeleteCenterFare() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => centerFareApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-fares'] })
      toast.success('요율이 삭제되었습니다')
    },
    onError: () => {
      toast.error('삭제에 실패했습니다')
    }
  })
}

export function useImportCenterFares() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (file: File) => centerFareApi.import(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['center-fares'] })
      if (data.errors.length > 0) {
        toast.error(`${data.imported}건 가져오기 완료, ${data.errors.length}건 오류`)
      } else {
        toast.success(`${data.imported}건 가져오기 완료`)
      }
    },
    onError: () => {
      toast.error('가져오기에 실패했습니다')
    }
  })
}

export function useExportCenterFares() {
  return useMutation({
    mutationFn: (filters?: any) => centerFareApi.export(filters),
    onSuccess: (blob) => {
      // 다운로드
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `center-fares_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('내보내기 완료')
    },
    onError: () => {
      toast.error('내보내기에 실패했습니다')
    }
  })
}

export function useCalculateFare() {
  return useMutation({
    mutationFn: (params: {
      centerId: string
      vehicleType: string
      regions: string[]
      stopCount: number
    }) => centerFareApi.calculateFare(params),
    onError: () => {
      toast.error('요율 계산에 실패했습니다')
    }
  })
}