/**
 * 수익성 대시보드 컴포넌트
 * 전체 용차 요청들의 수익성 현황을 시각화하고 분석
 */

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  AlertTriangle, 
  Users, 
  Truck,
  BarChart3,
  PieChart,
  Filter,
  Calendar,
  RefreshCw,
  Download,
  Search,
  Eye,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Request } from '@/types'
import { calculateProfitability, ProfitabilityStatus } from '@/lib/services/profitability.service'

interface ProfitabilityDashboardProps {
  requests: Request[]
  onViewRequest?: (request: Request) => void
  onRefresh?: () => void
  isLoading?: boolean
  className?: string
}

interface ProfitabilityMetrics {
  totalRequests: number
  totalRevenue: number
  totalDriverCosts: number
  totalMargin: number
  averageMarginRate: number
  statusDistribution: Record<ProfitabilityStatus, number>
  topPerformers: Request[]
  lossRequests: Request[]
  unassignedCount: number
}

interface FilterState {
  dateRange: 'today' | 'week' | 'month' | 'all'
  profitabilityStatus: ProfitabilityStatus | 'all'
  driverAssignment: 'assigned' | 'unassigned' | 'all'
  centerName: string
  searchQuery: string
}

export function ProfitabilityDashboard({ 
  requests, 
  onViewRequest, 
  onRefresh, 
  isLoading = false,
  className 
}: ProfitabilityDashboardProps) {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'month',
    profitabilityStatus: 'all',
    driverAssignment: 'all',
    centerName: '',
    searchQuery: ''
  })

  const [sortBy, setSortBy] = useState<'date' | 'margin' | 'marginRate'>('marginRate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 필터링된 요청 데이터
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
      }
      
      filtered = filtered.filter(req => 
        new Date(req.requestDate) >= startDate
      )
    }

    // 수익성 상태 필터
    if (filters.profitabilityStatus !== 'all') {
      filtered = filtered.filter(req => {
        const profitability = calculateProfitability(req)
        return profitability.status === filters.profitabilityStatus
      })
    }

    // 기사 배정 상태 필터
    if (filters.driverAssignment !== 'all') {
      const hasDriver = filters.driverAssignment === 'assigned'
      filtered = filtered.filter(req => 
        !!(req.driverId || req.driverName) === hasDriver
      )
    }

    // 센터명 필터
    if (filters.centerName) {
      filtered = filtered.filter(req => 
        req.loadingPoint?.centerName?.includes(filters.centerName)
      )
    }

    // 검색 쿼리 필터
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(req => 
        req.id.toLowerCase().includes(query) ||
        req.driverName?.toLowerCase().includes(query) ||
        req.loadingPoint?.centerName?.toLowerCase().includes(query) ||
        req.regions.some(region => region.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [requests, filters])

  // 정렬된 요청 데이터
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
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
        default:
          return 0
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
    })
  }, [filteredRequests, sortBy, sortOrder])

  // 수익성 메트릭스 계산
  const metrics = useMemo((): ProfitabilityMetrics => {
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

    // 상태별 분포
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

    // 상위 수익률 요청들 (상위 5개)
    const topPerformers = profitabilityData
      .filter(({ profitability }) => profitability.driverFee > 0)
      .sort((a, b) => b.profitability.marginRate - a.profitability.marginRate)
      .slice(0, 5)
      .map(({ request }) => request)

    // 손실 요청들
    const lossRequests = profitabilityData
      .filter(({ profitability }) => profitability.margin < 0)
      .map(({ request }) => request)

    // 미배정 요청 수
    const unassignedCount = filteredRequests.filter(req => 
      !(req.driverId || req.driverName)
    ).length

    return {
      totalRequests: filteredRequests.length,
      totalRevenue,
      totalDriverCosts,
      totalMargin,
      averageMarginRate,
      statusDistribution,
      topPerformers,
      lossRequests,
      unassignedCount
    }
  }, [filteredRequests])

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원'
  }

  const getStatusColor = (status: ProfitabilityStatus) => {
    switch (status) {
      case 'excellent': return 'text-emerald-600 bg-emerald-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'fair': return 'text-yellow-600 bg-yellow-100'
      case 'poor': return 'text-orange-600 bg-orange-100'
      case 'loss': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusLabel = (status: ProfitabilityStatus) => {
    switch (status) {
      case 'excellent': return '우수'
      case 'good': return '양호'
      case 'fair': return '보통'
      case 'poor': return '주의'
      case 'loss': return '손실'
      default: return '알 수 없음'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            수익성 대시보드
          </h1>
          <p className="text-gray-600 mt-1">전체 용차 요청의 수익성 현황을 분석합니다</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
            새로고침
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-teal-300 text-teal-700 hover:bg-teal-50"
          >
            <Download className="h-4 w-4 mr-1" />
            내보내기
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-emerald-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-emerald-600" />
            필터 및 정렬
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Select
              value={filters.dateRange}
              onValueChange={(value: FilterState['dateRange']) => 
                setFilters(prev => ({ ...prev, dateRange: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">오늘</SelectItem>
                <SelectItem value="week">최근 7일</SelectItem>
                <SelectItem value="month">최근 30일</SelectItem>
                <SelectItem value="all">전체</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.profitabilityStatus}
              onValueChange={(value: FilterState['profitabilityStatus']) => 
                setFilters(prev => ({ ...prev, profitabilityStatus: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="수익성 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="excellent">우수 (30%+)</SelectItem>
                <SelectItem value="good">양호 (20-30%)</SelectItem>
                <SelectItem value="fair">보통 (10-20%)</SelectItem>
                <SelectItem value="poor">주의 (0-10%)</SelectItem>
                <SelectItem value="loss">손실 (0% 미만)</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.driverAssignment}
              onValueChange={(value: FilterState['driverAssignment']) => 
                setFilters(prev => ({ ...prev, driverAssignment: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="배정 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="assigned">배정 완료</SelectItem>
                <SelectItem value="unassigned">미배정</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="센터명"
              value={filters.centerName}
              onChange={(e) => setFilters(prev => ({ ...prev, centerName: e.target.value }))}
              className="border-emerald-200 focus:border-emerald-400"
            />

            <Input
              placeholder="검색..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="border-emerald-200 focus:border-emerald-400"
            />

            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split('-')
                setSortBy(field as typeof sortBy)
                setSortOrder(order as typeof sortOrder)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marginRate-desc">마진율 높은순</SelectItem>
                <SelectItem value="marginRate-asc">마진율 낮은순</SelectItem>
                <SelectItem value="margin-desc">마진 높은순</SelectItem>
                <SelectItem value="margin-asc">마진 낮은순</SelectItem>
                <SelectItem value="date-desc">최신순</SelectItem>
                <SelectItem value="date-asc">오래된순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-100 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">총 요청수</p>
                <p className="text-2xl font-bold text-emerald-900">{metrics.totalRequests}건</p>
                <p className="text-xs text-gray-600 mt-1">
                  미배정: {metrics.unassignedCount}건
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <Truck className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">총 매출</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.totalRevenue)}</p>
                <p className="text-xs text-gray-600 mt-1">
                  기사비용: {formatCurrency(metrics.totalDriverCosts)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-100 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-600">총 마진</p>
                <p className="text-2xl font-bold text-teal-900">{formatCurrency(metrics.totalMargin)}</p>
                <p className={cn(
                  "text-xs mt-1 flex items-center gap-1",
                  metrics.totalMargin >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {metrics.totalMargin >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {metrics.averageMarginRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-teal-100 rounded-full">
                <Target className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">손실 건수</p>
                <p className="text-2xl font-bold text-purple-900">{metrics.lossRequests.length}건</p>
                <p className="text-xs text-gray-600 mt-1">
                  전체 대비 {((metrics.lossRequests.length / Math.max(metrics.totalRequests, 1)) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="analysis">분석</TabsTrigger>
          <TabsTrigger value="details">상세 목록</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card className="border-emerald-100 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-emerald-600" />
                  수익성 상태 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.statusDistribution).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(status as ProfitabilityStatus)} variant="outline">
                          {getStatusLabel(status as ProfitabilityStatus)}
                        </Badge>
                        <span className="text-sm text-gray-600">{count}건</span>
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={cn(
                              "h-2 rounded-full",
                              getStatusColor(status as ProfitabilityStatus).replace('text-', 'bg-').replace('bg-', 'bg-').replace('-100', '-400')
                            )}
                            style={{ width: `${(count / Math.max(metrics.totalRequests, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium">
                        {((count / Math.max(metrics.totalRequests, 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card className="border-emerald-100 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  상위 수익률 요청
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.topPerformers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      배정된 요청이 없습니다
                    </p>
                  ) : (
                    metrics.topPerformers.map((request) => {
                      const profitability = calculateProfitability(request)
                      return (
                        <div 
                          key={request.id} 
                          className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                          onClick={() => onViewRequest?.(request)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {request.loadingPoint?.centerName || '센터 미지정'}
                              </span>
                              <Badge size="sm" variant="outline" className="text-emerald-600 border-emerald-200">
                                #{request.id.slice(-6)}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {request.driverName || '기사 미배정'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-emerald-600">
                              {profitability.marginRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-600">
                              {formatCurrency(profitability.margin)}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="ml-2 p-1">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {/* Loss Analysis */}
          {metrics.lossRequests.length > 0 && (
            <Card className="border-red-100 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  손실 발생 요청 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.lossRequests.map((request) => {
                    const profitability = calculateProfitability(request)
                    return (
                      <div 
                        key={request.id}
                        className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                        onClick={() => onViewRequest?.(request)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {request.loadingPoint?.centerName || '센터 미지정'}
                            </span>
                            <Badge size="sm" variant="outline" className="text-red-600 border-red-200">
                              #{request.id.slice(-6)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            기사: {request.driverName || '미배정'} | 
                            청구: {formatCurrency(profitability.centerBilling)} | 
                            운임: {formatCurrency(profitability.driverFee)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-red-600">
                            {formatCurrency(profitability.margin)}
                          </div>
                          <div className="text-xs text-red-600">
                            {profitability.marginRate.toFixed(1)}%
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="ml-2 p-1">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {/* Detailed List */}
          <Card className="border-emerald-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  상세 목록 ({sortedRequests.length}건)
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                  {sortBy === 'marginRate' ? '마진율순' : sortBy === 'margin' ? '마진순' : '날짜순'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sortedRequests.map((request) => {
                  const profitability = calculateProfitability(request)
                  const hasDriver = !!(request.driverId || request.driverName)
                  
                  return (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => onViewRequest?.(request)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {request.loadingPoint?.centerName || '센터 미지정'}
                          </span>
                          <Badge size="sm" variant="outline" className="text-gray-600 border-gray-200">
                            #{request.id.slice(-6)}
                          </Badge>
                          {hasDriver && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(request.requestDate).toLocaleDateString('ko-KR')} | 
                          {request.driverName || '미배정'} | 
                          {request.regions.join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatCurrency(profitability.centerBilling)}
                        </div>
                        {hasDriver && (
                          <div className={cn("text-xs", profitability.statusColor)}>
                            {formatCurrency(profitability.margin)} ({profitability.marginRate.toFixed(1)}%)
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <Badge 
                          className={cn("text-xs", profitability.statusColor)} 
                          variant="outline"
                        >
                          {profitability.statusLabel}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="ml-2 p-1">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
                
                {sortedRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    조건에 맞는 요청이 없습니다
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}