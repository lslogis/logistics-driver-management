/**
 * 수익성 필터링 및 정렬을 위한 고급 훅
 * 복잡한 필터 조건과 정렬 로직을 중앙화하여 관리
 */

import { useState, useMemo, useCallback } from 'react'
import { Request } from '@/types'
import { calculateProfitability, ProfitabilityStatus } from '@/lib/services/profitability.service'

export interface ProfitabilityFilter {
  // 날짜 관련
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'
  customDateFrom?: string
  customDateTo?: string
  
  // 수익성 관련
  profitabilityStatus: ProfitabilityStatus | 'all'
  minMarginRate?: number
  maxMarginRate?: number
  minMarginAmount?: number
  maxMarginAmount?: number
  
  // 기사 배정 관련
  driverAssignment: 'assigned' | 'unassigned' | 'all'
  specificDriverId?: string
  
  // 지역 및 센터 관련
  centerName: string
  regions: string[]
  vehicleTon?: number
  
  // 금액 관련
  minCenterBilling?: number
  maxCenterBilling?: number
  minDriverFee?: number
  maxDriverFee?: number
  
  // 기타
  searchQuery: string
  hasNotes?: boolean
  requestStatus?: 'all' | 'pending' | 'dispatched' | 'completed'
}

export interface SortOptions {
  field: 'date' | 'margin' | 'marginRate' | 'centerBilling' | 'driverFee' | 'centerName' | 'driverName'
  order: 'asc' | 'desc'
}

export interface ProfitabilityAnalytics {
  // 기본 통계
  totalRequests: number
  totalRevenue: number
  totalDriverCosts: number
  totalMargin: number
  averageMarginRate: number
  
  // 상태별 분포
  statusDistribution: Record<ProfitabilityStatus, number>
  statusPercentages: Record<ProfitabilityStatus, number>
  
  // 성과 분석
  topPerformers: Request[]
  bottomPerformers: Request[]
  lossRequests: Request[]
  highValueRequests: Request[]
  
  // 배정 현황
  assignedCount: number
  unassignedCount: number
  assignmentRate: number
  
  // 날짜별 추이 (최근 30일)
  dailyTrends: Array<{
    date: string
    requests: number
    revenue: number
    margin: number
    marginRate: number
  }>
  
  // 센터별 분석
  centerAnalysis: Array<{
    centerName: string
    requests: number
    totalRevenue: number
    totalMargin: number
    averageMarginRate: number
    topMarginRate: number
  }>
  
  // 기사별 분석 (배정된 요청만)
  driverAnalysis: Array<{
    driverId: string
    driverName: string
    requests: number
    totalRevenue: number
    totalDriverFee: number
    averageMarginRate: number
  }>
}

const DEFAULT_FILTER: ProfitabilityFilter = {
  dateRange: 'month',
  profitabilityStatus: 'all',
  driverAssignment: 'all',
  centerName: '',
  regions: [],
  searchQuery: ''
}

const DEFAULT_SORT: SortOptions = {
  field: 'marginRate',
  order: 'desc'
}

export function useProfitabilityFilters(requests: Request[]) {
  const [filters, setFilters] = useState<ProfitabilityFilter>(DEFAULT_FILTER)
  const [sortOptions, setSortOptions] = useState<SortOptions>(DEFAULT_SORT)

  // 필터링된 요청 계산
  const filteredRequests = useMemo(() => {
    let filtered = [...requests]

    // 날짜 범위 필터
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const startDate = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setDate(now.getDate() - 30)
          break
        case 'quarter':
          startDate.setDate(now.getDate() - 90)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(req => 
        new Date(req.requestDate) >= startDate
      )
    }

    // 사용자 정의 날짜 범위
    if (filters.customDateFrom) {
      filtered = filtered.filter(req => 
        new Date(req.requestDate) >= new Date(filters.customDateFrom!)
      )
    }
    if (filters.customDateTo) {
      filtered = filtered.filter(req => 
        new Date(req.requestDate) <= new Date(filters.customDateTo!)
      )
    }

    // 수익성 상태 필터
    if (filters.profitabilityStatus !== 'all') {
      filtered = filtered.filter(req => {
        const profitability = calculateProfitability(req)
        return profitability.status === filters.profitabilityStatus
      })
    }

    // 마진율 범위 필터
    if (filters.minMarginRate !== undefined || filters.maxMarginRate !== undefined) {
      filtered = filtered.filter(req => {
        const profitability = calculateProfitability(req)
        const marginRate = profitability.marginRate
        
        if (filters.minMarginRate !== undefined && marginRate < filters.minMarginRate) return false
        if (filters.maxMarginRate !== undefined && marginRate > filters.maxMarginRate) return false
        return true
      })
    }

    // 마진 금액 범위 필터
    if (filters.minMarginAmount !== undefined || filters.maxMarginAmount !== undefined) {
      filtered = filtered.filter(req => {
        const profitability = calculateProfitability(req)
        const margin = profitability.margin
        
        if (filters.minMarginAmount !== undefined && margin < filters.minMarginAmount) return false
        if (filters.maxMarginAmount !== undefined && margin > filters.maxMarginAmount) return false
        return true
      })
    }

    // 기사 배정 상태 필터
    if (filters.driverAssignment !== 'all') {
      const hasDriver = filters.driverAssignment === 'assigned'
      filtered = filtered.filter(req => 
        !!(req.driverId || req.driverName) === hasDriver
      )
    }

    // 특정 기사 필터
    if (filters.specificDriverId) {
      filtered = filtered.filter(req => 
        req.driverId === filters.specificDriverId
      )
    }

    // 센터명 필터
    if (filters.centerName) {
      filtered = filtered.filter(req => 
        req.loadingPoint?.centerName?.toLowerCase().includes(filters.centerName.toLowerCase())
      )
    }

    // 지역 필터
    if (filters.regions.length > 0) {
      filtered = filtered.filter(req => 
        filters.regions.some(region => 
          req.regions.some(r => r.toLowerCase().includes(region.toLowerCase()))
        )
      )
    }

    // 차량 톤수 필터
    if (filters.vehicleTon) {
      filtered = filtered.filter(req => req.vehicleTon === filters.vehicleTon)
    }

    // 센터 청구금액 범위 필터
    if (filters.minCenterBilling !== undefined || filters.maxCenterBilling !== undefined) {
      filtered = filtered.filter(req => {
        const profitability = calculateProfitability(req)
        const billing = profitability.centerBilling
        
        if (filters.minCenterBilling !== undefined && billing < filters.minCenterBilling) return false
        if (filters.maxCenterBilling !== undefined && billing > filters.maxCenterBilling) return false
        return true
      })
    }

    // 기사 운임 범위 필터
    if (filters.minDriverFee !== undefined || filters.maxDriverFee !== undefined) {
      filtered = filtered.filter(req => {
        const fee = req.driverFee || 0
        
        if (filters.minDriverFee !== undefined && fee < filters.minDriverFee) return false
        if (filters.maxDriverFee !== undefined && fee > filters.maxDriverFee) return false
        return true
      })
    }

    // 검색 쿼리 필터
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(req => 
        req.id.toLowerCase().includes(query) ||
        req.driverName?.toLowerCase().includes(query) ||
        req.loadingPoint?.centerName?.toLowerCase().includes(query) ||
        req.regions.some(region => region.toLowerCase().includes(query)) ||
        req.notes?.toLowerCase().includes(query) ||
        req.centerCarNo?.toLowerCase().includes(query)
      )
    }

    // 메모 존재 여부 필터
    if (filters.hasNotes !== undefined) {
      filtered = filtered.filter(req => 
        filters.hasNotes ? !!req.notes : !req.notes
      )
    }

    return filtered
  }, [requests, filters])

  // 정렬된 요청 계산
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      let aValue, bValue

      switch (sortOptions.field) {
        case 'date':
          aValue = new Date(a.requestDate).getTime()
          bValue = new Date(b.requestDate).getTime()
          break
        case 'margin':
          aValue = calculateProfitability(a).margin
          bValue = calculateProfitability(b).margin
          break
        case 'marginRate':
          aValue = calculateProfitability(a).marginRate
          bValue = calculateProfitability(b).marginRate
          break
        case 'centerBilling':
          aValue = calculateProfitability(a).centerBilling
          bValue = calculateProfitability(b).centerBilling
          break
        case 'driverFee':
          aValue = a.driverFee || 0
          bValue = b.driverFee || 0
          break
        case 'centerName':
          aValue = a.loadingPoint?.centerName || ''
          bValue = b.loadingPoint?.centerName || ''
          return sortOptions.order === 'desc' 
            ? bValue.localeCompare(aValue) 
            : aValue.localeCompare(bValue)
        case 'driverName':
          aValue = a.driverName || ''
          bValue = b.driverName || ''
          return sortOptions.order === 'desc' 
            ? bValue.localeCompare(aValue) 
            : aValue.localeCompare(bValue)
        default:
          return 0
      }

      return sortOptions.order === 'desc' ? bValue - aValue : aValue - bValue
    })
  }, [filteredRequests, sortOptions])

  // 수익성 분석 데이터 계산
  const analytics = useMemo((): ProfitabilityAnalytics => {
    const profitabilityData = filteredRequests.map(req => ({
      request: req,
      profitability: calculateProfitability(req)
    }))

    const totalRevenue = profitabilityData.reduce((sum, { profitability }) => 
      sum + profitability.centerBilling, 0
    )
    
    const totalDriverCosts = profitabilityData.reduce((sum, { profitability }) => 
      sum + profitability.driverFee, 0
    )
    
    const totalMargin = totalRevenue - totalDriverCosts
    const averageMarginRate = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0

    // 상태별 분포 계산
    const statusDistribution: Record<ProfitabilityStatus, number> = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      loss: 0
    }

    profitabilityData.forEach(({ profitability }) => {
      statusDistribution[profitability.status]++
    })

    const statusPercentages: Record<ProfitabilityStatus, number> = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      loss: 0
    }

    Object.keys(statusDistribution).forEach(status => {
      const key = status as ProfitabilityStatus
      statusPercentages[key] = filteredRequests.length > 0 
        ? (statusDistribution[key] / filteredRequests.length) * 100 
        : 0
    })

    // 성과 분석
    const assignedRequests = profitabilityData.filter(({ request }) => 
      !!(request.driverId || request.driverName)
    )

    const topPerformers = assignedRequests
      .sort((a, b) => b.profitability.marginRate - a.profitability.marginRate)
      .slice(0, 10)
      .map(({ request }) => request)

    const bottomPerformers = assignedRequests
      .sort((a, b) => a.profitability.marginRate - b.profitability.marginRate)
      .slice(0, 5)
      .map(({ request }) => request)

    const lossRequests = profitabilityData
      .filter(({ profitability }) => profitability.margin < 0)
      .map(({ request }) => request)

    const highValueRequests = profitabilityData
      .filter(({ profitability }) => profitability.centerBilling >= 1000000) // 100만원 이상
      .sort((a, b) => b.profitability.centerBilling - a.profitability.centerBilling)
      .slice(0, 10)
      .map(({ request }) => request)

    // 배정 현황
    const assignedCount = filteredRequests.filter(req => 
      !!(req.driverId || req.driverName)
    ).length
    const unassignedCount = filteredRequests.length - assignedCount
    const assignmentRate = filteredRequests.length > 0 
      ? (assignedCount / filteredRequests.length) * 100 
      : 0

    // 일별 추이 계산 (최근 30일)
    const dailyTrends = []
    for (let i = 29; i >= 0; i--) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - i)
      const dateStr = targetDate.toISOString().split('T')[0]
      
      const dayRequests = filteredRequests.filter(req => 
        req.requestDate.startsWith(dateStr)
      )
      
      const dayRevenue = dayRequests.reduce((sum, req) => 
        sum + calculateProfitability(req).centerBilling, 0
      )
      
      const dayMargin = dayRequests.reduce((sum, req) => 
        sum + calculateProfitability(req).margin, 0
      )
      
      const dayMarginRate = dayRevenue > 0 ? (dayMargin / dayRevenue) * 100 : 0

      dailyTrends.push({
        date: dateStr,
        requests: dayRequests.length,
        revenue: dayRevenue,
        margin: dayMargin,
        marginRate: dayMarginRate
      })
    }

    // 센터별 분석
    const centerMap = new Map<string, {
      requests: Request[]
      totalRevenue: number
      totalMargin: number
    }>()

    filteredRequests.forEach(req => {
      const centerName = req.loadingPoint?.centerName || '미지정'
      if (!centerMap.has(centerName)) {
        centerMap.set(centerName, { requests: [], totalRevenue: 0, totalMargin: 0 })
      }
      
      const centerData = centerMap.get(centerName)!
      const profitability = calculateProfitability(req)
      
      centerData.requests.push(req)
      centerData.totalRevenue += profitability.centerBilling
      centerData.totalMargin += profitability.margin
    })

    const centerAnalysis = Array.from(centerMap.entries()).map(([centerName, data]) => ({
      centerName,
      requests: data.requests.length,
      totalRevenue: data.totalRevenue,
      totalMargin: data.totalMargin,
      averageMarginRate: data.totalRevenue > 0 ? (data.totalMargin / data.totalRevenue) * 100 : 0,
      topMarginRate: Math.max(...data.requests.map(req => calculateProfitability(req).marginRate))
    })).sort((a, b) => b.totalRevenue - a.totalRevenue)

    // 기사별 분석
    const driverMap = new Map<string, {
      driverName: string
      requests: Request[]
      totalRevenue: number
      totalDriverFee: number
    }>()

    filteredRequests
      .filter(req => req.driverId || req.driverName)
      .forEach(req => {
        const driverId = req.driverId || req.driverName || 'unknown'
        const driverName = req.driverName || '이름 없음'
        
        if (!driverMap.has(driverId)) {
          driverMap.set(driverId, { 
            driverName, 
            requests: [], 
            totalRevenue: 0, 
            totalDriverFee: 0 
          })
        }
        
        const driverData = driverMap.get(driverId)!
        const profitability = calculateProfitability(req)
        
        driverData.requests.push(req)
        driverData.totalRevenue += profitability.centerBilling
        driverData.totalDriverFee += profitability.driverFee
      })

    const driverAnalysis = Array.from(driverMap.entries()).map(([driverId, data]) => ({
      driverId,
      driverName: data.driverName,
      requests: data.requests.length,
      totalRevenue: data.totalRevenue,
      totalDriverFee: data.totalDriverFee,
      averageMarginRate: data.totalRevenue > 0 
        ? ((data.totalRevenue - data.totalDriverFee) / data.totalRevenue) * 100 
        : 0
    })).sort((a, b) => b.totalRevenue - a.totalRevenue)

    return {
      totalRequests: filteredRequests.length,
      totalRevenue,
      totalDriverCosts,
      totalMargin,
      averageMarginRate,
      statusDistribution,
      statusPercentages,
      topPerformers,
      bottomPerformers,
      lossRequests,
      highValueRequests,
      assignedCount,
      unassignedCount,
      assignmentRate,
      dailyTrends,
      centerAnalysis,
      driverAnalysis
    }
  }, [filteredRequests])

  // 필터 업데이트 함수들
  const updateFilter = useCallback((key: keyof ProfitabilityFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateSort = useCallback((field: SortOptions['field'], order?: SortOptions['order']) => {
    setSortOptions(prev => ({
      field,
      order: order || (prev.field === field && prev.order === 'desc' ? 'asc' : 'desc')
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTER)
    setSortOptions(DEFAULT_SORT)
  }, [])

  const exportFilteredData = useCallback(() => {
    return {
      filters,
      sortOptions,
      requests: sortedRequests,
      analytics
    }
  }, [filters, sortOptions, sortedRequests, analytics])

  return {
    // 데이터
    filteredRequests,
    sortedRequests,
    analytics,
    
    // 필터 상태
    filters,
    sortOptions,
    
    // 액션
    updateFilter,
    updateSort,
    resetFilters,
    exportFilteredData,
    
    // 유틸리티
    hasActiveFilters: JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTER),
    isDefaultSort: JSON.stringify(sortOptions) === JSON.stringify(DEFAULT_SORT)
  }
}