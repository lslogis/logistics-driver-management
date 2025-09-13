'use client'

import React, { useState } from 'react'
import { Calendar, Plus, Upload } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { TripResponse, CreateTripData, UpdateTripData, canEditTrip, canDeleteTrip } from '@/lib/validations/trip'
import { copyToClipboard, formatTripInfo, sendSMS, shareToKakao, makePhoneCall } from '@/lib/utils/share'
import { 
  useTrips,
  useCreateTrip,
  useUpdateTrip,
  useDeleteTrip,
  useUpdateTripStatus,
  useCompleteTrip,
  useExportTrips
} from '@/hooks/useTrips'
import ManagementPageTemplate from '@/components/templates/ManagementPageTemplate'
import { getTripColumns, getTripContextMenuItems, TripItem } from '@/components/templates/TripsTemplateConfig'
import TripForm from '@/components/forms/TripForm'
import TripStatusForm from '@/components/forms/TripStatusForm'
import { ImportModal } from '@/components/import'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function TripsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<TripResponse | null>(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusChangingTrip, setStatusChangingTrip] = useState<TripResponse | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)

  // API calls with pagination
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useTrips({ 
    search: searchTerm || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    status: statusFilter as 'SCHEDULED' | 'COMPLETED' | 'ABSENCE' | 'SUBSTITUTE' | undefined
  })
  
  const tripsData = data?.pages?.flatMap((page: any) => page.trips) || []
  const totalCount = data?.pages?.[data?.pages?.length - 1]?.pagination?.total || data?.pages?.[0]?.pagination?.total || 0
  
  // Mutations
  const createMutation = useCreateTrip()
  const updateMutation = useUpdateTrip()
  const statusMutation = useUpdateTripStatus()
  const completeMutation = useCompleteTrip()
  const exportMutation = useExportTrips()

  // Convert TripResponse to TripItem for template
  const templateData: TripItem[] = tripsData.map(trip => ({
    id: trip.id,
    isActive: true, // trips don't have isActive, always true
    date: trip.date,
    status: trip.status,
    driver: trip.driver,
    vehicle: trip.vehicle,
    routeTemplate: trip.routeTemplate,
    customRoute: trip.customRoute,
    driverFare: trip.driverFare,
    billingFare: trip.billingFare,
    deductionAmount: trip.deductionAmount,
    substituteFare: trip.substituteFare,
    substituteDriver: trip.substituteDriver,
    absenceReason: trip.absenceReason,
    remarks: trip.remarks
  }))

  // CRUD handlers
  const handleCreate = (data: CreateTripData) => {
    createMutation.mutate(data, {
      onSuccess: () => setCreateModalOpen(false)
    })
  }

  const handleUpdate = (id: string, data: UpdateTripData) => {
    updateMutation.mutate({ id, data }, {
      onSuccess: () => {
        setEditModalOpen(false)
        setEditingTrip(null)
      }
    })
  }

  const handleStatusChange = (data: any) => {
    if (!statusChangingTrip) return
    statusMutation.mutate({ id: statusChangingTrip.id, data }, {
      onSuccess: () => {
        setStatusModalOpen(false)
        setStatusChangingTrip(null)
      }
    })
  }

  const handleComplete = (tripId: string) => {
    if (confirm('이 운행을 완료 처리하시겠습니까?')) {
      completeMutation.mutate(tripId)
    }
  }

  // Context menu handlers
  const handleCopyTrip = async (trip: TripItem) => {
    const tripInfo = formatTripInfo(trip as any)
    const success = await copyToClipboard(tripInfo)
    if (success) {
      toast.success('운행 정보가 클립보드에 복사되었습니다')
    } else {
      toast.error('클립보드 복사에 실패했습니다')
    }
  }

  const handleShareToKakao = async (trip: TripItem) => {
    try {
      const tripInfo = formatTripInfo(trip as any)
      await shareToKakao(`운행 정보 - ${trip.driver.name}`, tripInfo)
      toast.success('카카오톡으로 공유되었습니다')
    } catch (error) {
      console.error('카카오톡 공유 실패:', error)
      toast.error('카카오톡 공유에 실패했습니다')
    }
  }

  const handlePhoneCall = (trip: TripItem) => {
    try {
      if (!trip.driver.phone) {
        toast.error('연락처가 없는 기사입니다')
        return
      }
      makePhoneCall(trip.driver.phone)
    } catch (error) {
      console.error('전화 걸기 실패:', error)
      toast.error('전화 걸기에 실패했습니다')
    }
  }

  const handleEditTrip = (trip: TripItem) => {
    setEditingTrip(tripsData.find(t => t.id === trip.id) || null)
    setEditModalOpen(true)
  }

  const handleStatusChangeTrip = (trip: TripItem) => {
    setStatusChangingTrip(tripsData.find(t => t.id === trip.id) || null)
    setStatusModalOpen(true)
  }

  const handleCompleteTrip = (trip: TripItem) => {
    handleComplete(trip.id)
  }

  // Context menu items generator
  const getContextMenuItems = (trip: TripItem) => {
    return getTripContextMenuItems(trip, {
      onCopy: handleCopyTrip,
      onKakaoShare: handleShareToKakao,
      onPhoneCall: handlePhoneCall,
      onEdit: handleEditTrip,
      onStatusChange: handleStatusChangeTrip,
      onComplete: handleCompleteTrip,
      onActivate: () => {}, // Not applicable for trips
      onDeactivate: () => {} // Not applicable for trips
    })
  }

  return (
    <>
    <ManagementPageTemplate<TripItem, CreateTripData, UpdateTripData>
      title="용차 관리"
      icon={<Calendar />}
      countLabel="건"
      data={templateData}
      totalCount={totalCount}
      isLoading={isLoading}
      error={error ? String(error) : undefined}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      columns={getTripColumns()}
      primaryAction={{
        label: '용차 등록',
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
          placeholder: '기사명, 차량번호, 노선으로 검색...'
        },
        {
          label: '시작일',
          type: 'date',
          value: dateFrom,
          onChange: setDateFrom
        },
        {
          label: '종료일',
          type: 'date',
          value: dateTo,
          onChange: setDateTo
        },
        {
          label: '상태',
          type: 'select',
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { value: '', label: '전체' },
            { value: 'SCHEDULED', label: '예정' },
            { value: 'COMPLETED', label: '완료' },
            { value: 'ABSENCE', label: '결행' },
            { value: 'SUBSTITUTE', label: '대차' }
          ]
        }
      ]}
      crudActions={{
        create: handleCreate,
        update: handleUpdate,
        activate: () => {}, // Not applicable for trips
        deactivate: () => {} // Not applicable for trips
      }}
      bulkActions={{
        activate: () => {}, // Not applicable for trips
        deactivate: () => {}, // Not applicable for trips
        hardDelete: () => {} // Not applicable for trips
      }}
      getContextMenuItems={getContextMenuItems}
      CreateForm={({ onSubmit, isLoading, onCancel }) => (
        <TripForm 
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={onCancel}
        />
      )}
      EditForm={({ item, onSubmit, isLoading, onCancel }) => (
        <TripForm
          trip={editingTrip}
          onSubmit={onSubmit}
          isLoading={isLoading}
          onCancel={onCancel}
        />
      )}
      createModalOpen={createModalOpen}
      setCreateModalOpen={setCreateModalOpen}
      editModalOpen={editModalOpen}
      setEditModalOpen={setEditModalOpen}
      editingItem={editingTrip ? templateData.find(t => t.id === editingTrip.id) || null : null}
      setEditingItem={(item) => setEditingTrip(item ? tripsData.find(t => t.id === item.id) || null : null)}
      isCreatePending={createMutation.isPending}
      isUpdatePending={updateMutation.isPending}
      emptyStateConfig={{
        icon: <Calendar className="h-16 w-16" />,
        title: '등록된 용차가 없습니다',
        description: '새로운 용차를 등록해보세요.',
        actionLabel: '용차 등록'
      }}
    />
    
    {/* Import Modal */}
    <ImportModal
      isOpen={importModalOpen}
      onClose={() => setImportModalOpen(false)}
      type="trips"
      onSuccess={() => {
        // 데이터 새로고침을 위해 쿼리를 무효화
        window.location.reload()
      }}
    />

    {/* Status Change Modal */}
    <Dialog open={statusModalOpen} onOpenChange={(open) => {
      if (!open) {
        setStatusModalOpen(false)
        setStatusChangingTrip(null)
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>운행 상태 변경</DialogTitle>
        </DialogHeader>
        {statusChangingTrip && (
          <TripStatusForm
            trip={statusChangingTrip}
            onSubmit={handleStatusChange}
            isLoading={statusMutation.isPending}
            onCancel={() => {
              setStatusModalOpen(false)
              setStatusChangingTrip(null)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}