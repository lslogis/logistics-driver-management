'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, User, Building, CreditCard, Upload, Phone, Edit, Trash2, Car, UserX, X, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { DriverResponse, CreateDriverData, UpdateDriverData } from '@/lib/validations/driver'
import ManagementPageLayout from '@/components/layout/ManagementPageLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { 
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useActivateDriver,
  useDeactivateDriver,
  useHardDeleteDriver,
  useBulkActivateDrivers,
  useBulkDeactivateDrivers,
  useBulkDeleteDrivers,
  useExportDrivers
} from '@/hooks/useDrivers'


// 기사 폼 컴포넌트
interface DriverFormProps {
  driver?: DriverResponse
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

function DriverForm({ driver, onSubmit, isLoading, onCancel }: DriverFormProps) {
  const [formData, setFormData] = useState({
    name: driver?.name || '',
    phone: driver?.phone || '',
    vehicleNumber: driver?.vehicleNumber || '',
    businessName: driver?.businessName || '',
    representative: driver?.representative || '',
    businessNumber: driver?.businessNumber || '',
    bankName: driver?.bankName || '',
    accountNumber: driver?.accountNumber || '',
    remarks: driver?.remarks || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">
            성함 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="phone">
            연락처 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="tel"
            id="phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="010-1234-5678"
          />
        </div>

        <div>
          <Label htmlFor="vehicleNumber">
            차량번호 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="vehicleNumber"
            required
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
            placeholder="예: 12가3456"
          />
        </div>

        <div>
          <Label htmlFor="businessName">사업상호</Label>
          <Input
            type="text"
            id="businessName"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="representative">대표자</Label>
          <Input
            type="text"
            id="representative"
            value={formData.representative}
            onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="businessNumber">사업번호</Label>
          <Input
            type="text"
            id="businessNumber"
            value={formData.businessNumber}
            onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
            placeholder="000-00-00000"
          />
        </div>

        <div>
          <Label htmlFor="bankName">계좌은행</Label>
          <Input
            type="text"
            id="bankName"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="accountNumber">계좌번호</Label>
          <Input
            type="text"
            id="accountNumber"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            placeholder="숫자만 입력"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="remarks">특이사항</Label>
        <textarea
          id="remarks"
          rows={3}
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '처리 중...' : driver ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  )
}

// 메인 DriversPage 컴포넌트
export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // 'active', 'inactive', '' (전체)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<DriverResponse | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useDrivers(searchTerm, statusFilter)
  
  // Flatten infinite query data
  const driversData = data?.pages?.flatMap((page: any) => page.drivers) || []
  // 모든 페이지에서 동일한 totalCount를 사용 (가장 최신 페이지의 totalCount)
  const totalCount = data?.pages?.[data?.pages?.length - 1]?.pagination?.total || data?.pages?.[0]?.pagination?.total || 0
  
  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop 
        >= document.documentElement.offsetHeight - 1000) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const createMutation = useCreateDriver()
  const updateMutation = useUpdateDriver()
  const activateMutation = useActivateDriver()
  const deactivateMutation = useDeactivateDriver()
  const hardDeleteMutation = useHardDeleteDriver()
  const bulkActivateMutation = useBulkActivateDrivers()
  const bulkDeactivateMutation = useBulkDeactivateDrivers()
  const bulkDeleteMutation = useBulkDeleteDrivers()
  const exportMutation = useExportDrivers()

  const handleCreateSubmit = (data: CreateDriverData) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsCreateModalOpen(false)
    })
  }

  const handleUpdateSubmit = (data: UpdateDriverData) => {
    if (!editingDriver) return
    
    updateMutation.mutate(
      { id: editingDriver.id, data },
      {
        onSuccess: () => setEditingDriver(null)
      }
    )
  }

  const handleActivate = (id: string) => {
    activateMutation.mutate(id)
  }

  const handleDeactivate = (id: string) => {
    if (window.confirm('정말로 이 기사를 비활성화하시겠습니까?')) {
      deactivateMutation.mutate(id)
    }
  }

  const handleHardDelete = (id: string) => {
    if (window.confirm('정말로 이 기사를 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      hardDeleteMutation.mutate(id)
    }
  }

  const handleBulkActivate = (ids: string[]) => {
    // 비활성화 상태인 항목만 필터링
    const inactiveIds = ids.filter(id => {
      const item = driversData.find(item => item.id === id)
      return item && !item.isActive
    })
    
    if (inactiveIds.length === 0) {
      toast.error('활성화할 수 있는 항목이 없습니다. (이미 모두 활성화되었거나 선택된 항목이 없습니다)')
      return
    }
    
    if (inactiveIds.length < ids.length) {
      toast.warning(`${ids.length}개 중 ${inactiveIds.length}개만 활성화됩니다. (나머지는 이미 활성화 상태)`)
    }
    
    bulkActivateMutation.mutate(inactiveIds, {
      onSuccess: () => setSelectedIds([])
    })
  }

  const handleBulkDeactivate = (ids: string[]) => {
    // 활성화 상태인 항목만 필터링
    const activeIds = ids.filter(id => {
      const item = driversData.find(item => item.id === id)
      return item && item.isActive
    })
    
    if (activeIds.length === 0) {
      toast.error('비활성화할 수 있는 항목이 없습니다. (이미 모두 비활성화되었거나 선택된 항목이 없습니다)')
      return
    }
    
    const confirmMessage = activeIds.length < ids.length 
      ? `${ids.length}개 중 ${activeIds.length}개만 비활성화됩니다. (나머지는 이미 비활성화 상태)\n계속하시겠습니까?`
      : `선택된 ${activeIds.length}개 기사를 비활성화하시겠습니까?`
    
    if (window.confirm(confirmMessage)) {
      bulkDeactivateMutation.mutate(activeIds, {
        onSuccess: () => setSelectedIds([])
      })
    }
  }

  const handleBulkHardDelete = (ids: string[]) => {
    if (window.confirm(`선택된 ${ids.length}개 기사를 완전히 삭제하시겠습니까?`)) {
      bulkDeleteMutation.mutate(ids, {
        onSuccess: () => setSelectedIds([])
      })
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(driversData.map(item => item.id))
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">오류가 발생했습니다</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 mb-4">
              {error instanceof Error ? error.message : '알 수 없는 오류'}
            </p>
            <Button onClick={() => window.location.reload()}>
              새로고침
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isAllSelected = driversData.length > 0 && selectedIds.length === driversData.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < driversData.length
  
  // 선택된 항목들의 상태 분석
  const selectedItems = driversData.filter(item => selectedIds.includes(item.id))
  const selectedActiveCount = selectedItems.filter(item => item.isActive).length
  const selectedInactiveCount = selectedItems.filter(item => !item.isActive).length
  
  // 버튼 활성화 상태 계산
  const canActivate = selectedInactiveCount > 0
  const canDeactivate = selectedActiveCount > 0

  return (
    <ManagementPageLayout
      title="기사 관리"
      icon={<User />}
      totalCount={totalCount}
      countLabel="명"
      primaryAction={{
        label: '기사 등록',
        onClick: () => setIsCreateModalOpen(true),
        icon: <Plus className="h-4 w-4" />,
      }}
      secondaryActions={[{
        label: 'Excel 가져오기',
        onClick: () => window.location.href = '/import/drivers',
        icon: <Upload className="h-4 w-4" />,
      }]}
      exportAction={{
        label: 'Excel 내보내기',
        onClick: () => exportMutation.mutate('excel'),
        loading: exportMutation.isPending,
      }}
      searchFilters={[
        {
          label: '검색',
          type: 'text',
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: '성함, 연락처, 차량번호, 사업상호, 대표자, 계좌번호로 검색...',
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
        },
      ]}
      isLoading={isLoading}
      error={error ? String(error) : undefined}
    >
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.length}개 항목 선택됨
            </span>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkActivate(selectedIds)}
                leftIcon={<CheckCircle className="h-4 w-4" />}
                disabled={!canActivate}
                title={!canActivate ? '활성화할 수 있는 항목이 없습니다' : `${selectedInactiveCount}개 항목을 활성화합니다`}
              >
                활성화 {selectedInactiveCount > 0 && `(${selectedInactiveCount})`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkDeactivate(selectedIds)}
                leftIcon={<UserX className="h-4 w-4" />}
                disabled={!canDeactivate}
                title={!canDeactivate ? '비활성화할 수 있는 항목이 없습니다' : `${selectedActiveCount}개 항목을 비활성화합니다`}
              >
                비활성화 {selectedActiveCount > 0 && `(${selectedActiveCount})`}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkHardDelete(selectedIds)}
                leftIcon={<X className="h-4 w-4" />}
              >
                완전삭제
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">성함</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">연락처</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">차량번호</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">사업상호</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">대표자</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">계좌은행</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">계좌번호</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">특이사항</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {driversData.map((driver: DriverResponse) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(driver.id)}
                      onChange={(e) => handleSelectItem(driver.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                    {!driver.isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                        비활성
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {driver.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {driver.vehicleNumber || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {driver.businessName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {driver.representative || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {driver.bankName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {driver.accountNumber || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500" title={driver.remarks || ''}>
                    {driver.remarks || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setEditingDriver(driver)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => driver.isActive ? handleDeactivate(driver.id) : handleActivate(driver.id)}
                        className={`p-1 transition-colors ${
                          driver.isActive 
                            ? 'text-gray-400 hover:text-yellow-600' 
                            : 'text-gray-400 hover:text-green-600'
                        }`}
                        title={driver.isActive ? '비활성화' : '활성화'}
                      >
                        {driver.isActive ? <UserX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {driversData.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                    <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 기사가 없습니다</h3>
                    <p className="text-gray-500 mb-4">새로운 기사를 등록해보세요.</p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      기사 등록
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Infinite scroll loading indicator and manual load more */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm">추가 데이터 로딩 중...</span>
          </div>
        </div>
      )}
      
      {/* Manual load more button */}
      {hasNextPage && !isFetchingNextPage && driversData.length > 0 && (
        <div className="flex justify-center py-4">
          <Button 
            variant="outline" 
            onClick={() => fetchNextPage()}
            className="text-gray-600 hover:text-gray-900"
          >
            더 보기 ({totalCount - driversData.length}개 남음)
          </Button>
        </div>
      )}

      {/* 생성 모달 */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기사 등록</DialogTitle>
            <DialogClose onClick={() => setIsCreateModalOpen(false)} />
          </DialogHeader>
          <DriverForm
            onSubmit={handleCreateSubmit}
            isLoading={createMutation.isPending}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 수정 모달 */}
      <Dialog open={!!editingDriver} onOpenChange={(open) => !open && setEditingDriver(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기사 정보 수정</DialogTitle>
            <DialogClose onClick={() => setEditingDriver(null)} />
          </DialogHeader>
          {editingDriver && (
            <DriverForm
              driver={editingDriver}
              onSubmit={handleUpdateSubmit}
              isLoading={updateMutation.isPending}
              onCancel={() => setEditingDriver(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </ManagementPageLayout>
  )
}