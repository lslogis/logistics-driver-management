'use client'

import { useState, useCallback, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PricingOutput, QuoteRequestData } from '@/lib/services/pricing.service'
import { quoteService } from '@/lib/services/charter.service'
import { toast } from 'react-hot-toast'

interface OptimisticState {
  isCalculating: boolean
  result: PricingOutput | null
  error: string | null
  requestId: string | null
}

export function useOptimisticQuote() {
  const [optimisticState, setOptimisticState] = useState<OptimisticState>({
    isCalculating: false,
    result: null,
    error: null,
    requestId: null
  })
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const queryClient = useQueryClient()

  // 실제 API 요청
  const quoteMutation = useMutation({
    mutationFn: async (data: QuoteRequestData) => {
      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      // 새 요청을 위한 AbortController
      abortControllerRef.current = new AbortController()
      
      return quoteService.calculateQuote(data, {
        signal: abortControllerRef.current.signal
      })
    },
    onSuccess: (data, variables) => {
      setOptimisticState(prev => ({
        ...prev,
        isCalculating: false,
        result: data,
        error: null
      }))
      
      // 캐시에 결과 저장
      queryClient.setQueryData(['quote', variables], data)
    },
    onError: (error: any, variables) => {
      // Abort된 요청은 무시
      if (error.name === 'AbortError') return
      
      setOptimisticState(prev => ({
        ...prev,
        isCalculating: false,
        result: null,
        error: error.message || '요금 계산 중 오류가 발생했습니다'
      }))
    }
  })

  // Optimistic 계산 (즉시 피드백)
  const calculateOptimistic = useCallback((data: QuoteRequestData) => {
    const requestId = Date.now().toString()
    
    setOptimisticState({
      isCalculating: true,
      result: null,
      error: null,
      requestId
    })

    // 기본값으로 즉시 피드백 (실제 계산 전)
    const estimatedBase = getEstimatedBaseFare(data.vehicleType)
    const estimatedRegion = data.destinations.length * 50000 // 임시 추정값
    
    // 0.5초 후 추정값 표시
    setTimeout(() => {
      setOptimisticState(prev => {
        if (prev.requestId !== requestId) return prev // 새로운 요청이 있으면 무시
        
        return {
          ...prev,
          result: {
            baseFare: estimatedBase,
            regionFare: estimatedRegion,
            stopFare: data.destinations.length * 30000,
            totalFare: estimatedBase + estimatedRegion + (data.destinations.length * 30000),
            isEstimated: true // 추정값 표시
          } as PricingOutput & { isEstimated: boolean }
        }
      })
    }, 500)

    // 실제 계산 요청
    quoteMutation.mutate(data)
  }, [quoteMutation])

  // 계산 취소
  const cancelCalculation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setOptimisticState({
      isCalculating: false,
      result: null,
      error: null,
      requestId: null
    })
  }, [])

  return {
    ...optimisticState,
    calculateQuote: calculateOptimistic,
    cancelCalculation,
    isActuallyCalculating: quoteMutation.isPending
  }
}

// 차량 타입별 기본료 추정
function getEstimatedBaseFare(vehicleType: string): number {
  const baseFares: Record<string, number> = {
    'TRUCK_1TON': 120000,
    'TRUCK_2_5TON': 150000,
    'TRUCK_5TON': 200000,
    'TRUCK_8TON': 250000,
    'TRUCK_11TON': 300000,
    'TRUCK_15TON': 350000,
    'TRUCK_18TON': 400000,
    'TRUCK_25TON': 500000
  }
  
  return baseFares[vehicleType] || 150000
}