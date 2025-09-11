'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, User, Building, CreditCard, Upload, Phone, Edit, Trash2, Car, UserX, X } from 'lucide-react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { DriverResponse, CreateDriverData, UpdateDriverData } from '@/lib/validations/driver'
import ManagementPageLayout from '@/components/layout/ManagementPageLayout'
import { DataTable, commonActions } from '@/components/ui/DataTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { ExportButton } from '@/components/ExportButton'
import { useExportDrivers } from '@/hooks/useImports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// 기사 목록 조회 - 무한 스크롤
function useDrivers(search?: string) {
  return useInfiniteQuery({
    queryKey: ['drivers', search],
    initialPageParam: 1,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '50',
        ...(search && { search })
      })
      
      const response = await fetch(`/api/drivers?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to fetch drivers')
      }
      
      return result.data
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    staleTime: 30000, // 30초 동안 fresh
    retry: 2
  })
}

// 기사 생성 뮤테이션
function useCreateDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateDriverData) => {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create driver')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('기사가 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 수정 뮤테이션
function useUpdateDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDriverData }) => {
      const response = await fetch(`/api/drivers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update driver')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('기사 정보가 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 비활성화 뮤테이션 (기존 DELETE API 사용)
function useDeactivateDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/drivers/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to deactivate driver')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('기사가 비활성화되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// 기사 완전 삭제 뮤테이션 (새로 추가)
function useHardDeleteDriver() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/drivers/${id}?hard=true`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete driver')
      }
      
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      toast.success('기사가 완전히 삭제되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

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
  } = useDrivers(searchTerm)
  
  // Flatten infinite query data
  const driversData = data?.pages?.flatMap((page: any) => page.drivers) || []
  const totalCount = data?.pages?.[0]?.pagination?.total || 0
  
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
  const deactivateMutation = useDeactivateDriver()
  const hardDeleteMutation = useHardDeleteDriver()
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

  // 대량 작업 핸들러들
  const handleBulkDeactivate = (ids: string[]) => {
    if (window.confirm(`선택된 ${ids.length}개 기사를 비활성화하시겠습니까?`)) {
      Promise.all(ids.map(id => deactivateMutation.mutateAsync(id)))
        .then(() => {
          setSelectedIds([])
          toast.success(`${ids.length}개 기사가 비활성화되었습니다`)
        })
        .catch(() => {
          toast.error('일부 기사 비활성화에 실패했습니다')
        })
    }
  }

  const handleBulkHardDelete = (ids: string[]) => {
    if (window.confirm(`선택된 ${ids.length}개 기사를 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      Promise.all(ids.map(id => hardDeleteMutation.mutateAsync(id)))
        .then(() => {
          setSelectedIds([])
          toast.success(`${ids.length}개 기사가 완전히 삭제되었습니다`)
        })
        .catch(() => {
          toast.error('일부 기사 삭제에 실패했습니다')
        })
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

  // Define table columns - 새로운 9컬럼 구조
  const columns = [
    {
      key: 'name',
      header: '성함',
      width: '12%',
      render: (value: any, driver: DriverResponse) => (
        <div className="flex items-center justify-center">
          <div>
            <p className="font-medium text-gray-900">{driver.name}</p>
            {!driver.isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                비활성
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: '연락처',
      width: '12%',
      render: (value: any, driver: DriverResponse) => (
        <div className="text-sm text-gray-900">
          {driver.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
        </div>
      ),
    },
    {
      key: 'vehicleNumber',
      header: '차량번호',
      width: '10%',
      render: (value: any, driver: DriverResponse) => (
        <div className="text-sm text-gray-900 whitespace-nowrap">
          {driver.vehicleNumber || '-'}
        </div>
      ),
    },
    {
      key: 'business',
      header: '사업상호',
      width: '15%',
      render: (value: any, driver: DriverResponse) => (
        <div className="text-sm text-gray-900">
          {driver.businessName || '-'}
        </div>
      ),
    },
    {
      key: 'representative',
      header: '대표자',
      width: '10%',
      render: (value: any, driver: DriverResponse) => (
        <div className="text-sm text-gray-900">
          {driver.representative || '-'}
        </div>
      ),
    },
    {
      key: 'bankName',
      header: '계좌은행',
      width: '10%',
      render: (value: any, driver: DriverResponse) => (
        <div className="text-sm text-gray-900">
          {driver.bankName || '-'}
        </div>
      ),
    },
    {
      key: 'accountNumber',
      header: '계좌번호',
      width: '15%',
      render: (value: any, driver: DriverResponse) => (
        <div className="text-sm text-gray-900">
          {driver.accountNumber || '-'}
        </div>
      ),
    },
    {
      key: 'remarks',
      header: '특이사항',
      width: '16%',
      render: (value: any, driver: DriverResponse) => (
        <div className="text-sm text-gray-500" title={driver.remarks || ''}>
          {driver.remarks || '-'}
        </div>
      ),
    },
  ]

  // Define table actions - only edit button
  const actions = [
    commonActions.edit(
      (driver: DriverResponse) => setEditingDriver(driver),
      () => true
    ),
  ]

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
      ]}
      isLoading={isLoading}
      error={error ? String(error) : undefined}
    >
      <DataTable
          data={driversData}
          columns={columns}
          actions={actions}
          selectable={true}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          getItemId={(driver) => driver.id}
        bulkActions={[
          {
            icon: <UserX className="h-4 w-4" />,
            label: '선택된 항목 비활성화',
            onClick: handleBulkDeactivate,
            variant: 'warning'
          },
          {
            icon: <X className="h-4 w-4" />,
            label: '선택된 항목 완전삭제',
            onClick: handleBulkHardDelete,
            variant: 'danger'
          }
        ]}
        emptyState={{
          icon: <User />,
          title: '등록된 기사가 없습니다',
          description: '새로운 기사를 등록해보세요.',
          action: {
            label: '기사 등록',
            onClick: () => setIsCreateModalOpen(true),
          },
        }}
        isLoading={isLoading}
      />
      
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