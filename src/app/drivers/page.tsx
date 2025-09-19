'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useMemo } from 'react'
import { Plus, User, Upload, Download, Search, CheckCircle, XCircle, TrendingUp, Trash2, Eye, Edit, Phone, X, Building2, MessageSquare, Calendar, Clock, Copy, CreditCard } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { DriverResponse, CreateDriverData, UpdateDriverData } from '@/lib/validations/driver'
import { copyToClipboard, formatDriverInfoBasic, formatDriverInfoExtended, shareToKakao } from '@/lib/utils/share'
import { cn } from '@/lib/utils'

// 전화번호 포맷팅 함수
const formatPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }
  return phone
}
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
import { ContextMenu } from '@/components/ui/ContextMenu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getDriverContextMenuItems, DriverItem } from '@/components/templates/DriversTemplateConfig'
import DriverForm from '@/components/forms/DriverForm'
import { ImportModal } from '@/components/import'

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<DriverResponse | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingDriver, setViewingDriver] = useState<DriverResponse | null>(null)
  
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
  } = useDrivers(searchTerm, normalizedStatusFilter)
  
  const driversData = useMemo(() => {
    const drivers = data?.pages?.flatMap((page: any) => page.drivers) || []
    // 성함 순으로 정렬 (한글 이름 정렬)
    return drivers.sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'))
  }, [data])

  const driverStats = useMemo(() => {
    const total = driversData.length
    const active = driversData.filter(driver => driver.isActive).length
    return {
      total,
      active,
      inactive: total - active
    }
  }, [driversData])

  const totalCount = useMemo(() => {
    const pages = data?.pages || []
    if (pages.length === 0) return 0
    // 첫 번째 페이지에서 총 개수 가져오기
    const firstPage = pages[0]
    return firstPage?.pagination?.total || driversData.length
  }, [data, driversData.length])
  
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

  const handleEditDriver = (driver: DriverResponse | DriverItem) => {
    const fullDriver = driversData.find(d => d.id === driver.id) || null
    setEditingDriver(fullDriver)
    setEditModalOpen(true)
  }

  const handleViewDriver = (driver: DriverResponse) => {
    setViewingDriver(driver)
    setViewModalOpen(true)
  }

  // Context menu items generator
  const getContextMenuItems = (driver: DriverItem) => {
    return getDriverContextMenuItems(driver, {
      onCopyBasic: handleCopyDriverBasic,
      onCopyExtended: handleCopyDriverExtended,
      onKakaoShareBasic: handleShareToKakaoBasic,
      onKakaoShareExtended: handleShareToKakaoExtended,
      onEdit: handleEditDriver,
      onActivate: handleActivate,
      onDeactivate: handleDeactivate,
      onHardDelete: (driverItem) => handleSingleHardDelete(driverItem.id)
    })
  }
  
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

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }
  
  const hasActiveFilters = Boolean(searchTerm || statusFilter !== 'all')
  
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

  const handleSingleHardDelete = (id: string) => {
    if (window.confirm('이 기사를 완전히 삭제하시겠습니까?')) {
      bulkDeleteMutation.mutate([id])
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <User className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-red-700">오류가 발생했습니다</h2>
          <p className="mt-3 text-sm text-gray-600">{String(error)}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => window.location.reload()}>새로고침</Button>
            <Button variant="outline" onClick={() => window.history.back()}>뒤로가기</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-cyan-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">기사 관리</h1>
                <p className="text-lg text-gray-600 mt-1">운송기사를 효율적으로 관리하세요</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                기사 등록
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters and Actions */}
        <Card className="bg-white shadow-lg border-blue-200 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
                {/* Search Input */}
                <div className="flex-1 max-w-sm">
                  <Input
                    placeholder="기사명, 전화번호, 차량번호 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 bg-white rounded-md"
                  />
                </div>
                
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-11 border-2 border-blue-300 focus:border-blue-500 bg-white">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-3">
                {/* Bulk Action Buttons - Show when items selected */}
                {selectedIds.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkActivate(selectedIds)}
                      disabled={selectedInactiveCount === 0}
                      className="border-green-300 text-green-700 hover:bg-green-50 min-w-[140px]"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      활성화 ({selectedInactiveCount})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkDeactivate(selectedIds)}
                      disabled={selectedActiveCount === 0}
                      className="border-red-200 text-red-600 hover:bg-red-50 min-w-[140px]"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      비활성화 ({selectedActiveCount})
                    </Button>
                  </>
                )}
                
                {/* Action Buttons */}
                <Button
                  variant="outline"
                  onClick={() => setImportModalOpen(true)}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  가져오기
                </Button>

                <Button
                  variant="outline"
                  onClick={() => exportMutation.mutate()}
                  disabled={exportMutation.isPending}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportMutation.isPending ? '내보내는 중...' : '내보내기'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-white shadow-lg border-blue-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-gray-600">기사 목록을 불러오는 중...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && driversData.length === 0 && (
          <Card className="bg-white shadow-lg border-blue-200">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="mb-4">
                  <User className="h-16 w-16 text-blue-400 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  등록된 기사가 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  새로운 기사를 등록하여 시작해보세요.
                </p>
                <Button 
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  기사 등록
                </Button>
              </div>
            </CardContent>
          </Card>
        )}



        {/* Driver Table */}
        {!isLoading && driversData.length > 0 && (
          <Card className="bg-white shadow-lg border-blue-200">
            <CardContent className="p-0">
              {/* Header with Select All */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        전체 선택
                      </span>
                    </label>
                  </div>
                  <div className="text-sm text-gray-600">
                    총 {totalCount.toLocaleString()}개
                  </div>
                </div>
              </div>

              {/* Driver List */}
              <div className="divide-y divide-blue-100">
                    {driversData.map((driver: DriverResponse) => (
                      <ContextMenu
                        key={driver.id}
                        items={getContextMenuItems({
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
                        } as DriverItem)}
                        asChild
                      >
                        <div className={cn(
                          "p-6 hover:bg-blue-50/50 transition-colors cursor-pointer",
                          !driver.isActive && "bg-orange-50"
                        )}>
                          <div className="flex items-center space-x-4">
                            {/* Checkbox */}
                            <div className="flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(driver.id)}
                                onChange={(e) => handleSelectItem(driver.id, e.target.checked)}
                                className="rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                  <div className="space-y-2">
                                    {/* 첫째줄: 성함 (대표:대표자) */}
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="text-lg">
                                        <span className="font-semibold text-gray-900">{driver.name}</span>
                                        {driver.representative && (
                                          <span className="text-gray-500 ml-1">
                                            (대표: {driver.representative})
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        {!driver.isActive && (
                                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 font-semibold">
                                            비활성
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* 둘째줄: 사업정보 */}
                                    <div className="text-sm bg-blue-50/30 px-2 py-1 rounded">
                                      <span className="text-gray-600 font-medium">사업정보: </span>
                                      <span className="text-gray-900 font-semibold">{driver.businessName || '개인사업자'}</span>
                                      {driver.businessNumber && (
                                        <span className="text-blue-600 ml-1 font-semibold">
                                          ({driver.businessNumber})
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* 셋째줄: 차량정보 */}
                                    <div className="text-sm bg-blue-50/30 px-2 py-1 rounded">
                                      <span className="text-gray-600 font-medium">차량정보: </span>
                                      <span className="text-gray-900 font-semibold">{driver.vehicleNumber}</span>
                                      <span className="text-blue-600 ml-1 font-semibold">
                                        ({formatPhoneNumber(driver.phone)})
                                      </span>
                                    </div>
                                    
                                    {/* 넷째줄: 계좌정보 */}
                                    <div className="text-sm bg-blue-50/30 px-2 py-1 rounded">
                                      <span className="text-gray-600 font-medium">계좌정보: </span>
                                      <span className="text-gray-900 font-semibold">{driver.bankName || '미등록'}</span>
                                      <span className="text-blue-600 ml-1 font-semibold">
                                        ({driver.accountNumber || '미등록'})
                                      </span>
                                    </div>
                                    
                                    {/* 다섯째줄: 비고 */}
                                    {driver.remarks && (
                                      <div className="text-sm">
                                        <span className="text-gray-600 font-medium">비고: </span>
                                        <span className="text-gray-700 font-semibold">{driver.remarks}</span>
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
                                      handleViewDriver(driver)
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
                                      handleEditDriver(driver)
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
                                      window.open(`tel:${driver.phone}`)
                                    }}
                                    className="border-green-200 text-green-600 hover:bg-green-50"
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ContextMenu>
                    ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {hasNextPage && !isFetchingNextPage && driversData.length > 0 && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              onClick={() => fetchNextPage?.()}
              className="text-blue-700 hover:text-blue-800 hover:bg-blue-100 border-blue-300 rounded-xl h-12 px-8 font-medium"
            >
              더 보기 ({Math.max(0, totalCount - driversData.length)}개 남음)
            </Button>
          </div>
        )}

        {isFetchingNextPage && (
          <div className="flex justify-center py-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border border-blue-700 border-t-transparent" />
              추가 데이터 로딩 중...
            </div>
          </div>
        )}

        {/* Create Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="rounded-2xl shadow-lg p-0 gap-0 max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white text-center">새 기사 등록</h2>
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
        <Dialog
          open={editModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditModalOpen(false)
              setEditingDriver(null)
            }
          }}
        >
          <DialogContent className="rounded-2xl shadow-lg p-0 gap-0 max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white text-center">기사 정보 수정</h2>
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

        {/* Detail Drawer */}
        <div 
          className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
            viewModalOpen ? "visible" : "invisible"
          }`}
        >
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              viewModalOpen ? "opacity-50" : "opacity-0"
            }`}
            onClick={() => {
              setViewModalOpen(false)
              setViewingDriver(null)
            }}
          />
          
          {/* Drawer */}
          <div 
            className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl transition-transform duration-300 ease-in-out overflow-hidden ${
              viewModalOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">기사 상세 정보</h2>
                    <p className="text-blue-100 text-sm">Driver Details</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setViewModalOpen(false)
                    setViewingDriver(null)
                  }}
                  className="text-white hover:bg-white/20 p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            {viewingDriver && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 기사 정보 */}
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900 flex items-center">
                        <User className="h-5 w-5 mr-2 text-blue-600" />
                        기사 정보
                      </span>
                      <Badge
                        variant={viewingDriver.isActive ? "default" : "secondary"}
                        className={`text-sm font-semibold ${
                          viewingDriver.isActive 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : "bg-red-100 text-red-800 border-red-200"
                        }`}
                      >
                        {viewingDriver.isActive ? '활성' : '비활성'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xl font-bold text-gray-900">
                      {viewingDriver.name}
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600 mb-1">차량번호</div>
                      <div className="text-lg font-bold text-gray-900">{viewingDriver.vehicleNumber}</div>
                    </div>

                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600">{viewingDriver.name}</div>
                          <div className="font-semibold text-gray-900">
                            {formatPhoneNumber(viewingDriver.phone)}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`tel:${viewingDriver.phone}`)}
                          className="border-green-200 text-green-600 hover:bg-green-50"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const driverInfo = formatDriverInfoBasic({
                              id: viewingDriver.id,
                              isActive: viewingDriver.isActive,
                              name: viewingDriver.name,
                              phone: viewingDriver.phone,
                              vehicleNumber: viewingDriver.vehicleNumber,
                              businessName: viewingDriver.businessName,
                              representative: viewingDriver.representative,
                              businessNumber: viewingDriver.businessNumber,
                              bankName: viewingDriver.bankName,
                              accountNumber: viewingDriver.accountNumber,
                              remarks: viewingDriver.remarks
                            })
                            copyToClipboard(driverInfo)
                            toast.success('기사 정보가 클립보드에 복사되었습니다')
                          }}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 사업자 정보 */}
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                      사업자 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {viewingDriver.representative && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">대표:</span>
                        <span className="text-gray-900 font-semibold">{viewingDriver.representative}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">상호:</span>
                      <span className="text-gray-900 font-semibold">{viewingDriver.businessName || '개인사업자'}</span>
                    </div>
                    {viewingDriver.businessNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">사업자번호:</span>
                        <span className="text-blue-600 font-semibold">{viewingDriver.businessNumber}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 계좌 정보 */}
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                      계좌 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">은행:</span>
                      <span className="text-gray-900 font-semibold">{viewingDriver.bankName || '미등록'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">계좌번호:</span>
                      <span className="text-blue-600 font-semibold">{viewingDriver.accountNumber || '미등록'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* 비고 사항 */}
                {viewingDriver.remarks && (
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                        비고 사항
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                        <p className="text-gray-800 font-medium">{viewingDriver.remarks}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 시스템 정보 */}
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-blue-600" />
                      시스템 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">등록일:</span>
                      <span className="text-gray-900 font-semibold">
                        {viewingDriver.createdAt ? new Date(viewingDriver.createdAt).toLocaleDateString('ko-KR') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">최종 수정:</span>
                      <span className="text-gray-900 font-semibold">
                        {viewingDriver.updatedAt ? new Date(viewingDriver.updatedAt).toLocaleDateString('ko-KR') : '-'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Footer Actions */}
            <div className="border-t border-blue-100 bg-blue-50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (viewingDriver) {
                        const driverInfo = formatDriverInfoExtended({
                          id: viewingDriver.id,
                          isActive: viewingDriver.isActive,
                          name: viewingDriver.name,
                          phone: viewingDriver.phone,
                          vehicleNumber: viewingDriver.vehicleNumber,
                          businessName: viewingDriver.businessName,
                          representative: viewingDriver.representative,
                          businessNumber: viewingDriver.businessNumber,
                          bankName: viewingDriver.bankName,
                          accountNumber: viewingDriver.accountNumber,
                          remarks: viewingDriver.remarks
                        })
                        copyToClipboard(driverInfo)
                        toast.success('기사 정보가 클립보드에 복사되었습니다')
                      }
                    }}
                    className="border-blue-200 text-blue-600 hover:bg-blue-100"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    정보 복사
                  </Button>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewModalOpen(false)
                      setViewingDriver(null)
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    닫기
                  </Button>
                  <Button
                    onClick={() => {
                      if (viewingDriver) {
                        setViewModalOpen(false)
                        setViewingDriver(null)
                        handleEditDriver(viewingDriver)
                      }
                    }}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    수정하기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          type="drivers"
          onSuccess={() => {
            window.location.reload()
          }}
        />
      </div>
    </div>
  )
}
