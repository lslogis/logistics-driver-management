import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SettlementsListResponse, PreviewSettlementData } from '@/lib/validations/settlement'
import { settlementsAPI, GetSettlementsQuery } from '@/lib/api/settlements'
import { toast } from 'react-hot-toast'

// 정산 목록 조회
export function useSettlements(search?: string, yearMonth?: string, driverId?: string, status?: string, page = 1, limit = 20) {
  const query: GetSettlementsQuery = {
    page,
    limit,
    search: search || undefined,
    yearMonth: yearMonth || undefined,
    driverId: driverId || undefined,
    status: status || undefined
  }

  return useQuery({
    queryKey: ['settlements', query],
    queryFn: () => settlementsAPI.getSettlements(query),
    staleTime: 30000, // 30초 동안 fresh
    retry: 2
  })
}

// 정산 미리보기
export function usePreviewSettlement() {
  return useMutation({
    mutationFn: settlementsAPI.previewSettlement,
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 정산 확정
export function useFinalizeSettlement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: settlementsAPI.finalizeSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      toast.success('정산이 확정되었습니다 (월락)')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 정산 엑셀 내보내기
export function useExportSettlements() {
  return useMutation({
    mutationFn: settlementsAPI.exportSettlements,
    onSuccess: (data) => {
      if (data instanceof Blob) {
        // 실제 파일 다운로드
        const url = URL.createObjectURL(data)
        const link = document.createElement('a')
        link.href = url
        link.download = `settlements_${new Date().toISOString().slice(0, 7)}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('정산 내보내기 완료')
      } else {
        toast('Excel export 기능은 아직 구현되지 않았습니다 (스텁)', { icon: 'ℹ️' })
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 정산 생성
export function useCreateSettlement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: settlementsAPI.createSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      toast.success('정산이 생성되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 정산 수정
export function useUpdateSettlement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: { remarks?: string } }) =>
      settlementsAPI.updateSettlement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      toast.success('정산이 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 정산 삭제
export function useDeleteSettlement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: settlementsAPI.deleteSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      toast.success('정산이 삭제되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 정산 확정 (개별)
export function useConfirmSettlement() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: { paidAt?: string } }) =>
      settlementsAPI.confirmSettlement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      toast.success('정산이 확정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 정산 지급 완료 처리
export function useMarkSettlementAsPaid() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: { paidAt?: string; remarks?: string } }) =>
      settlementsAPI.markAsPaid(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      toast.success('정산이 지급완료로 처리되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}