'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useMemo, useEffect } from 'react'
import { Plus, MapPin, Upload, Download, CheckCircle, XCircle, TrendingUp, Phone, Navigation, Building2, QrCode, Map as MapIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { useAuth } from '@/hooks/useAuth'
import { 
  LoadingPointResponse, 
  useLoadingPoints,
  useCreateLoadingPoint,
  useUpdateLoadingPoint,
  useActivateLoadingPoint,
  useDeactivateLoadingPoint,
  useBulkActivateLoadingPoints,
  useBulkDeactivateLoadingPoints,
  useBulkDeleteLoadingPoints,
  useExportLoadingPoints,
  CreateLoadingPointData,
  UpdateLoadingPointData
} from '@/hooks/useLoadingPoints'
import { copyToClipboard, formatLoadingPointInfo, sendSMS, shareToKakao, makePhoneCall } from '@/lib/utils/share'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ContextMenu, ContextMenuItem } from '@/components/ui/ContextMenu'
import LoadingPointForm from '@/components/forms/LoadingPointForm'
import LoadingPointDetailDrawer from '@/components/loadingPoints/LoadingPointDetailDrawer'
import LoadingPointMapView from '@/components/loadingPoints/LoadingPointMapView'
import { ImportModal } from '@/components/import'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export default function LoadingPointsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [editingLoadingPoint, setEditingLoadingPoint] = useState<LoadingPointResponse | null>(null)
  const [detailLoadingPoint, setDetailLoadingPoint] = useState<LoadingPointResponse | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  
  const { hasPermission } = useAuth()

  // Data fetching
  const normalizedStatusFilter = statusFilter === 'all' ? undefined : statusFilter

  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useLoadingPoints(searchTerm, normalizedStatusFilter)
  
  const loadingPointsData = useMemo(() => {
    return data?.pages?.flatMap((page: any) => (page.items || page.data || [])) || []
  }, [data])

  const totalCount = useMemo(() => {
    const pages = data?.pages || []
    if (pages.length === 0) return 0
    const lastPage = pages[pages.length - 1]
    const firstPage = pages[0]
    return lastPage?.totalCount || firstPage?.totalCount || 0
  }, [data])
  
  // Mutations
  const createMutation = useCreateLoadingPoint()
  const updateMutation = useUpdateLoadingPoint()
  const activateMutation = useActivateLoadingPoint()
  const deactivateMutation = useDeactivateLoadingPoint()
  const bulkActivateMutation = useBulkActivateLoadingPoints()
  const bulkDeactivateMutation = useBulkDeactivateLoadingPoints()
  const bulkDeleteMutation = useBulkDeleteLoadingPoints()
  const exportMutation = useExportLoadingPoints()

  // Statistics calculation
  const stats = useMemo(() => {
    const totalPoints = loadingPointsData.length
    const activePoints = loadingPointsData.filter(p => p.isActive).length
    const inactivePoints = totalPoints - activePoints
    
    // 이번 달 신규 상차지 (createdAt 기준)
    const thisMonth = new Date()
    const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
    const newThisMonth = loadingPointsData.filter(p => 
      new Date(p.createdAt) >= monthStart
    ).length

    return {
      total: totalCount,
      active: activePoints,
      inactive: inactivePoints,
      newThisMonth
    }
  }, [loadingPointsData, totalCount])

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return loadingPointsData.filter(point => {
      const matchesSearch = !searchTerm || 
        point.centerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        point.loadingPointName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        point.roadAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        point.lotAddress?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && point.isActive) ||
        (statusFilter === 'inactive' && !point.isActive)

      const matchesRegion = regionFilter === 'all' ||
        point.roadAddress?.includes(regionFilter) ||
        point.lotAddress?.includes(regionFilter)

      return matchesSearch && matchesStatus && matchesRegion
    })
  }, [loadingPointsData, searchTerm, statusFilter, regionFilter])

  const hasActiveFilters = Boolean(
    searchTerm ||
    statusFilter !== 'all' ||
    regionFilter !== 'all'
  )

  // CRUD handlers
  const handleCreate = (data: CreateLoadingPointData) => {
    createMutation.mutate(data, {
      onSuccess: () => setCreateModalOpen(false)
    })
  }

  const handleUpdate = (data: UpdateLoadingPointData) => {
    if (!editingLoadingPoint) return
    updateMutation.mutate({ id: editingLoadingPoint.id, data }, {
      onSuccess: () => {
        setEditModalOpen(false)
        setEditingLoadingPoint(null)
      }
    })
  }

  const handleActivate = (id: string) => {
    activateMutation.mutate(id)
  }

  const handleDeactivate = (id: string) => {
    deactivateMutation.mutate(id)
  }

  // Bulk actions
  const handleBulkActivate = (ids: string[]) => {
    bulkActivateMutation.mutate(ids)
    setSelectedIds([])
  }

  const handleBulkDeactivate = (ids: string[]) => {
    bulkDeactivateMutation.mutate(ids)
    setSelectedIds([])
  }

  const handleBulkDelete = (ids: string[]) => {
    bulkDeleteMutation.mutate(ids)
    setSelectedIds([])
  }

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredData.map(p => p.id))
    }
  }

  const handleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  // Context menu and action handlers
  const handleCopyLoadingPoint = async (point: LoadingPointResponse) => {
    const loadingPointInfo = formatLoadingPointInfo(point)
    const success = await copyToClipboard(loadingPointInfo)
    if (success) {
      toast.success('상차지 정보가 클립보드에 복사되었습니다')
    } else {
      toast.error('클립보드 복사에 실패했습니다')
    }
  }

  const handleShareToKakao = async (point: LoadingPointResponse) => {
    try {
      const loadingPointInfo = formatLoadingPointInfo(point)
      await shareToKakao(`상차지 정보 - ${point.centerName} ${point.loadingPointName}`, loadingPointInfo)
      toast.success('카카오톡으로 공유되었습니다')
    } catch (error) {
      console.error('카카오톡 공유 실패:', error)
      toast.error('카카오톡 공유에 실패했습니다')
    }
  }

  const handleSendSMS = (point: LoadingPointResponse) => {
    try {
      const phone = point.phone1 || point.phone2
      if (!phone) {
        toast.error('연락처가 없는 상차지입니다')
        return
      }
      const loadingPointInfo = formatLoadingPointInfo(point)
      sendSMS(phone, loadingPointInfo)
      toast.success('SMS 앱이 실행되었습니다')
    } catch (error) {
      console.error('SMS 발송 실패:', error)
      toast.error('SMS 발송에 실패했습니다')
    }
  }

  const handlePhoneCall = (phoneNumber: string) => {
    try {
      makePhoneCall(phoneNumber)
    } catch (error) {
      console.error('전화 걸기 실패:', error)
      toast.error('전화 걸기에 실패했습니다')
    }
  }

  const handleEditLoadingPoint = (point: LoadingPointResponse) => {
    setEditingLoadingPoint(point)
    setEditModalOpen(true)
  }

  const handleViewDetail = (point: LoadingPointResponse) => {
    setDetailLoadingPoint(point)
    setDetailModalOpen(true)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
            <p className="text-gray-600 mb-4">{String(error)}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">상차지 관리</h1>
                <p className="text-lg text-gray-600 mt-1">물류센터 상차지를 효율적으로 관리하세요</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex bg-orange-50 rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all",
                    viewMode === 'list'
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                  )}
                >
                  목록 보기
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all",
                    viewMode === 'map'
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                  )}
                >
                  <MapIcon className="h-4 w-4 mr-1" />
                  지도 보기
                </Button>
              </div>

              <PermissionGate resource="loading-points" action="create">
                <Button 
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  상차지 등록
                </Button>
              </PermissionGate>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">전체 상차지</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.total.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">개소</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">활성 상차지</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.active.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">개소 운영중</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-red-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">비활성 상차지</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.inactive.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">개소 중단</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-yellow-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">이번 달 신규</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.newThisMonth.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">개소 추가</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="bg-white shadow-lg border-orange-100 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
                {/* Search Input */}
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="센터명, 상차지명, 주소로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-400/20 bg-white"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-11 border-2 border-orange-200 focus:border-orange-400 bg-white">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>

                {/* Region Filter */}
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-40 h-11 border-2 border-orange-200 focus:border-orange-400 bg-white">
                    <SelectValue placeholder="지역" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 지역</SelectItem>
                    <SelectItem value="서울">서울특별시</SelectItem>
                    <SelectItem value="경기">경기도</SelectItem>
                    <SelectItem value="인천">인천광역시</SelectItem>
                    <SelectItem value="부산">부산광역시</SelectItem>
                    <SelectItem value="대구">대구광역시</SelectItem>
                    <SelectItem value="광주">광주광역시</SelectItem>
                    <SelectItem value="대전">대전광역시</SelectItem>
                    <SelectItem value="울산">울산광역시</SelectItem>
                    <SelectItem value="강원">강원도</SelectItem>
                    <SelectItem value="충북">충청북도</SelectItem>
                    <SelectItem value="충남">충청남도</SelectItem>
                    <SelectItem value="전북">전라북도</SelectItem>
                    <SelectItem value="전남">전라남도</SelectItem>
                    <SelectItem value="경북">경상북도</SelectItem>
                    <SelectItem value="경남">경상남도</SelectItem>
                    <SelectItem value="제주">제주특별자치도</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-3">
                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {selectedIds.length}개 선택됨
                    </span>
                    <PermissionGate resource="loading-points" action="update">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkActivate(selectedIds)}
                        disabled={bulkActivateMutation.isPending}
                        className="border-green-200 text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        활성화
                      </Button>
                    </PermissionGate>
                    <PermissionGate resource="loading-points" action="update">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkDeactivate(selectedIds)}
                        disabled={bulkDeactivateMutation.isPending}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        비활성화
                      </Button>
                    </PermissionGate>
                  </div>
                )}

                {/* Action Buttons */}
                <PermissionGate resource="loading-points" action="read">
                  <Button
                    variant="outline"
                    onClick={() => setImportModalOpen(true)}
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    가져오기
                  </Button>
                </PermissionGate>

                <PermissionGate resource="loading-points" action="read">
                  <Button
                    variant="outline"
                    onClick={() => exportMutation.mutate('excel')}
                    disabled={exportMutation.isPending}
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exportMutation.isPending ? '내보내는 중...' : '내보내기'}
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-white shadow-lg border-orange-100">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
                <span className="text-gray-600">상차지 목록을 불러오는 중...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map View - Empty State */}
        {!isLoading && viewMode === 'map' && filteredData.length === 0 && (
          <Card className="bg-white shadow-lg border-orange-100">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="mb-4">
                  <MapIcon className="h-16 w-16 text-orange-300 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  지도에 표시할 상차지가 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  {hasActiveFilters
                    ? '검색 조건을 변경하거나 새로운 상차지를 등록해보세요.' 
                    : '새로운 상차지를 등록하여 지도에서 확인해보세요.'
                  }
                </p>
                <div className="flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setViewMode('list')}
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    목록 보기로 전환
                  </Button>
                  <PermissionGate resource="loading-points" action="create">
                    <Button 
                      onClick={() => setCreateModalOpen(true)}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      상차지 등록
                    </Button>
                  </PermissionGate>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* List View - Empty State */}
        {!isLoading && viewMode === 'list' && filteredData.length === 0 && (
          <Card className="bg-white shadow-lg border-orange-100">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="mb-4">
                  <MapPin className="h-16 w-16 text-orange-300 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {hasActiveFilters ? '검색 결과가 없습니다' : '등록된 상차지가 없습니다'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {hasActiveFilters
                    ? '검색 조건을 변경하거나 새로운 상차지를 등록해보세요.' 
                    : '새로운 상차지를 등록하여 시작해보세요.'
                  }
                </p>
                <PermissionGate resource="loading-points" action="create">
                  <Button 
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    상차지 등록
                  </Button>
                </PermissionGate>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map View */}
        {!isLoading && viewMode === 'map' && filteredData.length > 0 && (
          <LoadingPointMapView
            loadingPoints={filteredData}
            onPointSelect={(point) => {
              // 지도에서 선택된 상차지 처리
              console.log('Selected point:', point)
            }}
            onPointDetail={handleViewDetail}
            onPointEdit={handleEditLoadingPoint}
            onPointCall={handlePhoneCall}
            className="mb-6"
          />
        )}

        {/* Loading Points Table */}
        {!isLoading && viewMode === 'list' && filteredData.length > 0 && (
          <Card className="bg-white shadow-lg border-orange-100">
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-orange-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-orange-300 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        전체 선택
                      </span>
                    </label>
                  </div>
                  <div className="text-sm text-gray-600">
                    총 {filteredData.length.toLocaleString()}개
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-orange-100">
                {filteredData.map((point, index) => (
                  <ContextMenu
                    key={point.id}
                    items={[
                      {
                        id: 'view',
                        label: '상세 보기',
                        icon: <MapPin className="h-4 w-4" />,
                        onClick: () => handleViewDetail(point)
                      },
                      {
                        id: 'edit',
                        label: '수정',
                        icon: <Building2 className="h-4 w-4" />,
                        onClick: () => handleEditLoadingPoint(point)                      },
                      {
                        id: 'copy',
                        label: '정보 복사',
                        icon: <Phone className="h-4 w-4" />,
                        onClick: () => handleCopyLoadingPoint(point)
                      },
                      {
                        id: 'kakao',
                        label: '카카오톡 공유',
                        icon: <Navigation className="h-4 w-4" />,
                        onClick: () => handleShareToKakao(point)
                      },
                      ...(point.phone1 || point.phone2 ? [
                        ...(point.phone1 ? [{
                          id: 'phone1',
                          label: `전화 (${point.phone1})`,
                          icon: <Phone className="h-4 w-4" />,
                          onClick: () => handlePhoneCall(point.phone1!)
                        }] : []),
                        ...(point.phone2 && point.phone2 !== point.phone1 ? [{
                          id: 'phone2',
                          label: `전화 (${point.phone2})`,
                          icon: <Phone className="h-4 w-4" />,
                          onClick: () => handlePhoneCall(point.phone2!)
                        }] : []),
                        {
                          id: 'sms',
                          label: 'SMS 전송',
                          icon: <QrCode className="h-4 w-4" />,
                          onClick: () => handleSendSMS(point)
                        }
                      ] : []),
                      {
                        id: 'toggle',
                        label: point.isActive ? '비활성화' : '활성화',
                        icon: point.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
                        onClick: () => point.isActive ? handleDeactivate(point.id) : handleActivate(point.id)
                      }
                    ]}
                  >
                    <div className="p-6 hover:bg-orange-50/50 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-4">
                        {/* Checkbox */}
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(point.id)}
                            onChange={() => handleSelectItem(point.id)}
                            className="rounded border-orange-300 text-orange-500 focus:ring-orange-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 mr-4">
                              {/* Center and Loading Point Name */}
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-bold text-gray-900 truncate">
                                  {point.centerName}
                                </h3>
                                <Badge
                                  variant={point.isActive ? "default" : "secondary"}
                                  className={cn(
                                    "text-xs font-semibold",
                                    point.isActive 
                                      ? "bg-green-100 text-green-800 border-green-200" 
                                      : "bg-red-100 text-red-800 border-red-200"
                                  )}
                                >
                                  {point.isActive ? '활성' : '비활성'}
                                </Badge>
                              </div>

                              <div className="text-base font-medium text-orange-600 mb-2">
                                {point.loadingPointName}
                              </div>

                              {/* Address */}
                              <div className="space-y-1 mb-3">
                                {point.roadAddress && (
                                  <div className="text-sm text-gray-700">
                                    <span className="font-medium">도로명: </span>
                                    {point.roadAddress}
                                  </div>
                                )}
                                {point.lotAddress && (
                                  <div className="text-sm text-gray-500">
                                    <span className="font-medium">지번: </span>
                                    {point.lotAddress}
                                  </div>
                                )}
                              </div>

                              {/* Contact Info */}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                {point.manager1 && (
                                  <div className="flex items-center space-x-1">
                                    <span className="font-medium">{point.manager1}</span>
                                    {point.phone1 && (
                                      <a 
                                        href={`tel:${point.phone1}`}
                                        className="text-orange-600 hover:text-orange-700 ml-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {point.phone1}
                                      </a>
                                    )}
                                  </div>
                                )}
                                {point.manager2 && (
                                  <div className="flex items-center space-x-1">
                                    <span className="font-medium">{point.manager2}</span>
                                    {point.phone2 && (
                                      <a 
                                        href={`tel:${point.phone2}`}
                                        className="text-orange-600 hover:text-orange-700 ml-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {point.phone2}
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Remarks */}
                              {point.remarks && (
                                <div className="mt-2 text-sm text-gray-500">
                                  <span className="font-medium">비고: </span>
                                  {point.remarks}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex-shrink-0 flex items-center space-x-2">
                              <PermissionGate resource="loading-points" action="read">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewDetail(point)
                                  }}
                                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                                >
                                  <MapPin className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              <PermissionGate resource="loading-points" action="update">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditLoadingPoint(point)
                                  }}
                                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                                >
                                  <Building2 className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              {(point.phone1 || point.phone2) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePhoneCall(point.phone1 || point.phone2!)
                                  }}
                                  className="border-green-200 text-green-600 hover:bg-green-50"
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ContextMenu>
                ))}
              </div>

              {/* Load More */}
              {hasNextPage && (
                <div className="p-6 border-t border-orange-100">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                        불러오는 중...
                      </>
                    ) : (
                      '더 보기'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              상차지 등록
            </DialogTitle>
          </DialogHeader>
          <LoadingPointForm
            onSubmit={handleCreate}
            isLoading={createMutation.isPending}
            onCancel={() => setCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              상차지 수정
            </DialogTitle>
          </DialogHeader>
          <LoadingPointForm
            loadingPoint={editingLoadingPoint}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
            onCancel={() => {
              setEditModalOpen(false)
              setEditingLoadingPoint(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <LoadingPointDetailDrawer
        loadingPoint={detailLoadingPoint}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setDetailLoadingPoint(null)
        }}
        onEdit={() => {
          if (detailLoadingPoint) {
            setEditingLoadingPoint(detailLoadingPoint)
            setEditModalOpen(true)
            setDetailModalOpen(false)
            setDetailLoadingPoint(null)
          }
        }}
        onCall={handlePhoneCall}
        onSMS={() => detailLoadingPoint && handleSendSMS(detailLoadingPoint)}
        onShare={() => detailLoadingPoint && handleShareToKakao(detailLoadingPoint)}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="loading-points"
        onSuccess={() => {
          window.location.reload()
        }}
      />
    </div>
  )
}
