'use client'

import React, { useState } from 'react'
import { Plus, User, Upload } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { DriverResponse, CreateDriverData, UpdateDriverData } from '@/lib/validations/driver'
import { copyToClipboard, formatDriverInfo, sendSMS, shareToKakao, makePhoneCall } from '@/lib/utils/share'
import { 
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useActivateDriver,
  useDeactivateDriver,
  useBulkActivateDrivers,
  useBulkDeactivateDrivers,
  useBulkDeleteDrivers,
  useExportDrivers
} from '@/hooks/useDrivers'
import ManagementPageTemplate from '@/components/templates/ManagementPageTemplate'
import { getDriverColumns, getDriverContextMenuItems, DriverItem } from '@/components/templates/DriversTemplateConfig'
import DriverForm from '@/components/forms/DriverForm'
import { ImportModal } from '@/components/import'

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<DriverResponse | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

  // Data fetching
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useDrivers(searchTerm, statusFilter)
  
  const driversData = data?.pages?.flatMap((page: any) => page.drivers) || []
  const totalCount = data?.pages?.[data?.pages?.length - 1]?.pagination?.total || data?.pages?.[0]?.pagination?.total || 0
  
  // Mutations
  const createMutation = useCreateDriver()
  const updateMutation = useUpdateDriver()
  const activateMutation = useActivateDriver()
  const deactivateMutation = useDeactivateDriver()
  const bulkActivateMutation = useBulkActivateDrivers()
  const bulkDeactivateMutation = useBulkDeactivateDrivers()
  const bulkDeleteMutation = useBulkDeleteDrivers()
  const exportMutation = useExportDrivers()

  // Convert DriverResponse to DriverItem for template
  const templateData: DriverItem[] = driversData.map(driver => ({
    id: driver.id,
    isActive: driver.isActive,
    name: driver.name,
    phone: driver.phone,
    vehicleNumber: driver.vehicleNumber,
    businessName: driver.businessName,
    representative: driver.representative,
    businessNumber: driver.businessNumber,
    bankName: driver.bankName,
    accountNumber: driver.accountNumber,
    remarks: driver.remarks
  }))

  // CRUD handlers
  const handleCreate = (data: CreateDriverData) => {
    createMutation.mutate(data, {
      onSuccess: () => setCreateModalOpen(false)
    })
  }

  const handleUpdate = (id: string, data: UpdateDriverData) => {
    updateMutation.mutate({ id, data }, {
      onSuccess: () => {
        setEditModalOpen(false)
        setEditingDriver(null)
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
  const handleCopyDriver = async (driver: DriverItem) => {
    const driverInfo = formatDriverInfo(driver as DriverResponse)
    const success = await copyToClipboard(driverInfo)
    if (success) {
      toast.success('기사 정보가 클립보드에 복사되었습니다')
    } else {
      toast.error('클립보드 복사에 실패했습니다')
    }
  }

  const handleShareToKakao = async (driver: DriverItem) => {
    try {
      const driverInfo = formatDriverInfo(driver as DriverResponse)
      await shareToKakao(`기사 정보 - ${driver.name}`, driverInfo)
      toast.success('카카오톡으로 공유되었습니다')
    } catch (error) {
      console.error('카카오톡 공유 실패:', error)
      toast.error('카카오톡 공유에 실패했습니다')
    }
  }

  const handleSendSMS = (driver: DriverItem) => {
    try {
      if (!driver.phone) {
        toast.error('연락처가 없는 기사입니다')
        return
      }
      const driverInfo = formatDriverInfo(driver as DriverResponse)
      sendSMS(driver.phone, driverInfo)
      toast.success('SMS 앱이 실행되었습니다')
    } catch (error) {
      console.error('SMS 발송 실패:', error)
      toast.error('SMS 발송에 실패했습니다')
    }
  }

  const handlePhoneCall = (driver: DriverItem) => {
    try {
      if (!driver.phone) {
        toast.error('연락처가 없는 기사입니다')
        return
      }
      makePhoneCall(driver.phone)
    } catch (error) {
      console.error('전화 걸기 실패:', error)
      toast.error('전화 걸기에 실패했습니다')
    }
  }

  const handleEditDriver = (driver: DriverItem) => {
    setEditingDriver(driversData.find(d => d.id === driver.id) || null)
    setEditModalOpen(true)
  }

  // Context menu items generator
  const getContextMenuItems = (driver: DriverItem) => {
    return getDriverContextMenuItems(driver, {
      onCopy: handleCopyDriver,
      onKakaoShare: handleShareToKakao,
      onSendSMS: handleSendSMS,
      onPhoneCall: handlePhoneCall,
      onEdit: handleEditDriver,
      onActivate: handleActivate,
      onDeactivate: handleDeactivate
    })
  }

  return (
    <>
    <ManagementPageTemplate<DriverItem, CreateDriverData, UpdateDriverData>
      title="기사 관리"
      icon={<User />}
      countLabel="명"
      data={templateData}
      totalCount={totalCount}
      isLoading={isLoading}
      error={error ? String(error) : undefined}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      columns={getDriverColumns()}
      primaryAction={{
        label: '기사 등록',
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
          placeholder: '성함, 연락처, 차량번호, 사업상호, 대표자, 계좌번호로 검색...'
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
        <DriverForm 
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={onCancel}
        />
      )}
      EditForm={({ item, onSubmit, isLoading, onCancel }) => (
        <DriverForm
          driver={editingDriver}
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={onCancel}
        />
      )}
      createModalOpen={createModalOpen}
      setCreateModalOpen={setCreateModalOpen}
      editModalOpen={editModalOpen}
      setEditModalOpen={setEditModalOpen}
      editingItem={editingDriver ? templateData.find(d => d.id === editingDriver.id) || null : null}
      setEditingItem={(item) => setEditingDriver(item ? driversData.find(d => d.id === item.id) || null : null)}
      isCreatePending={createMutation.isPending}
      isUpdatePending={updateMutation.isPending}
      emptyStateConfig={{
        icon: <User className="h-16 w-16" />,
        title: '등록된 기사가 없습니다',
        description: '새로운 기사를 등록해보세요.',
        actionLabel: '기사 등록'
      }}
    />
    
    {/* Import Modal */}
    <ImportModal
      isOpen={importModalOpen}
      onClose={() => setImportModalOpen(false)}
      type="drivers"
      onSuccess={() => {
        // 데이터 새로고침을 위해 쿼리를 무효화
        window.location.reload()
      }}
    />
    </>
  )
}