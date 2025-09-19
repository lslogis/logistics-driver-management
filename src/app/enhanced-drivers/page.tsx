'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useMemo } from 'react'
import { User, Eye, Edit, Copy, Share2, CheckCircle, XCircle, Phone, MessageSquare, Star, Truck, Calendar, CreditCard } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ContextMenuItem } from '@/components/ui/ContextMenu'
import { ThemedManagementPage } from '@/components/shared/ThemedManagementPage'
import { ColorTheme } from '@/components/shared/ColorThemeProvider'
import { Driver, CreateDriverData, UpdateDriverData, VEHICLE_TYPE_LABELS, LICENSE_TYPE_LABELS } from '@/types/management'
import { dummyDrivers } from '@/data/dummyData'
import { cn } from '@/lib/utils'

// Mock hooks for demonstration
const useEnhancedDrivers = (search: string, statusFilter: string) => {
  const filteredData = useMemo(() => {
    return dummyDrivers.filter(driver => {
      const matchesSearch = !search || 
        driver.name.toLowerCase().includes(search.toLowerCase()) ||
        driver.phone.toLowerCase().includes(search.toLowerCase()) ||
        driver.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
        driver.businessName?.toLowerCase().includes(search.toLowerCase()) ||
        driver.representative?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && driver.isActive) ||
        (statusFilter === 'inactive' && !driver.isActive)

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

const useMockDriverMutations = () => ({
  create: { mutate: (data: any) => toast.success('기사가 등록되었습니다'), isPending: false },
  update: { mutate: (data: any) => toast.success('기사 정보가 수정되었습니다'), isPending: false },
  activate: { mutate: (id: string) => toast.success('기사가 활성화되었습니다') },
  deactivate: { mutate: (id: string) => toast.success('기사가 비활성화되었습니다') },
  bulkActivate: { mutate: (ids: string[]) => toast.success(`${ids.length}명의 기사가 활성화되었습니다`) },
  bulkDeactivate: { mutate: (ids: string[]) => toast.success(`${ids.length}명의 기사가 비활성화되었습니다`) },
  bulkDelete: { mutate: (ids: string[]) => toast.success(`${ids.length}명의 기사가 삭제되었습니다`) },
  export: { mutate: () => toast.success('엑셀 파일이 다운로드되었습니다'), isPending: false }
})

// Enhanced Driver Form
const EnhancedDriverForm: React.FC<{
  driver?: Driver
  onSubmit: (data: CreateDriverData | UpdateDriverData) => void
  isLoading: boolean
  onCancel: () => void
}> = ({ driver, onSubmit, isLoading, onCancel }) => (
  <div className="p-6">
    <div className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">성명 *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={driver?.name}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={driver?.phone}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={driver?.email}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={driver?.address}
            />
          </div>
        </div>
      </div>

      {/* License Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">면허 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">면허번호 *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={driver?.licenseNumber}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">면허종류</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={driver?.licenseType}
            >
              <option value="regular">일반</option>
              <option value="commercial">사업용</option>
              <option value="special">특수</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">차량 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">차량번호</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={driver?.vehicleNumber}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">차량유형</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={driver?.vehicleType}
            >
              <option value="">선택하세요</option>
              <option value="small">소형</option>
              <option value="medium">중형</option>
              <option value="large">대형</option>
              <option value="extra_large">특대형</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>취소</Button>
        <Button 
          onClick={() => onSubmit({})} 
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
        >
          {isLoading ? '저장 중...' : (driver ? '수정' : '등록')}
        </Button>
      </div>
    </div>
  </div>
)

export default function EnhancedDriversPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [licenseTypeFilter, setLicenseTypeFilter] = useState('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
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
  } = useEnhancedDrivers(searchTerm, statusFilter)
  
  const driversData = useMemo(() => {
    return data?.pages?.flatMap((page: any) => (page.items || page.data || [])) || []
  }, [data])

  const totalCount = driversData.length

  // Mutations
  const mutations = useMockDriverMutations()

  // Filter data
  const filteredData = useMemo(() => {
    return driversData.filter(driver => {
      const matchesLicenseType = licenseTypeFilter === 'all' || driver.licenseType === licenseTypeFilter
      return matchesLicenseType
    })
  }, [driversData, licenseTypeFilter])

  // CRUD handlers
  const handleCreate = (data: CreateDriverData) => {
    mutations.create.mutate(data)
    setCreateModalOpen(false)
  }

  const handleUpdate = (data: UpdateDriverData) => {
    if (!editingDriver) return
    mutations.update.mutate({ id: editingDriver.id, data })
    setEditModalOpen(false)
    setEditingDriver(null)
  }

  const handleActivate = (id: string) => mutations.activate.mutate(id)
  const handleDeactivate = (id: string) => mutations.deactivate.mutate(id)

  // Helper functions
  const handlePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`)
    toast.success('전화 앱이 실행되었습니다')
  }

  const handleSMS = (driver: Driver) => {
    window.open(`sms:${driver.phone}`)
    toast.success('SMS 앱이 실행되었습니다')
  }

  const handleCopyDriverInfo = (driver: Driver) => {
    const info = `기사명: ${driver.name}\n연락처: ${driver.phone}\n차량번호: ${driver.vehicleNumber || '미등록'}`
    navigator.clipboard.writeText(info)
    toast.success('기사 정보가 복사되었습니다')
  }

  const handleShareDriver = (driver: Driver) => {
    toast.success('기사 정보가 공유되었습니다')
  }

  // Context menu items
  const getContextMenuItems = (driver: Driver): ContextMenuItem[] => [
    {
      id: 'view',
      label: '상세 보기',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => toast.info(`${driver.name} 상세 정보`)
    },
    {
      id: 'edit',
      label: '수정',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => {
        setEditingDriver(driver)
        setEditModalOpen(true)
      }
    },
    {
      id: 'copy',
      label: '정보 복사',
      icon: <Copy className="h-4 w-4" />,
      onClick: () => handleCopyDriverInfo(driver)
    },
    {
      id: 'share',
      label: '공유',
      icon: <Share2 className="h-4 w-4" />,
      onClick: () => handleShareDriver(driver)
    },
    {
      id: 'phone',
      label: '전화 걸기',
      icon: <Phone className="h-4 w-4" />,
      onClick: () => handlePhoneCall(driver.phone)
    },
    {
      id: 'sms',
      label: 'SMS 전송',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: () => handleSMS(driver)
    },
    {
      id: 'toggle',
      label: driver.isActive ? '비활성화' : '활성화',
      icon: driver.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
      onClick: () => driver.isActive ? handleDeactivate(driver.id) : handleActivate(driver.id)
    }
  ]

  // Render rating stars
  const renderRating = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
          )}
        />
      )
    }
    return <div className="flex items-center space-x-1">{stars}</div>
  }

  // Render item function
  const renderItem = (driver: Driver, theme: ColorTheme) => (
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0 mr-4">
        {/* Driver Name and Status */}
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {driver.name}
          </h3>
          <Badge
            variant={driver.isActive ? "default" : "secondary"}
            className={cn(
              "text-xs font-semibold",
              driver.isActive 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-red-100 text-red-800 border-red-200"
            )}
          >
            {driver.isActive ? '활성' : '비활성'}
          </Badge>
        </div>

        {/* Contact Info */}
        <div className={cn("text-base font-medium mb-2", theme.primaryText)}>
          {driver.phone}
        </div>

        {/* License and Vehicle Info */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-700">
            <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">면허:</span>
            <span className="ml-1">{LICENSE_TYPE_LABELS[driver.licenseType]} ({driver.licenseNumber})</span>
          </div>
          {driver.vehicleNumber && (
            <div className="flex items-center text-sm text-gray-700">
              <Truck className="h-4 w-4 mr-2 text-gray-400" />
              <span className="font-medium">차량:</span>
              <span className="ml-1">{driver.vehicleNumber}</span>
              {driver.vehicleType && (
                <span className="ml-1">({VEHICLE_TYPE_LABELS[driver.vehicleType]})</span>
              )}
            </div>
          )}
        </div>

        {/* Performance Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            {renderRating(driver.rating)}
            <span className="ml-1 font-medium">{driver.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>운행 {driver.totalTrips}회</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-medium">수익:</span>
            <span>{(driver.totalRevenue / 10000).toFixed(0)}만원</span>
          </div>
        </div>

        {/* Business Info */}
        {driver.businessName && (
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
            <div className="text-gray-700">
              <span className="font-medium">사업상호:</span>
              <span className="ml-1">{driver.businessName}</span>
            </div>
            {driver.representative && (
              <div className="text-gray-700">
                <span className="font-medium">대표자:</span>
                <span className="ml-1">{driver.representative}</span>
              </div>
            )}
          </div>
        )}

        {/* Bank Info */}
        {driver.bankName && driver.accountNumber && (
          <div className="mt-2 text-sm text-gray-700">
            <span className="font-medium">계좌:</span>
            <span className="ml-1">{driver.bankName} {driver.accountNumber}</span>
          </div>
        )}

        {/* Notes */}
        {driver.notes && (
          <div className="mt-2 text-sm text-gray-500">
            <span className="font-medium">비고:</span>
            <span className="ml-1">{driver.notes}</span>
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
            toast.info(`${driver.name} 상세 정보`)
          }}
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setEditingDriver(driver)
            setEditModalOpen(true)
          }}
          className="border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handlePhoneCall(driver.phone)
          }}
          className="border-green-200 text-green-600 hover:bg-green-50"
        >
          <Phone className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <ThemedManagementPage
        theme="drivers"
        title="기사관리"
        subtitle="운송 기사를 체계적으로 관리하세요"
        icon={<User />}
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
            label: '면허종류',
            value: licenseTypeFilter,
            onChange: setLicenseTypeFilter,
            options: [
              { value: 'all', label: '전체 면허' },
              { value: 'regular', label: '일반' },
              { value: 'commercial', label: '사업용' },
              { value: 'special', label: '특수' }
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
        emptyStateMessage="등록된 기사가 없습니다"
        emptyStateAction="새로운 기사를 등록하여 시작해보세요"
      />

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              기사 등록
            </DialogTitle>
          </DialogHeader>
          <EnhancedDriverForm
            onSubmit={handleCreate}
            isLoading={mutations.create.isPending}
            onCancel={() => setCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              기사 정보 수정
            </DialogTitle>
          </DialogHeader>
          <EnhancedDriverForm
            driver={editingDriver || undefined}
            onSubmit={handleUpdate}
            isLoading={mutations.update.isPending}
            onCancel={() => {
              setEditModalOpen(false)
              setEditingDriver(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}