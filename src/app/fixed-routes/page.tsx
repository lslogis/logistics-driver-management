'use client'

import React, { useState } from 'react'
import { Plus, MapPin, Upload } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { 
  FixedRouteResponse, 
  CreateFixedRouteData, 
  UpdateFixedRouteData 
} from '@/lib/validations/fixedRoute'
import { 
  useFixedRoutes,
  useCreateFixedRoute,
  useUpdateFixedRoute,
  useActivateFixedRoute,
  useDeactivateFixedRoute,
  useBulkActivateFixedRoutes,
  useBulkDeactivateFixedRoutes,
  useBulkDeleteFixedRoutes,
  useExportFixedRoutes
} from '@/hooks/useFixedRoutes'
import { copyToClipboard, formatFixedRouteInfo, sendSMS, shareToKakao, makePhoneCall } from '@/lib/utils/share'
import ManagementPageTemplate from '@/components/templates/ManagementPageTemplate'
import { getFixedRouteColumns, getFixedRouteContextMenuItems, FixedRouteItem } from '@/components/templates/FixedRoutesTemplateConfig'
import FixedRouteForm from '@/components/forms/FixedRouteForm'

export default function FixedRoutesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingFixedRoute, setEditingFixedRoute] = useState<FixedRouteResponse | null>(null)

  // Data fetching
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useFixedRoutes(searchTerm, statusFilter)
  
  const fixedRoutesData = data?.pages?.flatMap((page: any) => page.fixedRoutes) || []
  const totalCount = data?.pages?.[data?.pages?.length - 1]?.pagination?.total || data?.pages?.[0]?.pagination?.total || 0
  
  // Mutations
  const createMutation = useCreateFixedRoute()
  const updateMutation = useUpdateFixedRoute()
  const activateMutation = useActivateFixedRoute()
  const deactivateMutation = useDeactivateFixedRoute()
  const bulkActivateMutation = useBulkActivateFixedRoutes()
  const bulkDeactivateMutation = useBulkDeactivateFixedRoutes()
  const bulkDeleteMutation = useBulkDeleteFixedRoutes()
  const exportMutation = useExportFixedRoutes()

  // Convert FixedRouteResponse to FixedRouteItem for template
  const templateData: FixedRouteItem[] = fixedRoutesData.map(route => ({
    id: route.id,
    routeName: route.routeName,
    assignedDriverId: route.assignedDriverId,
    weekdayPattern: route.weekdayPattern,
    contractType: route.contractType,
    revenueDaily: route.revenueDaily,
    costDaily: route.costDaily,
    isActive: route.isActive,
    createdAt: route.createdAt,
    updatedAt: route.updatedAt,
    loadingPoint: route.loadingPoint,
    assignedDriver: route.assignedDriver
  }))

  // CRUD handlers
  const handleCreate = (data: CreateFixedRouteData) => {
    createMutation.mutate(data, {
      onSuccess: () => setCreateModalOpen(false)
    })
  }

  const handleUpdate = (id: string, data: UpdateFixedRouteData) => {
    updateMutation.mutate({ id, data }, {
      onSuccess: () => {
        setEditModalOpen(false)
        setEditingFixedRoute(null)
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
  }

  const handleBulkDeactivate = (ids: string[]) => {
    bulkDeactivateMutation.mutate(ids)
  }

  const handleBulkDelete = (ids: string[]) => {
    bulkDeleteMutation.mutate(ids)
  }

  // Context menu handlers
  const handleCopyFixedRoute = async (item: FixedRouteItem) => {
    const fixedRouteInfo = formatFixedRouteInfo(item as FixedRouteResponse)
    const success = await copyToClipboard(fixedRouteInfo)
    if (success) {
      toast.success('고정노선 정보가 클립보드에 복사되었습니다')
    } else {
      toast.error('클립보드 복사에 실패했습니다')
    }
  }

  const handleShareToKakao = async (item: FixedRouteItem) => {
    try {
      const fixedRouteInfo = formatFixedRouteInfo(item as FixedRouteResponse)
      await shareToKakao(`고정노선 정보 - ${item.routeName}`, fixedRouteInfo)
      toast.success('카카오톡으로 공유되었습니다')
    } catch (error) {
      console.error('카카오톡 공유 실패:', error)
      toast.error('카카오톡 공유에 실패했습니다')
    }
  }

  const handleSendSMS = (item: FixedRouteItem) => {
    try {
      const phone = item.assignedDriver?.phone
      if (!phone) {
        toast.error('배정된 기사의 연락처가 없습니다')
        return
      }
      const fixedRouteInfo = formatFixedRouteInfo(item as FixedRouteResponse)
      sendSMS(phone, fixedRouteInfo)
      toast.success('SMS 앱이 실행되었습니다')
    } catch (error) {
      console.error('SMS 발송 실패:', error)
      toast.error('SMS 발송에 실패했습니다')
    }
  }

  const handlePhoneCall = (item: FixedRouteItem, phoneNumber: string) => {
    try {
      makePhoneCall(phoneNumber)
    } catch (error) {
      console.error('전화 걸기 실패:', error)
      toast.error('전화 걸기에 실패했습니다')
    }
  }

  const handleEditFixedRoute = (item: FixedRouteItem) => {
    setEditingFixedRoute(fixedRoutesData.find(fr => fr.id === item.id) || null)
    setEditModalOpen(true)
  }

  // Context menu items generator
  const getContextMenuItems = (item: FixedRouteItem) => {
    return getFixedRouteContextMenuItems(item, {
      onCopy: handleCopyFixedRoute,
      onKakaoShare: handleShareToKakao,
      onSendSMS: handleSendSMS,
      onPhoneCall: handlePhoneCall,
      onEdit: handleEditFixedRoute,
      onActivate: handleActivate,
      onDeactivate: handleDeactivate
    })
  }

  return (
    <ManagementPageTemplate<FixedRouteItem, CreateFixedRouteData, UpdateFixedRouteData>
      title="고정노선 관리"
      icon={<MapPin />}
      countLabel="개"
      data={templateData}
      totalCount={totalCount}
      isLoading={isLoading}
      error={error ? String(error) : undefined}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      columns={getFixedRouteColumns()}
      primaryAction={{
        label: '고정노선 등록',
        onClick: () => setCreateModalOpen(true),
        icon: <Plus className="h-4 w-4" />
      }}
      secondaryActions={[{
        label: 'Excel 가져오기',
        onClick: () => window.location.href = '/import/fixed-routes',
        icon: <Upload className="h-4 w-4" />
      }]}
      exportAction={{
        label: 'Excel 내보내기',
        onClick: () => exportMutation.mutate('excel'),
        loading: exportMutation.isPending
      }}
      searchFilters={[
        {
          label: '검색',
          type: 'text',
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: '노선명, 센터명, 기사명으로 검색...'
        },
        {
          label: '상태',
          type: 'select',
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { value: '', label: '전체' },
            { value: 'active', label: '활성' },
            { value: 'inactive', label: '비활성' }
          ]
        }
      ]}
      crudActions={{
        create: handleCreate,
        update: handleUpdate,
        activate: handleActivate,
        deactivate: handleDeactivate
      }}
      bulkActions={{
        activate: handleBulkActivate,
        deactivate: handleBulkDeactivate,
        hardDelete: handleBulkDelete
      }}
      getContextMenuItems={getContextMenuItems}
      CreateForm={({ onSubmit, isLoading, onCancel }) => (
        <FixedRouteForm 
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={onCancel}
        />
      )}
      EditForm={({ item, onSubmit, isLoading, onCancel }) => (
        <FixedRouteForm
          fixedRoute={editingFixedRoute}
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={onCancel}
        />
      )}
      createModalOpen={createModalOpen}
      setCreateModalOpen={setCreateModalOpen}
      editModalOpen={editModalOpen}
      setEditModalOpen={setEditModalOpen}
      editingItem={editingFixedRoute ? templateData.find(fr => fr.id === editingFixedRoute.id) || null : null}
      setEditingItem={(item) => setEditingFixedRoute(item ? fixedRoutesData.find(fr => fr.id === item.id) || null : null)}
      isCreatePending={createMutation.isPending}
      isUpdatePending={updateMutation.isPending}
      emptyStateConfig={{
        icon: <MapPin className="h-16 w-16" />,
        title: '등록된 고정노선이 없습니다',
        description: '새로운 고정노선을 등록해보세요.',
        actionLabel: '고정노선 등록'
      }}
    />
  )
}