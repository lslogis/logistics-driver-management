import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiclesAPI } from '@/lib/api/vehicles'
import { CreateVehicleData, UpdateVehicleData, GetVehiclesQuery } from '@/lib/validations/vehicle'
import { toast } from 'react-hot-toast'

export function useVehicles(params: Partial<GetVehiclesQuery> = {}) {
  const defaultParams: GetVehiclesQuery = {
    page: 1,
    limit: 20,
    sortBy: 'plateNumber',
    sortOrder: 'asc',
    ...params
  }
  
  return useQuery({
    queryKey: ['vehicles', defaultParams],
    queryFn: () => vehiclesAPI.getVehicles(defaultParams),
    staleTime: 5 * 60 * 1000
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: vehiclesAPI.createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('차량이 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '등록 중 오류가 발생했습니다')
    }
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateVehicleData }) =>
      vehiclesAPI.updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('차량 정보가 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '수정 중 오류가 발생했습니다')
    }
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: vehiclesAPI.deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('차량이 비활성화되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '삭제 중 오류가 발생했습니다')
    }
  })
}

export function useAssignDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ vehicleId, driverId }: { vehicleId: string, driverId: string | null }) =>
      vehiclesAPI.assignDriver(vehicleId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('기사 배정이 변경되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message || '배정 중 오류가 발생했습니다')
    }
  })
}