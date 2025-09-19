'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingPointSelector } from '@/components/ui/LoadingPointSelector'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  SearchIcon, 
  FilterIcon, 
  PlusIcon, 
  DownloadIcon,
  EyeIcon,
  EditIcon,
  CalendarIcon,
  TruckIcon,
  MapPinIcon,
  DollarSignIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Request } from '@/types'
import { requestsAPI } from '@/lib/api/requests'

interface SearchFilters {
  query: string
  startDate: string
  endDate: string
  centerCarNo: string
  loadingPointId: string
  hasDispatches: boolean | null
  marginStatus: 'all' | 'profit' | 'loss' | 'break-even'
}

interface RequestListProps {
  onCreateNew: () => void
  onViewRequest: (request: Request) => void
  onEditRequest: (request: Request) => void
  onExportSelected: (requestIds: string[]) => void
}

export function RequestList({ onCreateNew, onViewRequest, onEditRequest, onExportSelected }: RequestListProps) {
  const [requests, setRequests] = useState<Request[]>([])
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    startDate: '',
    endDate: '',
    centerCarNo: '',
    loadingPointId: '',
    hasDispatches: null,
    marginStatus: 'all'
  })

  // Load requests
  const loadRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await requestsAPI.list({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.centerCarNo && { centerCarNo: filters.centerCarNo }),
        ...(filters.loadingPointId && { loadingPointId: filters.loadingPointId })
      })

      setRequests(response.data || [])
      if (response.pagination) {
        setPagination(prev => ({ ...prev, ...response.pagination }))
      }
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filters.centerCarNo, filters.endDate, filters.loadingPointId, filters.startDate, pagination.limit, pagination.page])

  // Apply client-side filters
  useEffect(() => {
    let filtered = [...requests]

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase()
      filtered = filtered.filter(request =>
        (request.centerCarNo ?? '').toLowerCase().includes(query) ||
        request.loadingPoint?.loadingPointName?.toLowerCase().includes(query) ||
        request.loadingPoint?.name?.toLowerCase().includes(query) ||
        request.loadingPoint?.centerName?.toLowerCase().includes(query) ||
        request.regions.some(region => region.toLowerCase().includes(query)) ||
        request.dispatches.some(dispatch => 
          dispatch.driverName.toLowerCase().includes(query)
        )
      )
    }

    // Dispatch filter
    if (filters.hasDispatches !== null) {
      filtered = filtered.filter(request =>
        filters.hasDispatches ? request.dispatches.length > 0 : request.dispatches.length === 0
      )
    }

    // Margin status filter
    if (filters.marginStatus !== 'all') {
      filtered = filtered.filter(request => {
        const marginPercentage = request.financialSummary.marginPercentage
        switch (filters.marginStatus) {
          case 'profit':
            return marginPercentage > 0
          case 'loss':
            return marginPercentage < 0
          case 'break-even':
            return marginPercentage === 0
          default:
            return true
        }
      })
    }

    setFilteredRequests(filtered)
  }, [requests, filters])

  // Load data on mount and filter changes
  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleSelectRequest = (requestId: string) => {
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    )
  }

  const toggleSelectAll = () => {
    setSelectedRequests(
      selectedRequests.length === filteredRequests.length
        ? []
        : filteredRequests.map(r => r.id)
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return (amount / 10000).toFixed(0) + '만원'
  }

  const getMarginStatus = (marginPercentage: number) => {
    if (marginPercentage >= 40) return { label: '✅', color: 'text-green-600' }
    if (marginPercentage >= 20) return { label: '⚠️', color: 'text-yellow-600' }
    if (marginPercentage >= 0) return { label: '⚠️', color: 'text-orange-600' }
    return { label: '❌', color: 'text-red-600' }
  }

  const getDispatchStatus = (dispatchCount: number) => {
    if (dispatchCount === 0) return { label: '대기중', color: 'text-gray-500', icon: '⏳' }
    return { label: `${dispatchCount}건 배차`, color: 'text-blue-600', icon: '🚛' }
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-lg border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">전체 요청</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{pagination.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-lg border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">배차 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredRequests.filter(r => (r.dispatches?.length || 0) > 0).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-lg border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">배차 대기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredRequests.filter(r => (r.dispatches?.length || 0) === 0).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-lg border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">오늘 요청</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredRequests.filter(r => {
                const today = new Date().toISOString().split('T')[0]
                return r.requestDate === today
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white shadow-lg border-emerald-200">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
              <div className="max-w-md relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="상차지명, 상차지호차, 배송지역, 기사명 검색"
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  className="pl-10 h-11 border-2 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white rounded-md"
                />
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                필터
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              {selectedRequests.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => onExportSelected(selectedRequests)}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  내보내기 ({selectedRequests.length})
                </Button>
              )}
              <Button
                variant="outline"
                onClick={loadRequests}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                새로고침
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                {viewMode === 'grid' ? '테이블' : '카드'} 보기
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">시작일</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">종료일</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">상차지</label>
                <div className="flex gap-2 items-center">
                  <LoadingPointSelector
                    value={filters.loadingPointId}
                    onValueChange={(value) => handleFilterChange('loadingPointId', value)}
                    placeholder="상차지 선택"
                    className="w-full"
                  />
                  {filters.loadingPointId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleFilterChange('loadingPointId', '')}
                    >
                      초기화
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">상차지호차</label>
                <Input
                  placeholder="C001"
                  value={filters.centerCarNo}
                  onChange={(e) => handleFilterChange('centerCarNo', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">상태</label>
                <select
                  className="w-full p-2 border rounded"
                  value={filters.marginStatus}
                  onChange={(e) => handleFilterChange('marginStatus', e.target.value)}
                >
                  <option value="all">전체</option>
                  <option value="profit">수익</option>
                  <option value="break-even">손익분기</option>
                  <option value="loss">손실</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request List */}
      {isLoading ? (
        <Card className="bg-white shadow-lg border-emerald-200">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3"></div>
              <span className="text-gray-600">용차 요청을 불러오는 중...</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card className="bg-white shadow-lg border-emerald-200">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="mb-4">
                <TruckIcon className="h-16 w-16 text-emerald-400 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                요청이 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                새 요청을 생성하거나 필터를 조정해보세요
              </p>
              <Button 
                onClick={onCreateNew}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                첫 요청 생성하기
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bulk Actions */}
          {filteredRequests.length > 0 && (
            <Card className="bg-white shadow-lg border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedRequests.length === filteredRequests.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-gray-600">
                    {selectedRequests.length > 0 
                      ? `${selectedRequests.length}개 선택됨` 
                      : '전체 선택'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map((request) => {
                // Create default financial summary if not provided
                const financialSummary = request.financialSummary || {
                  centerBilling: 0,
                  totalDriverFees: 0,
                  totalMargin: 0,
                  marginPercentage: 0,
                  dispatchCount: request.dispatches?.length || 0
                }
                
                const marginStatus = getMarginStatus(financialSummary.marginPercentage)
                const dispatchStatus = getDispatchStatus(financialSummary.dispatchCount)

                return (
                  <Card key={request.id} className="bg-white shadow-lg border-emerald-200 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Checkbox
                          checked={selectedRequests.includes(request.id)}
                          onCheckedChange={() => toggleSelectRequest(request.id)}
                        />
                        <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                          #{request.id.slice(-6)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-gray-900">📋 요청 #{request.id.slice(-8)}</CardTitle>
                        {request.loadingPoint && (
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">
                            🏢 {request.loadingPoint.loadingPointName || request.loadingPoint.name || request.loadingPoint.centerName}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3 text-gray-500" />
                          {formatDate(request.requestDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <TruckIcon className="h-3 w-3 text-gray-500" />
                          {request.centerCarNo ?? '미지정'} ({request.vehicleTon}톤)
                        </div>
                      </div>
                      
                      {request.loadingPoint && (
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <span className="font-medium">{request.loadingPoint.loadingPointName || request.loadingPoint.name || request.loadingPoint.centerName}</span>
                          {request.loadingPoint.lotAddress && (
                            <span className="text-gray-500">({request.loadingPoint.lotAddress})</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-sm">
                        <MapPinIcon className="h-3 w-3 text-gray-500" />
                        <span className="truncate">
                          {request.regions.join(' → ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-xs text-blue-600">상차지청구</div>
                          <div className="font-medium text-blue-800">
                            {formatCurrency(financialSummary.centerBilling)}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">{dispatchStatus.icon} {dispatchStatus.label}</div>
                          <div className={cn("font-medium", marginStatus.color)}>
                            {formatCurrency(financialSummary.totalMargin)} {marginStatus.label}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => onViewRequest(request)}
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          보기
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => onEditRequest(request)}
                        >
                          <EditIcon className="h-3 w-3 mr-1" />
                          수정
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <Card className="bg-white shadow-lg border-emerald-200">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                      <tr className="text-left">
                        <th className="p-3">
                          <Checkbox
                            checked={selectedRequests.length === filteredRequests.length}
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                        <th className="p-3">요청정보</th>
                        <th className="p-3">상차지정보</th>
                        <th className="p-3">배송정보</th>
                        <th className="p-3">요금정보</th>
                        <th className="p-3">배차상태</th>
                        <th className="p-3">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => {
                        // Create default financial summary if not provided
                        const financialSummary = request.financialSummary || {
                          centerBilling: 0,
                          totalDriverFees: 0,
                          totalMargin: 0,
                          marginPercentage: 0,
                          dispatchCount: request.dispatches?.length || 0
                        }
                        
                        const marginStatus = getMarginStatus(financialSummary.marginPercentage)
                        const dispatchStatus = getDispatchStatus(financialSummary.dispatchCount)

                        return (
                          <tr key={request.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <Checkbox
                                checked={selectedRequests.includes(request.id)}
                                onCheckedChange={() => toggleSelectRequest(request.id)}
                              />
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <div className="font-medium">#{request.id.slice(-8)}</div>
                                <div className="text-sm text-gray-600">
                                  {formatDate(request.requestDate)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {request.centerCarNo ?? '미지정'} ({request.vehicleTon}톤)
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              {request.loadingPoint ? (
                                <div className="space-y-1">
                                  <div className="font-medium text-blue-600">
                              {request.loadingPoint.loadingPointName || request.loadingPoint.name || request.loadingPoint.centerName}
                                  </div>
                                  {request.loadingPoint.lotAddress && (
                                    <div className="text-sm text-gray-600">
                                      {request.loadingPoint.lotAddress}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-400">상차지 정보 없음</div>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <div className="text-sm">
                                  {request.regions.join(' → ')}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {request.stops}개 착지
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {formatCurrency(financialSummary.centerBilling)}
                                </div>
                                <div className={cn("text-sm", marginStatus.color)}>
                                  {formatCurrency(financialSummary.totalMargin)} {marginStatus.label}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className={dispatchStatus.color}>
                                {dispatchStatus.icon} {dispatchStatus.label}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onViewRequest(request)}
                                >
                                  보기
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onEditRequest(request)}
                                >
                                  수정
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Card className="bg-white shadow-lg border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    총 {pagination.total.toLocaleString()}개
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      이전
                    </Button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          variant={pagination.page === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, page }))}
                          className={pagination.page === page 
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white" 
                            : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          }
                        >
                          {page}
                        </Button>
                      )
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      다음
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
