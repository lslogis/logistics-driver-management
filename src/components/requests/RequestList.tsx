'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface Request {
  id: string
  requestDate: string
  centerCarNo: string
  vehicleTon: number
  regions: string[]
  stops: number
  extraAdjustment: number
  dispatches: Array<{
    id: string
    driverName: string
    driverFee: number
  }>
  financialSummary: {
    centerBilling: number
    totalDriverFees: number
    totalMargin: number
    marginPercentage: number
    dispatchCount: number
  }
}

interface SearchFilters {
  query: string
  startDate: string
  endDate: string
  centerCarNo: string
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
    hasDispatches: null,
    marginStatus: 'all'
  })

  // Load requests
  const loadRequests = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.centerCarNo && { centerCarNo: filters.centerCarNo })
      })

      const response = await fetch(`/api/requests?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.data || [])
        setPagination(prev => ({ ...prev, ...data.pagination }))
      }
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Apply client-side filters
  useEffect(() => {
    let filtered = [...requests]

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase()
      filtered = filtered.filter(request =>
        request.centerCarNo.toLowerCase().includes(query) ||
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
  }, [pagination.page, filters.startDate, filters.endDate, filters.centerCarNo])

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">용차 요청 목록</h1>
          <p className="text-gray-600 mt-1">총 {pagination.total}건의 요청</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}>
            {viewMode === 'grid' ? '테이블' : '카드'} 보기
          </Button>
          <Button onClick={onCreateNew}>
            <PlusIcon className="h-4 w-4 mr-1" />
            새 요청
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="센터호차, 배송지역, 기사명으로 검색..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="h-4 w-4 mr-1" />
              필터
            </Button>
            {selectedRequests.length > 0 && (
              <Button
                variant="outline"
                onClick={() => onExportSelected(selectedRequests)}
              >
                <DownloadIcon className="h-4 w-4 mr-1" />
                선택항목 내보내기 ({selectedRequests.length})
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <label className="text-sm font-medium mb-1 block">센터호차</label>
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
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">요청 목록을 불러오는 중...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <TruckIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-2">요청이 없습니다</p>
            <p className="text-sm text-gray-500">새 요청을 생성하거나 필터를 조정해보세요</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bulk Actions */}
          {filteredRequests.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded">
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
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map((request) => {
                const marginStatus = getMarginStatus(request.financialSummary.marginPercentage)
                const dispatchStatus = getDispatchStatus(request.financialSummary.dispatchCount)

                return (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Checkbox
                          checked={selectedRequests.includes(request.id)}
                          onCheckedChange={() => toggleSelectRequest(request.id)}
                        />
                        <Badge variant="outline" className="text-xs">
                          #{request.id.slice(-6)}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">📋 요청 #{request.id.slice(-8)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3 text-gray-500" />
                          {formatDate(request.requestDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <TruckIcon className="h-3 w-3 text-gray-500" />
                          {request.centerCarNo} ({request.vehicleTon}톤)
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-sm">
                        <MapPinIcon className="h-3 w-3 text-gray-500" />
                        <span className="truncate">
                          {request.regions.join(' → ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-xs text-blue-600">센터청구</div>
                          <div className="font-medium text-blue-800">
                            {formatCurrency(request.financialSummary.centerBilling)}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">{dispatchStatus.icon} {dispatchStatus.label}</div>
                          <div className={cn("font-medium", marginStatus.color)}>
                            {formatCurrency(request.financialSummary.totalMargin)} {marginStatus.label}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => onViewRequest(request)}
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          보기
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
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
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr className="text-left">
                        <th className="p-3">
                          <Checkbox
                            checked={selectedRequests.length === filteredRequests.length}
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                        <th className="p-3">요청정보</th>
                        <th className="p-3">배송정보</th>
                        <th className="p-3">요금정보</th>
                        <th className="p-3">배차상태</th>
                        <th className="p-3">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => {
                        const marginStatus = getMarginStatus(request.financialSummary.marginPercentage)
                        const dispatchStatus = getDispatchStatus(request.financialSummary.dispatchCount)

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
                                  {request.centerCarNo} ({request.vehicleTon}톤)
                                </div>
                              </div>
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
                                  {formatCurrency(request.financialSummary.centerBilling)}
                                </div>
                                <div className={cn("text-sm", marginStatus.color)}>
                                  {formatCurrency(request.financialSummary.totalMargin)} {marginStatus.label}
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
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
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
                >
                  다음
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}