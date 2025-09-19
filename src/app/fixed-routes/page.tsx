'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useMemo } from 'react'
import { Route, Eye, Edit, Copy, Share2, CheckCircle, XCircle, MapPin, Clock, Truck, Calendar } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ContextMenuItem } from '@/components/ui/ContextMenu'
import { ThemedManagementPage } from '@/components/shared/ThemedManagementPage'
import { ColorTheme } from '@/components/shared/ColorThemeProvider'
import { FixedRoute, CreateFixedRouteData, UpdateFixedRouteData, VEHICLE_TYPE_LABELS, FREQUENCY_LABELS } from '@/types/management'
import { dummyFixedRoutes } from '@/data/dummyData'
import { cn } from '@/lib/utils'

// Mock hooks for demonstration
const useFixedRoutes = (search: string, statusFilter: string) => {
  const filteredData = useMemo(() => {
    return dummyFixedRoutes.filter(route => {
      const matchesSearch = !search || 
        route.routeName.toLowerCase().includes(search.toLowerCase()) ||
        route.routeCode.toLowerCase().includes(search.toLowerCase()) ||
        route.origin.toLowerCase().includes(search.toLowerCase()) ||
        route.destination.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && route.isActive) ||
        (statusFilter === 'inactive' && !route.isActive)

      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter])

  return {
    data: { pages: [{ items: filteredData }] },
    isLoading: false,
    error: null,
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false
  }
}

const useMockMutations = () => ({
  create: { mutate: (data: any) => toast.success('고정노선이 등록되었습니다'), isPending: false },
  update: { mutate: (data: any) => toast.success('고정노선이 수정되었습니다'), isPending: false },
  activate: { mutate: (id: string) => toast.success('고정노선이 활성화되었습니다') },
  deactivate: { mutate: (id: string) => toast.success('고정노선이 비활성화되었습니다') },
  bulkActivate: { mutate: (ids: string[]) => toast.success(`${ids.length}개 노선이 활성화되었습니다`) },
  bulkDeactivate: { mutate: (ids: string[]) => toast.success(`${ids.length}개 노선이 비활성화되었습니다`) },
  bulkDelete: { mutate: (ids: string[]) => toast.success(`${ids.length}개 노선이 삭제되었습니다`) },
  export: { mutate: () => toast.success('엑셀 파일이 다운로드되었습니다'), isPending: false }
})

// Form components (placeholder)
const FixedRouteForm: React.FC<{
  route?: FixedRoute
  onSubmit: (data: CreateFixedRouteData | UpdateFixedRouteData) => void
  isLoading: boolean
  onCancel: () => void
}> = ({ route, onSubmit, isLoading, onCancel }) => (
  <div className="p-6">
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">노선명</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue={route?.routeName}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">노선코드</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue={route?.routeCode}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">출발지</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue={route?.origin}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">도착지</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue={route?.destination}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>취소</Button>
        <Button 
          onClick={() => onSubmit({})} 
          disabled={isLoading}
          className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
        >
          {isLoading ? '저장 중...' : (route ? '수정' : '등록')}
        </Button>
      </div>
    </div>
  </div>
)

export default function FixedRoutesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<FixedRoute | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Data fetching
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useFixedRoutes(searchTerm, statusFilter)
  
  const routesData = useMemo(() => {
    return data?.pages?.flatMap((page: any) => (page.items || page.data || [])) || []
  }, [data])

  const totalCount = routesData.length

  // Mutations
  const mutations = useMockMutations()

  // Filter data
  const filteredData = useMemo(() => {
    return routesData.filter(route => {
      const matchesVehicleType = vehicleTypeFilter === 'all' || route.vehicleType === vehicleTypeFilter
      return matchesVehicleType
    })
  }, [routesData, vehicleTypeFilter])

  // CRUD handlers
  const handleCreate = (data: CreateFixedRouteData) => {
    mutations.create.mutate(data)
    setCreateModalOpen(false)
  }

  const handleUpdate = (data: UpdateFixedRouteData) => {
    if (!editingRoute) return
    mutations.update.mutate({ id: editingRoute.id, data })
    setEditModalOpen(false)
    setEditingRoute(null)
  }

  const handleActivate = (id: string) => mutations.activate.mutate(id)
  const handleDeactivate = (id: string) => mutations.deactivate.mutate(id)

  // Context menu items
  const getContextMenuItems = (route: FixedRoute): ContextMenuItem[] => [
    {
      id: 'view',
      label: '상세 보기',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => toast.info(`${route.routeName} 상세 정보`)
    },
    {
      id: 'edit',
      label: '수정',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => {
        setEditingRoute(route)
        setEditModalOpen(true)
      }
    },
    {
      id: 'copy',
      label: '정보 복사',
      icon: <Copy className="h-4 w-4" />,
      onClick: () => toast.success('노선 정보가 복사되었습니다')
    },
    {
      id: 'share',
      label: '공유',
      icon: <Share2 className="h-4 w-4" />,
      onClick: () => toast.success('노선 정보가 공유되었습니다')
    },
    {
      id: 'toggle',
      label: route.isActive ? '비활성화' : '활성화',
      icon: route.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
      onClick: () => route.isActive ? handleDeactivate(route.id) : handleActivate(route.id)
    }
  ]

  // Render item function
  const renderItem = (route: FixedRoute, theme: ColorTheme) => (
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0 mr-4">
        {/* Route Name and Code */}
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {route.routeName}
          </h3>
          <Badge
            variant={route.isActive ? "default" : "secondary"}
            className={cn(
              "text-xs font-semibold",
              route.isActive 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-red-100 text-red-800 border-red-200"
            )}
          >
            {route.isActive ? '활성' : '비활성'}
          </Badge>
        </div>

        <div className={cn("text-base font-medium mb-2", theme.primaryText)}>
          {route.routeCode}
        </div>

        {/* Route Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-700">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">출발:</span>
            <span className="ml-1">{route.origin}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">도착:</span>
            <span className="ml-1">{route.destination}</span>
          </div>
        </div>

        {/* Route Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Route className="h-4 w-4" />
            <span>{route.distance}km</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{Math.floor(route.estimatedTime / 60)}시간 {route.estimatedTime % 60}분</span>
          </div>
          <div className="flex items-center space-x-1">
            <Truck className="h-4 w-4" />
            <span>{VEHICLE_TYPE_LABELS[route.vehicleType]}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{FREQUENCY_LABELS[route.frequency]}</span>
          </div>
        </div>

        {/* Driver and Price Info */}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
          {route.driverName && (
            <div className="text-gray-700">
              <span className="font-medium">담당기사:</span>
              <span className="ml-1">{route.driverName}</span>
            </div>
          )}
          <div className="text-gray-700">
            <span className="font-medium">기본요금:</span>
            <span className="ml-1 font-semibold">{route.basePrice.toLocaleString()}원</span>
          </div>
        </div>

        {/* Notes */}
        {route.notes && (
          <div className="mt-2 text-sm text-gray-500">
            <span className="font-medium">비고:</span>
            <span className="ml-1">{route.notes}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            toast.info(`${route.routeName} 상세 정보`)
          }}
          className={cn("border-indigo-200 text-indigo-600 hover:bg-indigo-50")}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setEditingRoute(route)
            setEditModalOpen(true)
          }}
          className={cn("border-indigo-200 text-indigo-600 hover:bg-indigo-50")}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <ThemedManagementPage
        theme="fixed-routes"
        title="고정관리"
        subtitle="정기 운송 노선을 효율적으로 관리하세요"
        icon={<Route />}
        data={filteredData}
        totalCount={totalCount}
        isLoading={isLoading}
        error={error}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        additionalFilters={[
          {
            label: '차량유형',
            value: vehicleTypeFilter,
            onChange: setVehicleTypeFilter,
            options: [
              { value: 'all', label: '전체 유형' },
              { value: 'small', label: '소형' },
              { value: 'medium', label: '중형' },
              { value: 'large', label: '대형' },
              { value: 'extra_large', label: '특대형' }
            ]
          }
        ]}
        onCreateClick={() => setCreateModalOpen(true)}
        onImportClick={() => setImportModalOpen(true)}
        onExportClick={() => mutations.export.mutate()}
        renderItem={renderItem}
        getContextMenuItems={getContextMenuItems}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onBulkActivate={(ids) => mutations.bulkActivate.mutate(ids)}
        onBulkDeactivate={(ids) => mutations.bulkDeactivate.mutate(ids)}
        onBulkDelete={(ids) => mutations.bulkDelete.mutate(ids)}
        emptyStateMessage="등록된 고정노선이 없습니다"
        emptyStateAction="새로운 고정노선을 등록하여 시작해보세요"
      />

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              고정노선 등록
            </DialogTitle>
          </DialogHeader>
          <FixedRouteForm
            onSubmit={handleCreate}
            isLoading={mutations.create.isPending}
            onCancel={() => setCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              고정노선 수정
            </DialogTitle>
          </DialogHeader>
          <FixedRouteForm
            route={editingRoute || undefined}
            onSubmit={handleUpdate}
            isLoading={mutations.update.isPending}
            onCancel={() => {
              setEditModalOpen(false)
              setEditingRoute(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}