import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { routesAPI } from '@/lib/api/routes'
import { CreateRouteData, UpdateRouteData, GetRoutesQuery } from '@/lib/validations/route'
import { toast } from 'react-hot-toast'

export function useRoutes(params: Partial<GetRoutesQuery> = {}) {
  const defaultParams: GetRoutesQuery = {
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'asc',
    ...params
  }
  
  return useQuery({
    queryKey: ['routes', defaultParams],
    queryFn: () => routesAPI.getRoutes(defaultParams),
    staleTime: 5 * 60 * 1000
  })
}

export function useCreateRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: routesAPI.createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      toast.success('노선이 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '등록 중 오류가 발생했습니다')
    }
  })
}

export function useUpdateRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateRouteData }) =>
      routesAPI.updateRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      toast.success('노선 정보가 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '수정 중 오류가 발생했습니다')
    }
  })
}

export function useDeleteRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: routesAPI.deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      toast.success('노선이 비활성화되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '삭제 중 오류가 발생했습니다')
    }
  })
}

export function useAssignRouteDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ routeId, driverId }: { routeId: string, driverId: string | null }) =>
      routesAPI.assignDriver(routeId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      toast.success('기사 배정이 변경되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '배정 중 오류가 발생했습니다')
    }
  })
}

export function useToggleRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: routesAPI.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      toast.success('노선 상태가 변경되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '상태 변경 중 오류가 발생했습니다')
    }
  })
}

export function useSearchRoutes(query: string) {
  return useQuery({
    queryKey: ['routes', 'search', query],
    queryFn: () => routesAPI.searchRoutes(query),
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000
  })
}

export function useWeekdayRoutes(weekday: number) {
  return useQuery({
    queryKey: ['routes', 'weekday', weekday],
    queryFn: () => routesAPI.getWeekdayRoutes(weekday),
    enabled: weekday >= 0 && weekday <= 6,
    staleTime: 5 * 60 * 1000
  })
}