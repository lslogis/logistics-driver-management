'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useMemo } from 'react'
import { Plus, User, Upload, Download, Users, UserCheck, UserX, TrendingUp, Phone, Car, Building2, DollarSign } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { useAuth } from '@/hooks/useAuth'
import { DriverResponse, CreateDriverData, UpdateDriverData } from '@/lib/validations/driver'
import { copyToClipboard, formatDriverInfo, formatDriverInfoBasic, formatDriverInfoExtended, sendSMS, shareToKakao, makePhoneCall } from '@/lib/utils/share'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ContextMenu, ContextMenuItem } from '@/components/ui/ContextMenu'
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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  const { hasPermission } = useAuth()

  // Data fetching
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useDrivers(searchTerm, statusFilter)
  
  const driversData = useMemo(() => {
    return data?.pages?.flatMap((page: any) => page.drivers) || []
  }, [data])

  const totalCount = useMemo(() => {
    const pages = data?.pages || []
    if (pages.length === 0) return 0
    const lastPage = pages[pages.length - 1]
    const firstPage = pages[0]
    return lastPage?.pagination?.total || firstPage?.pagination?.total || 0
  }, [data])
  
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

  const handleUpdate = (data: UpdateDriverData) => {
    if (!editingDriver) return
    updateMutation.mutate({ id: editingDriver.id, data }, {
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

  // Legacy bulk handlers (removed - replaced with enhanced versions below)

  // Context menu handlers
  const handleCopyDriverBasic = async (driver: DriverItem) => {
    const driverInfo = formatDriverInfoBasic(driver)
    const success = await copyToClipboard(driverInfo)
    if (success) {
      toast.success('기사 기본 정보가 클립보드에 복사되었습니다')
    } else {
      toast.error('클립보드 복사에 실패했습니다')
    }
  }

  const handleCopyDriverExtended = async (driver: DriverItem) => {
    const driverInfo = formatDriverInfoExtended(driver)
    const success = await copyToClipboard(driverInfo)
    if (success) {
      toast.success('기사 확장 정보가 클립보드에 복사되었습니다')
    } else {
      toast.error('클립보드 복사에 실패했습니다')
    }
  }

  const handleShareToKakaoBasic = async (driver: DriverItem) => {
    try {
      const driverInfo = formatDriverInfoBasic(driver)
      await shareToKakao(`기사 정보 - ${driver.name}`, driverInfo)
      toast.success('카카오톡으로 기본 정보가 공유되었습니다')
    } catch (error) {
      console.error('카카오톡 공유 실패:', error)
      toast.error('카카오톡 공유에 실패했습니다')
    }
  }

  const handleShareToKakaoExtended = async (driver: DriverItem) => {
    try {
      const driverInfo = formatDriverInfoExtended(driver)
      await shareToKakao(`기사 정보 - ${driver.name}`, driverInfo)
      toast.success('카카오톡으로 확장 정보가 공유되었습니다')
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

  const handleEditDriver = (driver: DriverResponse | DriverItem) => {
    const fullDriver = driversData.find(d => d.id === driver.id) || null
    setEditingDriver(fullDriver)
    setEditModalOpen(true)
  }

  // Context menu items generator
  const getContextMenuItems = (driver: DriverItem) => {
    return getDriverContextMenuItems(driver, {
      onCopyBasic: handleCopyDriverBasic,
      onCopyExtended: handleCopyDriverExtended,
      onKakaoShareBasic: handleShareToKakaoBasic,
      onKakaoShareExtended: handleShareToKakaoExtended,
      onSendSMS: handleSendSMS,
      onPhoneCall: handlePhoneCall,
      onEdit: handleEditDriver,
      onActivate: handleActivate,
      onDeactivate: handleDeactivate
    })
  }
  
  // Calculate KPI statistics
  const statistics = useMemo(() => {
    const totalDrivers = driversData.length
    const activeDrivers = driversData.filter(d => d.isActive).length
    const inactiveDrivers = totalDrivers - activeDrivers
    const driversWithVehicles = driversData.filter(d => d.vehicleNumber).length
    
    return {
      total: totalDrivers,
      active: activeDrivers,
      inactive: inactiveDrivers,
      withVehicles: driversWithVehicles
    }
  }, [driversData])
  
  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(driversData.map(driver => driver.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    }
  }
  
  // Bulk action handlers with validation
  const handleBulkActivate = (ids: string[]) => {
    const inactiveIds = ids.filter(id => {
      const driver = driversData.find(d => d.id === id)
      return driver && !driver.isActive
    })
    
    if (inactiveIds.length === 0) {
      toast.error('활성화할 수 있는 기사가 없습니다')
      return
    }
    
    if (inactiveIds.length < ids.length) {
      toast(`${ids.length}개 중 ${inactiveIds.length}개만 활성화됩니다`, { 
        icon: '⚠️',
        style: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' }
      })
    }
    
    bulkActivateMutation.mutate(inactiveIds)
    setSelectedIds([])
  }

  const handleBulkDeactivate = (ids: string[]) => {
    const activeIds = ids.filter(id => {
      const driver = driversData.find(d => d.id === id)
      return driver && driver.isActive
    })
    
    if (activeIds.length === 0) {
      toast.error('비활성화할 수 있는 기사가 없습니다')
      return
    }
    
    if (window.confirm(`선택된 ${activeIds.length}개 기사를 비활성화하시겠습니까?`)) {
      bulkDeactivateMutation.mutate(activeIds)
      setSelectedIds([])
    }
  }

  const handleBulkHardDelete = (ids: string[]) => {
    if (window.confirm(`선택된 ${ids.length}개 기사를 완전히 삭제하시겠습니까?`)) {
      bulkDeleteMutation.mutate(ids)
      setSelectedIds([])
    }
  }
  
  // Selection state calculations
  const isAllSelected = driversData.length > 0 && selectedIds.length === driversData.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < driversData.length
  
  const selectedItems = driversData.filter(driver => selectedIds.includes(driver.id))
  const selectedActiveCount = selectedItems.filter(driver => driver.isActive).length
  const selectedInactiveCount = selectedItems.filter(driver => !driver.isActive).length

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <User className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-red-900">오류가 발생했습니다</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{String(error)}</p>
            <div className="flex justify-center space-x-3">
              <Button onClick={() => window.location.reload()}>새로고침</Button>
              <Button variant="outline" onClick={() => window.history.back()}>뒤로가기</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12 py-6">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-900 bg-clip-text text-transparent">
                  기사 관리
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  운송 기사 정보 관리 및 상태 모니터링
                </p>
              </div>
            </div>
            
            {/* Fixed Action Bar */}
            <div className="flex items-center gap-3">
              {hasPermission('export', 'execute') && (
                <Button
                  variant="outline"
                  onClick={() => exportMutation.mutate('excel')}
                  disabled={exportMutation.isPending}
                  className="flex items-center gap-2 h-12 rounded-xl border-2 font-medium"
                >
                  <Download className="h-4 w-4" />
                  {exportMutation.isPending ? '내보내는 중...' : 'Excel 내보내기'}
                </Button>
              )}
              {hasPermission('import', 'execute') && (
                <Button
                  variant="outline"
                  onClick={() => setImportModalOpen(true)}
                  className="flex items-center gap-2 h-12 rounded-xl border-2 font-medium"
                >
                  <Upload className="h-4 w-4" />
                  Excel 가져오기
                </Button>
              )}
              {hasPermission('drivers', 'create') && (
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center gap-2 h-12 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  <Plus className="h-4 w-4" />
                  기사 등록
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="rounded-2xl shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-1">
              <CardHeader className="bg-white m-1 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium text-gray-600">전체 기사</CardTitle>
                    <div className="text-3xl font-bold text-blue-600 mt-2">
                      {isLoading ? '...' : statistics.total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">명</div>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
            </div>
          </Card>

          <Card className="rounded-2xl shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-1">
              <CardHeader className="bg-white m-1 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium text-gray-600">활성 기사</CardTitle>
                    <div className="text-3xl font-bold text-green-600 mt-2">
                      {isLoading ? '...' : statistics.active.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">명</div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardHeader>
            </div>
          </Card>

          <Card className="rounded-2xl shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-1">
              <CardHeader className="bg-white m-1 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium text-gray-600">비활성 기사</CardTitle>
                    <div className="text-3xl font-bold text-orange-600 mt-2">
                      {isLoading ? '...' : statistics.inactive.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">명</div>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <UserX className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardHeader>
            </div>
          </Card>

          <Card className="rounded-2xl shadow-lg border-0 overflow-hidden">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-1">
              <CardHeader className="bg-white m-1 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium text-gray-600">차량 보유</CardTitle>
                    <div className="text-3xl font-bold text-purple-600 mt-2">
                      {isLoading ? '...' : statistics.withVehicles.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">명</div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Car className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="rounded-2xl shadow-lg border-0 mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4 w-full">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">검색</span>
                <div className="relative flex-1 max-w-md">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="성함, 연락처, 차량번호, 사업상호, 대표자, 계좌번호로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 h-12 rounded-xl border-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">상태</span>
                <select
                  className="h-12 px-4 border-2 border-gray-300 rounded-xl shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm font-medium text-gray-900"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <Card className="rounded-2xl shadow-lg border-0 mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-1">
              <div className="bg-white m-1 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-900">
                    {selectedIds.length}개 기사 선택됨
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkActivate(selectedIds)}
                      disabled={selectedInactiveCount === 0}
                      className="h-10 rounded-xl border-2 font-medium"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      활성화 {selectedInactiveCount > 0 && `(${selectedInactiveCount})`}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkDeactivate(selectedIds)}
                      disabled={selectedActiveCount === 0}
                      className="h-10 rounded-xl border-2 font-medium"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      비활성화 {selectedActiveCount > 0 && `(${selectedActiveCount})`}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkHardDelete(selectedIds)}
                      className="h-10 rounded-xl font-medium"
                    >
                      완전삭제
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Premium Table */}
        <Card className="rounded-2xl shadow-lg border-0 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="text-gray-500 text-lg">기사 정보를 불러오는 중...</span>
              </div>
            </div>
          ) : driversData.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-16 w-16 mx-auto text-gray-300 mb-4">
                <User className="h-16 w-16" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                등록된 기사가 없습니다
              </h3>
              <p className="text-gray-500 mb-4">
                새로운 기사를 등록해보세요.
              </p>
              {hasPermission('drivers', 'create') && (
                <Button onClick={() => setCreateModalOpen(true)} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                  기사 등록
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200">
                    <th className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-900">상태</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-900">성함</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-900">연락처</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-900">차량번호</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-900">사업상호</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-900">대표자</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-purple-900">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {driversData.map((driver: DriverResponse, index) => (
                    <ContextMenu key={driver.id} items={getContextMenuItems({
                      id: driver.id,
                      isActive: driver.isActive,
                      name: driver.name,
                      phone: driver.phone,
                      vehicleNumber: driver.vehicleNumber,
                      businessName: driver.businessName || undefined,
                      representative: driver.representative || undefined,
                      businessNumber: driver.businessNumber || undefined,
                      bankName: driver.bankName || undefined,
                      accountNumber: driver.accountNumber || undefined,
                      remarks: driver.remarks || undefined
                    } as DriverItem)} asChild>
                      <tr className="hover:bg-purple-50/50 cursor-context-menu transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(driver.id)}
                            onChange={(e) => handleSelectItem(driver.id, e.target.checked)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant={driver.isActive ? 'default' : 'secondary'}
                            className={`rounded-full ${driver.isActive ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}`}
                          >
                            {driver.isActive ? '활성' : '비활성'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{driver.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{driver.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 font-mono">{driver.vehicleNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{driver.businessName || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{driver.representative || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePhoneCall(driver as any)}
                              className="h-8 w-8 p-0 hover:bg-purple-100"
                              title="전화 걸기"
                            >
                              <Phone className="h-4 w-4 text-purple-600" />
                            </Button>
                            {hasPermission('drivers', 'update') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditDriver(driver)}
                                className="h-8 w-8 p-0 hover:bg-purple-100"
                                title="수정"
                              >
                                <User className="h-4 w-4 text-purple-600" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    </ContextMenu>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        
        {/* Load More */}
        {hasNextPage && !isFetchingNextPage && driversData.length > 0 && (
          <div className="flex justify-center py-6">
            <Button 
              variant="outline" 
              onClick={() => fetchNextPage?.()}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 rounded-xl h-12 px-8 font-medium"
            >
              더 보기 ({totalCount - driversData.length}개 남음)
            </Button>
          </div>
        )}
        
        {/* Infinite scroll loading indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-6">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              <span className="text-sm">추가 데이터 로딩 중...</span>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="rounded-2xl shadow-lg p-0 gap-0 max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-1">
            <DialogHeader className="bg-white m-1 rounded-xl p-6">
              <DialogTitle className="text-xl font-bold text-purple-900">새 기사 등록</DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-0">
            <DriverForm
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
              onCancel={() => setCreateModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={(open) => {
        if (!open) {
          setEditModalOpen(false)
          setEditingDriver(null)
        }
      }}>
        <DialogContent className="rounded-2xl shadow-lg p-0 gap-0 max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-1">
            <DialogHeader className="bg-white m-1 rounded-xl p-6">
              <DialogTitle className="text-xl font-bold text-purple-900">기사 정보 수정</DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-0">
            {editingDriver && (
              <DriverForm
                driver={editingDriver}
                onSubmit={handleUpdate}
                isLoading={updateMutation.isPending}
                onCancel={() => {
                  setEditModalOpen(false)
                  setEditingDriver(null)
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Import Modal */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="drivers"
        onSuccess={() => {
          window.location.reload()
        }}
      />
    </div>
  )
}
