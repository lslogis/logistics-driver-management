'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useMemo } from 'react'
import { Truck, Eye, Edit, Copy, Share2, CheckCircle, XCircle, Fuel, Calendar, Settings, User, MapPin, Activity } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ContextMenuItem } from '@/components/ui/ContextMenu'
import { ThemedManagementPage } from '@/components/shared/ThemedManagementPage'
import { ColorTheme } from '@/components/shared/ColorThemeProvider'
import { Vehicle, CreateVehicleData, UpdateVehicleData, VEHICLE_TYPE_LABELS, FUEL_TYPE_LABELS, OWNER_TYPE_LABELS, VEHICLE_STATUS_LABELS } from '@/types/management'
import { dummyVehicles } from '@/data/dummyData'
import { cn } from '@/lib/utils'

// Mock hooks for demonstration
const useEnhancedVehicles = (search: string, statusFilter: string) => {
  const filteredData = useMemo(() => {
    return dummyVehicles.filter(vehicle => {
      const matchesSearch = !search || 
        vehicle.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.driverName?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && vehicle.isActive) ||
        (statusFilter === 'inactive' && !vehicle.isActive)

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

const useMockVehicleMutations = () => ({
  create: { mutate: (data: any) => toast.success('차량이 등록되었습니다'), isPending: false },
  update: { mutate: (data: any) => toast.success('차량 정보가 수정되었습니다'), isPending: false },
  activate: { mutate: (id: string) => toast.success('차량이 활성화되었습니다') },
  deactivate: { mutate: (id: string) => toast.success('차량이 비활성화되었습니다') },
  bulkActivate: { mutate: (ids: string[]) => toast.success(`${ids.length}대의 차량이 활성화되었습니다`) },
  bulkDeactivate: { mutate: (ids: string[]) => toast.success(`${ids.length}대의 차량이 비활성화되었습니다`) },
  bulkDelete: { mutate: (ids: string[]) => toast.success(`${ids.length}대의 차량이 삭제되었습니다`) },
  export: { mutate: () => toast.success('엑셀 파일이 다운로드되었습니다'), isPending: false }
})

// Vehicle Form
const EnhancedVehicleForm: React.FC<{
  vehicle?: Vehicle
  onSubmit: (data: CreateVehicleData | UpdateVehicleData) => void
  isLoading: boolean
  onCancel: () => void
}> = ({ vehicle, onSubmit, isLoading, onCancel }) => (
  <div className="p-6">
    <div className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">차량번호 *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.vehicleNumber}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">차량유형 *</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.vehicleType}
              required
            >
              <option value="">선택하세요</option>
              <option value="small">소형</option>
              <option value="medium">중형</option>
              <option value="large">대형</option>
              <option value="extra_large">특대형</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제조사</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.brand}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">모델명</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.model}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연식</label>
            <input
              type="number"
              min="2000"
              max={new Date().getFullYear() + 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.year}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연료타입</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.fuel}
            >
              <option value="">선택하세요</option>
              <option value="gasoline">휘발유</option>
              <option value="diesel">경유</option>
              <option value="lpg">LPG</option>
              <option value="electric">전기</option>
              <option value="hybrid">하이브리드</option>
            </select>
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">차량 사양</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">적재량 (톤)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.capacity}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연비 (km/l)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.fuelEfficiency}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주행거리 (km)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.mileage}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">길이 (m)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.dimensions.length}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">너비 (m)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.dimensions.width}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">높이 (m)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.dimensions.height}
            />
          </div>
        </div>
      </div>

      {/* Owner Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">소유자 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">소유형태</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.ownerType}
            >
              <option value="">선택하세요</option>
              <option value="company">회사</option>
              <option value="individual">개인</option>
              <option value="rental">임대</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">소유자명</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.ownerName}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.ownerContact}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">등록지역</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.registrationRegion}
            />
          </div>
        </div>
      </div>

      {/* Important Dates */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">중요 일정</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">등록일</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.registrationDate.toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">보험만료일</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.insuranceExpiry.toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">검사만료일</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              defaultValue={vehicle?.inspectionExpiry.toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>취소</Button>
        <Button 
          onClick={() => onSubmit({})} 
          disabled={isLoading}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          {isLoading ? '저장 중...' : (vehicle ? '수정' : '등록')}
        </Button>
      </div>
    </div>
  </div>
)

export default function EnhancedVehiclesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
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
  } = useEnhancedVehicles(searchTerm, statusFilter)
  
  const vehiclesData = useMemo(() => {
    return data?.pages?.flatMap((page: any) => (page.items || page.data || [])) || []
  }, [data])

  const totalCount = vehiclesData.length

  // Mutations
  const mutations = useMockVehicleMutations()

  // Filter data
  const filteredData = useMemo(() => {
    return vehiclesData.filter(vehicle => {
      const matchesVehicleStatus = vehicleStatusFilter === 'all' || vehicle.status === vehicleStatusFilter
      return matchesVehicleStatus
    })
  }, [vehiclesData, vehicleStatusFilter])

  // CRUD handlers
  const handleCreate = (data: CreateVehicleData) => {
    mutations.create.mutate(data)
    setCreateModalOpen(false)
  }

  const handleUpdate = (data: UpdateVehicleData) => {
    if (!editingVehicle) return
    mutations.update.mutate({ id: editingVehicle.id, data })
    setEditModalOpen(false)
    setEditingVehicle(null)
  }

  const handleActivate = (id: string) => mutations.activate.mutate(id)
  const handleDeactivate = (id: string) => mutations.deactivate.mutate(id)

  // Helper functions
  const handleCopyVehicleInfo = (vehicle: Vehicle) => {
    const info = `차량번호: ${vehicle.vehicleNumber}\n제조사: ${vehicle.brand}\n모델: ${vehicle.model}\n연식: ${vehicle.year}년\n적재량: ${vehicle.capacity}톤`
    navigator.clipboard.writeText(info)
    toast.success('차량 정보가 복사되었습니다')
  }

  const handleShareVehicle = (vehicle: Vehicle) => {
    toast.success('차량 정보가 공유되었습니다')
  }

  // Context menu items
  const getContextMenuItems = (vehicle: Vehicle): ContextMenuItem[] => [
    {
      id: 'view',
      label: '상세 보기',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => toast.info(`${vehicle.vehicleNumber} 상세 정보`)
    },
    {
      id: 'edit',
      label: '수정',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => {
        setEditingVehicle(vehicle)
        setEditModalOpen(true)
      }
    },
    {
      id: 'copy',
      label: '정보 복사',
      icon: <Copy className="h-4 w-4" />,
      onClick: () => handleCopyVehicleInfo(vehicle)
    },
    {
      id: 'share',
      label: '공유',
      icon: <Share2 className="h-4 w-4" />,
      onClick: () => handleShareVehicle(vehicle)
    },
    {
      id: 'maintenance',
      label: '정비 기록',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => toast.info(`${vehicle.vehicleNumber} 정비 기록`)
    },
    {
      id: 'toggle',
      label: vehicle.isActive ? '비활성화' : '활성화',
      icon: vehicle.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
      onClick: () => vehicle.isActive ? handleDeactivate(vehicle.id) : handleActivate(vehicle.id)
    }
  ]

  // Get status badge color
  const getStatusBadgeColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_use':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'retired':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // Check if date is soon (within 30 days)
  const isDateSoon = (date: Date) => {
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays >= 0
  }

  // Check if date is overdue
  const isDateOverdue = (date: Date) => {
    const today = new Date()
    return date < today
  }

  // Render item function
  const renderItem = (vehicle: Vehicle, theme: ColorTheme) => (
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0 mr-4">
        {/* Vehicle Number and Status */}
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {vehicle.vehicleNumber}
          </h3>
          <Badge
            variant={vehicle.isActive ? "default" : "secondary"}
            className={cn(
              "text-xs font-semibold",
              vehicle.isActive 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-red-100 text-red-800 border-red-200"
            )}
          >
            {vehicle.isActive ? '활성' : '비활성'}
          </Badge>
          <Badge
            variant="outline"
            className={cn("text-xs font-semibold", getStatusBadgeColor(vehicle.status))}
          >
            {VEHICLE_STATUS_LABELS[vehicle.status]}
          </Badge>
        </div>

        {/* Vehicle Info */}
        <div className={cn("text-base font-medium mb-2", theme.primaryText)}>
          {vehicle.brand} {vehicle.model} ({vehicle.year}년)
        </div>

        {/* Specifications */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-700">
            <Truck className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">유형:</span>
            <span className="ml-1">{VEHICLE_TYPE_LABELS[vehicle.vehicleType]}</span>
            <span className="ml-3 font-medium">적재량:</span>
            <span className="ml-1">{vehicle.capacity}톤</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <Fuel className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">연료:</span>
            <span className="ml-1">{FUEL_TYPE_LABELS[vehicle.fuel]}</span>
            <span className="ml-3 font-medium">연비:</span>
            <span className="ml-1">{vehicle.fuelEfficiency}km/l</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <span className="font-medium">크기:</span>
            <span className="ml-1">{vehicle.dimensions.length}m × {vehicle.dimensions.width}m × {vehicle.dimensions.height}m</span>
          </div>
        </div>

        {/* Driver and Owner Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          {vehicle.driverName && (
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span className="font-medium">기사:</span>
              <span>{vehicle.driverName}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <span className="font-medium">소유:</span>
            <span>{OWNER_TYPE_LABELS[vehicle.ownerType]} ({vehicle.ownerName})</span>
          </div>
        </div>

        {/* Location and Mileage */}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
          <div className="text-gray-700">
            <MapPin className="h-4 w-4 inline mr-1" />
            <span className="font-medium">등록지:</span>
            <span className="ml-1">{vehicle.registrationRegion}</span>
          </div>
          <div className="text-gray-700">
            <Activity className="h-4 w-4 inline mr-1" />
            <span className="font-medium">주행거리:</span>
            <span className="ml-1">{vehicle.mileage.toLocaleString()}km</span>
          </div>
        </div>

        {/* Important Dates with status indicators */}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
          <div className={cn(
            "flex items-center",
            isDateOverdue(vehicle.insuranceExpiry) ? "text-red-600" : 
            isDateSoon(vehicle.insuranceExpiry) ? "text-yellow-600" : "text-gray-700"
          )}>
            <Calendar className="h-4 w-4 inline mr-1" />
            <span className="font-medium">보험만료:</span>
            <span className="ml-1">{formatDate(vehicle.insuranceExpiry)}</span>
            {isDateOverdue(vehicle.insuranceExpiry) && <span className="ml-1 text-red-600">만료</span>}
            {isDateSoon(vehicle.insuranceExpiry) && !isDateOverdue(vehicle.insuranceExpiry) && 
              <span className="ml-1 text-yellow-600">임박</span>}
          </div>
          <div className={cn(
            "flex items-center",
            isDateOverdue(vehicle.inspectionExpiry) ? "text-red-600" : 
            isDateSoon(vehicle.inspectionExpiry) ? "text-yellow-600" : "text-gray-700"
          )}>
            <span className="font-medium">검사만료:</span>
            <span className="ml-1">{formatDate(vehicle.inspectionExpiry)}</span>
            {isDateOverdue(vehicle.inspectionExpiry) && <span className="ml-1 text-red-600">만료</span>}
            {isDateSoon(vehicle.inspectionExpiry) && !isDateOverdue(vehicle.inspectionExpiry) && 
              <span className="ml-1 text-yellow-600">임박</span>}
          </div>
        </div>

        {/* Notes */}
        {vehicle.notes && (
          <div className="mt-2 text-sm text-gray-500">
            <span className="font-medium">비고:</span>
            <span className="ml-1">{vehicle.notes}</span>
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
            toast.info(`${vehicle.vehicleNumber} 상세 정보`)
          }}
          className="border-green-200 text-green-600 hover:bg-green-50"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setEditingVehicle(vehicle)
            setEditModalOpen(true)
          }}
          className="border-green-200 text-green-600 hover:bg-green-50"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            toast.info(`${vehicle.vehicleNumber} 정비 기록`)
          }}
          className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <ThemedManagementPage
        theme="vehicles"
        title="용차관리"
        subtitle="운송 차량을 체계적으로 관리하세요"
        icon={<Truck />}
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
            label: '운행상태',
            value: vehicleStatusFilter,
            onChange: setVehicleStatusFilter,
            options: [
              { value: 'all', label: '전체 상태' },
              { value: 'available', label: '사용가능' },
              { value: 'in_use', label: '운행중' },
              { value: 'maintenance', label: '정비중' },
              { value: 'retired', label: '퇴역' }
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
        emptyStateMessage="등록된 차량이 없습니다"
        emptyStateAction="새로운 차량을 등록하여 시작해보세요"
      />

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              차량 등록
            </DialogTitle>
          </DialogHeader>
          <EnhancedVehicleForm
            onSubmit={handleCreate}
            isLoading={mutations.create.isPending}
            onCancel={() => setCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              차량 정보 수정
            </DialogTitle>
          </DialogHeader>
          <EnhancedVehicleForm
            vehicle={editingVehicle || undefined}
            onSubmit={handleUpdate}
            isLoading={mutations.update.isPending}
            onCancel={() => {
              setEditModalOpen(false)
              setEditingVehicle(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}