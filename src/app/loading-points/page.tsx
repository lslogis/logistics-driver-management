'use client'

import React, { useState } from 'react'
import { Plus, MapPin, Upload } from 'lucide-react'
import { toast } from 'react-hot-toast'
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
import ManagementPageTemplate from '@/components/templates/ManagementPageTemplate'
import { getLoadingPointColumns, getLoadingPointContextMenuItems, LoadingPointItem } from '@/components/templates/LoadingPointsTemplateConfig'
import LoadingPointForm from '@/components/forms/LoadingPointForm'
import { ImportModal } from '@/components/import'

export default function LoadingPointsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingLoadingPoint, setEditingLoadingPoint] = useState<LoadingPointResponse | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

  // Data fetching
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useLoadingPoints(searchTerm, statusFilter)
  
  const loadingPointsData = data?.pages?.flatMap((page: any) => page.items || []) || []
  const totalCount = data?.pages?.[data?.pages?.length - 1]?.totalCount || data?.pages?.[0]?.totalCount || 0
  
  // Mutations
  const createMutation = useCreateLoadingPoint()
  const updateMutation = useUpdateLoadingPoint()
  const activateMutation = useActivateLoadingPoint()
  const deactivateMutation = useDeactivateLoadingPoint()
  const bulkActivateMutation = useBulkActivateLoadingPoints()
  const bulkDeactivateMutation = useBulkDeactivateLoadingPoints()
  const bulkDeleteMutation = useBulkDeleteLoadingPoints()
  const exportMutation = useExportLoadingPoints()

  // Convert LoadingPointResponse to LoadingPointItem for template
  const templateData: LoadingPointItem[] = loadingPointsData.map(item => ({
    id: item.id,
    isActive: item.isActive,
    centerName: item.centerName,
    loadingPointName: item.loadingPointName,
    lotAddress: item.lotAddress,
    roadAddress: item.roadAddress,
    manager1: item.manager1,
    manager2: item.manager2,
    phone1: item.phone1,
    phone2: item.phone2,
    remarks: item.remarks
  }))

  // CRUD handlers
  const handleCreate = (data: CreateLoadingPointData) => {
    createMutation.mutate(data, {
      onSuccess: () => setCreateModalOpen(false)
    })
  }

  const handleUpdate = (id: string, data: UpdateLoadingPointData) => {
    updateMutation.mutate({ id, data }, {
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
  }

  const handleBulkDeactivate = (ids: string[]) => {
    bulkDeactivateMutation.mutate(ids)
  }

  const handleBulkDelete = (ids: string[]) => {
    bulkDeleteMutation.mutate(ids)
  }

  // Context menu handlers
  const handleCopyLoadingPoint = async (item: LoadingPointItem) => {
    const loadingPointInfo = formatLoadingPointInfo(item as LoadingPointResponse)
    const success = await copyToClipboard(loadingPointInfo)
    if (success) {
      toast.success('상차지 정보가 클립보드에 복사되었습니다')
    } else {
      toast.error('클립보드 복사에 실패했습니다')
    }
  }

  const handleShareToKakao = async (item: LoadingPointItem) => {
    try {
      const loadingPointInfo = formatLoadingPointInfo(item as LoadingPointResponse)
      await shareToKakao(`상차지 정보 - ${item.centerName} ${item.loadingPointName}`, loadingPointInfo)
      toast.success('카카오톡으로 공유되었습니다')
    } catch (error) {
      console.error('카카오톡 공유 실패:', error)
      toast.error('카카오톡 공유에 실패했습니다')
    }
  }

  const handleSendSMS = (item: LoadingPointItem) => {
    try {
      const phone = item.phone1 || item.phone2
      if (!phone) {
        toast.error('연락처가 없는 상차지입니다')
        return
      }
      const loadingPointInfo = formatLoadingPointInfo(item as LoadingPointResponse)
      sendSMS(phone, loadingPointInfo)
      toast.success('SMS 앱이 실행되었습니다')
    } catch (error) {
      console.error('SMS 발송 실패:', error)
      toast.error('SMS 발송에 실패했습니다')
    }
  }

  const handlePhoneCall = (item: LoadingPointItem, phoneNumber: string) => {
    try {
      makePhoneCall(phoneNumber)
    } catch (error) {
      console.error('전화 걸기 실패:', error)
      toast.error('전화 걸기에 실패했습니다')
    }
  }

  const handleEditLoadingPoint = (item: LoadingPointItem) => {
    setEditingLoadingPoint(loadingPointsData.find(lp => lp.id === item.id) || null)
    setEditModalOpen(true)
  }

  // Context menu items generator
  const getContextMenuItems = (item: LoadingPointItem) => {
    return getLoadingPointContextMenuItems(item, {
      onCopy: handleCopyLoadingPoint,
      onKakaoShare: handleShareToKakao,
      onSendSMS: handleSendSMS,
      onPhoneCall: handlePhoneCall,
      onEdit: handleEditLoadingPoint,
      onActivate: handleActivate,
      onDeactivate: handleDeactivate
    })
  }

  return (
    <>
    <ManagementPageTemplate<LoadingPointItem, CreateLoadingPointData, UpdateLoadingPointData>
      title="상차지 관리"
      icon={<MapPin />}
      countLabel="곳"
      data={templateData}
      totalCount={totalCount}
      isLoading={isLoading}
      error={error ? String(error) : undefined}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      columns={getLoadingPointColumns()}
      primaryAction={{
        label: '상차지 등록',
        onClick: () => setCreateModalOpen(true),
        icon: <Plus className="h-4 w-4" />
      }}
      secondaryActions={[{
        label: 'Excel 가져오기',
        onClick: () => setImportModalOpen(true),
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
          placeholder: '센터명, 상차지명, 주소로 검색...'
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
        <LoadingPointForm 
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={onCancel}
        />
      )}
      EditForm={({ item, onSubmit, isLoading, onCancel }) => (
        <LoadingPointForm
          loadingPoint={editingLoadingPoint}
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={onCancel}
        />
      )}
      createModalOpen={createModalOpen}
      setCreateModalOpen={setCreateModalOpen}
      editModalOpen={editModalOpen}
      setEditModalOpen={setEditModalOpen}
      editingItem={editingLoadingPoint ? templateData.find(lp => lp.id === editingLoadingPoint.id) || null : null}
      setEditingItem={(item) => setEditingLoadingPoint(item ? loadingPointsData.find(lp => lp.id === item.id) || null : null)}
      isCreatePending={createMutation.isPending}
      isUpdatePending={updateMutation.isPending}
      emptyStateConfig={{
        icon: <MapPin className="h-16 w-16" />,
        title: '등록된 상차지가 없습니다',
        description: '새로운 상차지를 등록해보세요.',
        actionLabel: '상차지 등록'
      }}
    />
    
    {/* Import Modal */}
    <ImportModal
      isOpen={importModalOpen}
      onClose={() => setImportModalOpen(false)}
      type="loading-points"
      onSuccess={() => {
        // 데이터 새로고침을 위해 쿼리를 무효화
        window.location.reload()
      }}
    />
    </>
  )
}