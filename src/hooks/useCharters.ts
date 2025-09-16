import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { chartersAPI } from '@/lib/api/charters'
import { CreateCharterRequestData, UpdateCharterRequestData, GetCharterRequestsQuery } from '@/lib/services/charter.service'
import { PricingInput } from '@/lib/services/pricing.service'
import { toast } from 'react-hot-toast'

export function useCharters(params: Omit<Partial<GetCharterRequestsQuery>, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['charters', 'infinite', params],
    queryFn: ({ pageParam = 1 }) => 
      chartersAPI.getCharters({ 
        page: pageParam, 
        limit: 20, 
        sortBy: 'createdAt', 
        sortOrder: 'desc', 
        ...params 
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000
  })
}

// Paginated query for list view
export function useChartersPaginated(params: GetCharterRequestsQuery = {}) {
  return useQuery({
    queryKey: ['charters', 'paginated', params],
    queryFn: () => chartersAPI.getCharters({ 
      page: 1, 
      limit: 20, 
      sortBy: 'createdAt', 
      sortOrder: 'desc', 
      ...params 
    }),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

// Quote functionality
export function useQuote() {
  return useMutation({
    mutationFn: (input: PricingInput) => chartersAPI.getQuote(input),
    onError: (error: Error) => {
      console.error('Quote error:', error)
      // Don't show toast here - let the component handle it
    }
  })
}

// Center fare creation
export function useCreateCenterFare() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: chartersAPI.createCenterFare,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-fares'] })
      // Don't show toast here - let the modal handle it
    },
    onError: (error: Error) => {
      // Don't show toast here - let the modal handle it
    }
  })
}

export function useCreateCharter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: chartersAPI.createCharter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charters'] })
      toast.success('용차가 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '등록 중 오류가 발생했습니다')
    }
  })
}

export function useUpdateCharter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateCharterRequestData }) =>
      chartersAPI.updateCharter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charters'] })
      toast.success('용차 정보가 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '수정 중 오류가 발생했습니다')
    }
  })
}

export function useDeleteCharter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: chartersAPI.deleteCharter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charters'] })
      toast.success('용차가 삭제되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '삭제 중 오류가 발생했습니다')
    }
  })
}

export function useUpdateCharterStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { 
      id: string, 
      data: {
        status: 'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE'
        absenceReason?: string
        substituteDriverId?: string
        substituteFare?: number
        deductionAmount?: number
        remarks?: string
      }
    }) => chartersAPI.updateCharterStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['charters'] })
      const statusNames = {
        COMPLETED: '완료',
        ABSENCE: '결행',
        SUBSTITUTE: '대차'
      }
      toast.success(`용차 상태가 ${statusNames[variables.data.status]}로 변경되었습니다`)
    },
    onError: (error: Error) => {
      toast.error(error.message || '상태 변경 중 오류가 발생했습니다')
    }
  })
}

export function useCompleteCharter() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: chartersAPI.completeCharter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charters'] })
      toast.success('용차가 완료되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '완료 처리 중 오류가 발생했습니다')
    }
  })
}

export function useChartersByDriver(driverId: string, params: { dateFrom?: string; dateTo?: string } = {}) {
  return useQuery({
    queryKey: ['charters', 'driver', driverId, params],
    queryFn: () => chartersAPI.getChartersByDriver(driverId, params),
    enabled: !!driverId,
    staleTime: 5 * 60 * 1000
  })
}

export function useCharterStats(params: { dateFrom?: string; dateTo?: string } = {}) {
  return useQuery({
    queryKey: ['charters', 'stats', params],
    queryFn: () => chartersAPI.getCharterStats(params),
    staleTime: 5 * 60 * 1000
  })
}

export function useExportCharters() {
  return useMutation({
    mutationFn: (format: 'csv' | 'excel') => 
      chartersAPI.exportCharters(format),
    onSuccess: () => {
      toast.success('내보내기가 완료되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '내보내기 중 오류가 발생했습니다')
    }
  })
}

export function useCharterById(id: string) {
  return useQuery({
    queryKey: ['charters', 'detail', id],
    queryFn: () => chartersAPI.getCharterById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000
  })
}

// Compatibility aliases for easier transition from trips
export const useTrips = useCharters
export const useCreateTrip = useCreateCharter
export const useUpdateTrip = useUpdateCharter
export const useDeleteTrip = useDeleteCharter
export const useUpdateTripStatus = useUpdateCharterStatus
export const useCompleteTrip = useCompleteCharter
export const useTripsByDriver = useChartersByDriver
export const useTripStats = useCharterStats
export const useExportTrips = useExportCharters