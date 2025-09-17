import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

export interface Center {
  id: string
  name: string
  code?: string
}

// 기본 센터 목록 (API 실패시 fallback)
const DEFAULT_CENTERS: Center[] = [
  { id: 'center-1', name: '쿠팡', code: 'CP' },
  { id: 'center-2', name: 'CJ대한통운', code: 'CJ' },
  { id: 'center-3', name: '롯데글로벌로지스', code: 'LG' },
  { id: 'center-4', name: '현대글로비스', code: 'HG' },
  { id: 'center-5', name: '한진', code: 'HJ' },
  { id: 'center-6', name: '기타', code: 'ETC' }
]

export function useCenters() {
  // loading-points API에서 센터명 목록 추출
  const { data: loadingPointsData, isLoading, error } = useQuery({
    queryKey: ['centers-from-loading-points'],
    queryFn: async () => {
      const response = await fetch('/api/loading-points?limit=1000')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch loading points')
      }
      
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5분 동안 fresh
    retry: 2
  })

  const centers = useMemo(() => {
    if (!loadingPointsData?.items) {
      return DEFAULT_CENTERS.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    }
    
    // 중복 제거하여 고유한 센터명 추출
    const uniqueCenterNames = Array.from(
      new Set(loadingPointsData.items.map((item: any) => item.centerName).filter(Boolean))
    )
    
    // Center 객체로 변환하고 가나다순 정렬
    const centersFromApi = uniqueCenterNames
      .map((name: string, index: number) => ({
        id: `center-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name: name
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    
    return centersFromApi.length > 0 ? centersFromApi : DEFAULT_CENTERS.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [loadingPointsData])
  
  const getCenterByName = useMemo(() => {
    return (name: string) => centers.find(center => center.name === name)
  }, [centers])
  
  const getCenterNames = useMemo(() => {
    return centers.map(center => center.name)
  }, [centers])
  
  return {
    centers,
    getCenterByName,
    getCenterNames,
    isLoading,
    error
  }
}