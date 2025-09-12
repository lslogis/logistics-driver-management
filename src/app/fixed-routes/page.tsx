'use client'

import { useState } from 'react'
import React from 'react'
import { MapPin, Plus, Upload, Download, Filter } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  CreateFixedRouteData,
  UpdateFixedRouteData,
  FixedRouteResponse,
  ContractType,
  VehicleType
} from '@/lib/validations/fixedRoute'
import ManagementPageLayout from '@/components/layout/ManagementPageLayout'
import { DataTable, commonActions } from '@/components/ui/DataTable'
import { ExportButton } from '@/components/ExportButton'
import { CreateFixedRouteModal, EditFixedRouteModal } from '@/components/ui/FixedRouteModals'
import { getFixedRouteTableColumns, FixedRouteMobileCard } from '@/components/ui/FixedRouteTableConfig'
import FixedRouteFilters from '@/components/ui/FixedRouteFilters'

// Mock hooks - replace with actual hooks when backend is ready
const useFixedRoutes = (params: any) => {
  const [data, setData] = useState({
    fixedRoutes: [
      {
        id: '1',
        courseName: '서울-부산 정기노선',
        loadingPoint: '서울 물류센터',
        vehicleType: '25TON' as VehicleType,
        contractType: 'MONTHLY' as ContractType,
        assignedDriverId: '1',
        startDate: '2024-01-01',
        weekdayPattern: [1, 2, 3, 4, 5],
        billingFare: '450000',
        driverFare: '350000',
        monthlyBaseFare: '5000000',
        distance: 325.5,
        remarks: '고속도로 우선, 야간 운행 가능',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        assignedDriver: {
          id: '1',
          name: '김철수',
          phone: '010-1234-5678',
          vehicleNumber: '서울12가3456'
        },
        _count: { trips: 45 }
      },
      {
        id: '2',
        courseName: '인천-대구 냉동차',
        loadingPoint: '인천 냉동창고',
        vehicleType: 'REFRIGERATED' as VehicleType,
        contractType: 'COMPLETE' as ContractType,
        assignedDriverId: '2',
        startDate: '2024-02-01',
        weekdayPattern: [1, 3, 5],
        billingFare: '380000',
        driverFare: '300000',
        monthlyBaseFare: '4500000',
        distance: 287.3,
        remarks: null,
        isActive: true,
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-01T00:00:00Z',
        assignedDriver: {
          id: '2',
          name: '박영희',
          phone: '010-2345-6789',
          vehicleNumber: '인천34나5678'
        },
        _count: { trips: 23 }
      },
      {
        id: '3',
        courseName: '광주-전주 카고',
        loadingPoint: '광주 공단',
        vehicleType: 'CARGO' as VehicleType,
        contractType: 'DAILY' as ContractType,
        assignedDriverId: null,
        startDate: '2024-03-01',
        weekdayPattern: [1, 2, 3, 4, 5, 6],
        billingFare: '180000',
        driverFare: '150000',
        monthlyBaseFare: null,
        distance: 95.2,
        remarks: '단거리 배송',
        isActive: false,
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2024-03-01T00:00:00Z',
        assignedDriver: null,
        _count: { trips: 8 }
      }
    ] as FixedRouteResponse[],
    pagination: {
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    }
  })
  
  return { data, isLoading: false, error: null }
}

const useCreateFixedRoute = () => ({
  mutate: (data: CreateFixedRouteData, options?: any) => {
    toast.success('고정노선이 등록되었습니다')
    options?.onSuccess?.()
  },
  isPending: false
})

const useUpdateFixedRoute = () => ({
  mutate: ({ id, data }: { id: string, data: UpdateFixedRouteData }, options?: any) => {
    toast.success('고정노선이 수정되었습니다')
    options?.onSuccess?.()
  },
  isPending: false
})

const useDeleteFixedRoute = () => ({
  mutate: (id: string) => {
    toast.success('고정노선이 비활성화되었습니다')
  },
  isPending: false
})

const useExportFixedRoutes = () => ({
  mutate: (format: string) => {
    toast.success(`${format.toUpperCase()} 파일로 내보내기가 완료되었습니다`)
  },
  isPending: false
})

export default function FixedRoutesPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    isActive: undefined as boolean | undefined,
    contractType: undefined as ContractType | undefined,
    vehicleType: undefined as VehicleType | undefined,
    assignedDriverId: undefined as string | undefined,
    weekday: undefined as number | undefined
  })
  const [showFilters, setShowFilters] = useState(false)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingFixedRoute, setEditingFixedRoute] = useState<FixedRouteResponse | null>(null)

  const { data, isLoading, error } = useFixedRoutes({
    page,
    limit: 20,
    ...filters
  })

  const createMutation = useCreateFixedRoute()
  const updateMutation = useUpdateFixedRoute()
  const deleteMutation = useDeleteFixedRoute()
  const exportMutation = useExportFixedRoutes()

  const handleCreate = (data: CreateFixedRouteData) => {
    createMutation.mutate(data, {
      onSuccess: () => setCreateModalOpen(false)
    })
  }

  const handleEdit = (fixedRoute: FixedRouteResponse) => {
    setEditingFixedRoute(fixedRoute)
    setEditModalOpen(true)
  }

  const handleUpdate = (data: UpdateFixedRouteData) => {
    if (!editingFixedRoute) return
    updateMutation.mutate({ id: editingFixedRoute.id, data }, {
      onSuccess: () => {
        setEditModalOpen(false)
        setEditingFixedRoute(null)
      }
    })
  }

  const handleDelete = (fixedRouteId: string) => {
    if (confirm('정말 이 고정노선을 비활성화하시겠습니까?')) {
      deleteMutation.mutate(fixedRouteId)
    }
  }

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      isActive: undefined,
      contractType: undefined,
      vehicleType: undefined,
      assignedDriverId: undefined,
      weekday: undefined
    })
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  )

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  // Table columns and actions
  const columns = getFixedRouteTableColumns()
  
  const actions = [
    commonActions.edit(
      (fixedRoute: FixedRouteResponse) => handleEdit(fixedRoute),
      () => true
    ),
    commonActions.delete(
      (fixedRoute: FixedRouteResponse) => handleDelete(fixedRoute.id),
      (fixedRoute: FixedRouteResponse) => fixedRoute.isActive
    ),
  ]

  return (
    <ManagementPageLayout
      title="고정관리"
      subtitle="고정노선 정보를 등록하고 관리합니다"
      icon={<MapPin />}
      totalCount={data?.pagination?.total}
      countLabel="개"
      primaryAction={{
        label: '고정노선 등록',
        onClick: () => setCreateModalOpen(true),
        icon: <Plus className="h-4 w-4" />,
      }}
      secondaryActions={[
        {
          label: 'CSV 가져오기',
          href: '/import/fixed-routes',
          icon: <Upload className="h-4 w-4" />,
        },
        {
          label: '고급 필터',
          onClick: () => setShowFilters(!showFilters),
          icon: <Filter className="h-4 w-4" />,
          active: showFilters || hasActiveFilters
        }
      ]}
      exportAction={{
        label: '목록 내보내기',
        onClick: (format) => exportMutation.mutate(format),
        loading: exportMutation.isPending,
      }}
      isLoading={isLoading}
      error={error instanceof Error ? error.message : undefined}
    >
      {/* Advanced Filters */}
      {showFilters && (
        <div className="mb-6">
          <FixedRouteFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>
      )}

      {/* Quick Filter Badges */}
      {hasActiveFilters && !showFilters && (
        <div className="mb-4 flex items-center space-x-2">
          <span className="text-sm text-gray-500">필터 적용:</span>
          <button
            onClick={() => setShowFilters(true)}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            <Filter className="h-3 w-3 mr-1" />
            {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== null).length}개 필터
          </button>
          <button
            onClick={handleClearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            모두 지우기
          </button>
        </div>
      )}

      <DataTable
        data={data?.fixedRoutes || []}
        columns={columns}
        actions={actions}
        pagination={data?.pagination}
        onPageChange={setPage}
        emptyState={{
          icon: <MapPin />,
          title: hasActiveFilters ? '필터 조건에 맞는 고정노선이 없습니다' : '등록된 고정노선이 없습니다',
          description: hasActiveFilters ? '검색 조건을 변경하거나 새로운 고정노선을 등록해보세요.' : '새로운 고정노선을 등록해보세요.',
          action: {
            label: '고정노선 등록',
            onClick: () => setCreateModalOpen(true),
          },
        }}
        isLoading={isLoading}
        mobileCard={(route) => (
          <FixedRouteMobileCard
            route={route}
            actions={actions}
          />
        )}
      />

      {/* Modals */}
      <CreateFixedRouteModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <EditFixedRouteModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingFixedRoute(null)
        }}
        fixedRoute={editingFixedRoute}
        onSubmit={handleUpdate}
        isSubmitting={updateMutation.isPending}
      />
    </ManagementPageLayout>
  )
}