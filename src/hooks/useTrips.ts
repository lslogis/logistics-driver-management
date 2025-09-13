import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { tripsAPI } from '@/lib/api/trips'
import { CreateTripData, UpdateTripData, GetTripsQuery } from '@/lib/validations/trip'
import { toast } from 'react-hot-toast'

export function useTrips(params: Omit<Partial<GetTripsQuery>, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['trips', 'infinite', params],
    queryFn: ({ pageParam = 1 }) => 
      tripsAPI.getTrips({ 
        page: pageParam, 
        limit: 20, 
        sortBy: 'date', 
        sortOrder: 'desc', 
        ...params 
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: tripsAPI.createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('운행이 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '등록 중 오류가 발생했습니다')
    }
  })
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateTripData }) =>
      tripsAPI.updateTrip(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('운행 정보가 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '수정 중 오류가 발생했습니다')
    }
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: tripsAPI.deleteTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('운행이 삭제되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '삭제 중 오류가 발생했습니다')
    }
  })
}

export function useUpdateTripStatus() {
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
    }) => tripsAPI.updateTripStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      const statusNames = {
        COMPLETED: '완료',
        ABSENCE: '결행',
        SUBSTITUTE: '대차'
      }
      toast.success(`운행 상태가 ${statusNames[variables.data.status]}로 변경되었습니다`)
    },
    onError: (error: Error) => {
      toast.error(error.message || '상태 변경 중 오류가 발생했습니다')
    }
  })
}

export function useCompleteTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: tripsAPI.completeTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      toast.success('운행이 완료되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '완료 처리 중 오류가 발생했습니다')
    }
  })
}

export function useTripsByDriver(driverId: string, params: { dateFrom?: string; dateTo?: string } = {}) {
  return useQuery({
    queryKey: ['trips', 'driver', driverId, params],
    queryFn: () => tripsAPI.getTripsByDriver(driverId, params),
    enabled: !!driverId,
    staleTime: 5 * 60 * 1000
  })
}

export function useTripStats(params: { dateFrom?: string; dateTo?: string } = {}) {
  return useQuery({
    queryKey: ['trips', 'stats', params],
    queryFn: () => tripsAPI.getTripStats(params),
    staleTime: 5 * 60 * 1000
  })
}

export function useExportTrips() {
  return useMutation({
    mutationFn: (format: 'csv' | 'excel') => 
      tripsAPI.exportTrips(format),
    onSuccess: () => {
      toast.success('내보내기가 완료되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '내보내기 중 오류가 발생했습니다')
    }
  })
}