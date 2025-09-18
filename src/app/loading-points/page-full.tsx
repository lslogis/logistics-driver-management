'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, MapPin, Edit, X, UserX, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { 
  LoadingPointResponse, 
  useLoadingPoints,
  useCreateLoadingPoint,
  useUpdateLoadingPoint,
  useActivateLoadingPoint,
  useDeactivateLoadingPoint,
  useHardDeleteLoadingPoint,
  useBulkActivateLoadingPoints,
  useBulkDeactivateLoadingPoints,
  useBulkDeleteLoadingPoints,
  useExportLoadingPoints,
  CreateLoadingPointData,
  UpdateLoadingPointData
} from '@/hooks/useLoadingPoints'
import ManagementPageLayout from '@/components/layout/ManagementPageLayout'
import { DataTable } from '@/components/ui/DataTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AddressSearchInput, { SelectedAddress } from '@/components/ui/AddressSearchInput'

// 상차지 폼 컴포넌트
interface LoadingPointFormProps {
  loadingPoint?: LoadingPointResponse
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

function LoadingPointForm({ loadingPoint, onSubmit, isLoading, onCancel }: LoadingPointFormProps) {
  const [formData, setFormData] = useState({
    centerName: loadingPoint?.centerName || '',
    loadingPointName: loadingPoint?.loadingPointName || '',
    lotAddress: loadingPoint?.lotAddress || '',
    roadAddress: loadingPoint?.roadAddress || '',
    manager1: loadingPoint?.manager1 || '',
    manager2: loadingPoint?.manager2 || '',
    phone1: loadingPoint?.phone1 || '',
    phone2: loadingPoint?.phone2 || ''
  })

  const handleAddressSelect = (address: SelectedAddress) => {
    setFormData(prev => ({
      ...prev,
      lotAddress: address.lotAddress,
      roadAddress: address.roadAddress,
      // 카카오맵 검색 결과에서 상차지명과 대표번호 자동 입력
      loadingPointName: address.placeName || prev.loadingPointName,
      phone1: address.phone || prev.phone1,
      // 대표번호가 있으면 담당자1에 "대표번호" 입력
      manager1: address.phone ? "대표번호" : prev.manager1
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-1 gap-4">
        {/* 센터명과 상차지명 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="centerName">
              센터명 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="centerName"
              required
              value={formData.centerName}
              onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
              placeholder="예: 서울물류센터"
            />
          </div>
          <div>
            <Label htmlFor="loadingPointName">
              상차지명 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              id="loadingPointName"
              required
              value={formData.loadingPointName}
              onChange={(e) => setFormData({ ...formData, loadingPointName: e.target.value })}
              placeholder="예: A동 1층"
            />
          </div>
        </div>

        {/* 주소 검색 */}
        <AddressSearchInput
          label="주소 검색"
          placeholder="주소를 검색하세요"
          lotAddress={formData.lotAddress}
          roadAddress={formData.roadAddress}
          onAddressSelect={handleAddressSelect}
        />

        {/* 담당자 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="manager1">담당자1</Label>
            <Input
              type="text"
              id="manager1"
              value={formData.manager1}
              onChange={(e) => setFormData({ ...formData, manager1: e.target.value })}
              placeholder="예: 김담당"
            />
          </div>
          <div>
            <Label htmlFor="manager2">담당자2</Label>
            <Input
              type="text"
              id="manager2"
              value={formData.manager2}
              onChange={(e) => setFormData({ ...formData, manager2: e.target.value })}
              placeholder="예: 박부담당"
            />
          </div>
        </div>

        {/* 연락처 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone1">연락처1</Label>
            <Input
              type="tel"
              id="phone1"
              value={formData.phone1}
              onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
              placeholder="예: 02-1234-5678"
            />
          </div>
          <div>
            <Label htmlFor="phone2">연락처2</Label>
            <Input
              type="tel"
              id="phone2"
              value={formData.phone2}
              onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
              placeholder="예: 010-1234-5678"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '처리 중...' : loadingPoint ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  )
}

// 메인 LoadingPointsPage 컴포넌트
export default function LoadingPointsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingLoadingPoint, setEditingLoadingPoint] = useState<LoadingPointResponse | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useLoadingPoints(searchTerm)
  
  // Flatten infinite query data
  const loadingPointsData = data?.pages?.flatMap((page: any) => (page.items || page.data || [])) || []
  const totalCount = data?.pages?.[0]?.totalCount || 0
  
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

  const createMutation = useCreateLoadingPoint()
  const updateMutation = useUpdateLoadingPoint()
  const activateMutation = useActivateLoadingPoint()
  const deactivateMutation = useDeactivateLoadingPoint()
  const hardDeleteMutation = useHardDeleteLoadingPoint()
  const bulkActivateMutation = useBulkActivateLoadingPoints()
  const bulkDeactivateMutation = useBulkDeactivateLoadingPoints()
  const bulkDeleteMutation = useBulkDeleteLoadingPoints()
  const exportMutation = useExportLoadingPoints()

  const handleCreateSubmit = (data: CreateLoadingPointData) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsCreateModalOpen(false)
    })
  }

  const handleUpdateSubmit = (data: UpdateLoadingPointData) => {
    if (!editingLoadingPoint) return
    
    updateMutation.mutate(
      { id: editingLoadingPoint.id, data },
      {
        onSuccess: () => setEditingLoadingPoint(null)
      }
    )
  }

  const handleActivate = (id: string) => {
    activateMutation.mutate(id)
  }

  const handleDeactivate = (id: string) => {
    if (window.confirm('정말로 이 상차지를 비활성화하시겠습니까?')) {
      deactivateMutation.mutate(id)
    }
  }

  const handleHardDelete = (id: string) => {
    if (window.confirm('정말로 이 상차지를 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      hardDeleteMutation.mutate(id)
    }
  }

  // 대량 작업 핸들러들
  const handleBulkActivate = (ids: string[]) => {
    bulkActivateMutation.mutate(ids, {
      onSuccess: () => {
        setSelectedIds([])
      }
    })
  }

  const handleBulkDeactivate = (ids: string[]) => {
    if (window.confirm(`선택된 ${ids.length}개 상차지를 비활성화하시겠습니까?`)) {
      bulkDeactivateMutation.mutate(ids, {
        onSuccess: () => {
          setSelectedIds([])
        }
      })
    }
  }

  const handleBulkHardDelete = (ids: string[]) => {
    if (window.confirm(`선택된 ${ids.length}개 상차지를 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      bulkDeleteMutation.mutate(ids, {
        onSuccess: () => {
          setSelectedIds([])
        }
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

  // Define table columns
  const columns = [
    {
      key: 'centerName',
      header: '센터명',
      width: '20%',
      render: (value: any, loadingPoint: LoadingPointResponse) => (
        <div className="flex items-center">
          <div>
            <p className="font-medium text-gray-900">{loadingPoint.centerName}</p>
            {!loadingPoint.isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                비활성
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'loadingPointName',
      header: '상차지명',
      width: '20%',
      render: (value: any, loadingPoint: LoadingPointResponse) => (
        <div className="text-sm text-gray-900">
          {loadingPoint.loadingPointName || '-'}
        </div>
      ),
    },
    {
      key: 'address',
      header: '주소',
      width: '25%',
      render: (value: any, loadingPoint: LoadingPointResponse) => (
        <div className="text-sm text-gray-900">
          {loadingPoint.roadAddress && (
            <div className="mb-1">{loadingPoint.roadAddress}</div>
          )}
          {loadingPoint.lotAddress && (
            <div className="text-gray-600 text-xs">{loadingPoint.lotAddress}</div>
          )}
          {!loadingPoint.roadAddress && !loadingPoint.lotAddress && '-'}
        </div>
      ),
    },
    {
      key: 'managers',
      header: '담당자',
      width: '15%',
      render: (value: any, loadingPoint: LoadingPointResponse) => (
        <div className="text-sm text-gray-900">
          {loadingPoint.manager1 && (
            <div>{loadingPoint.manager1}</div>
          )}
          {loadingPoint.manager2 && (
            <div className="text-gray-600">{loadingPoint.manager2}</div>
          )}
          {!loadingPoint.manager1 && !loadingPoint.manager2 && '-'}
        </div>
      ),
    },
    {
      key: 'phones',
      header: '연락처',
      width: '15%',
      render: (value: any, loadingPoint: LoadingPointResponse) => (
        <div className="text-sm text-gray-900">
          {loadingPoint.phone1 && (
            <div>{loadingPoint.phone1}</div>
          )}
          {loadingPoint.phone2 && (
            <div className="text-gray-600">{loadingPoint.phone2}</div>
          )}
          {!loadingPoint.phone1 && !loadingPoint.phone2 && '-'}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: '등록일',
      width: '10%',
      render: (value: any, loadingPoint: LoadingPointResponse) => (
        <div className="text-sm text-gray-500">
          {new Date(loadingPoint.createdAt).toLocaleDateString('ko-KR')}
        </div>
      ),
    },
    {
      key: 'updatedAt',
      header: '수정일',
      width: '10%',
      render: (value: any, loadingPoint: LoadingPointResponse) => (
        <div className="text-sm text-gray-500">
          {new Date(loadingPoint.updatedAt).toLocaleDateString('ko-KR')}
        </div>
      ),
    },
  ]

  // Define table actions
  const actions = [
    {
      icon: <Edit className="h-4 w-4" />,
      label: '수정',
      onClick: (loadingPoint: LoadingPointResponse) => setEditingLoadingPoint(loadingPoint),
      variant: 'default' as const,
    },
    {
      icon: <UserX className="h-4 w-4" />,
      label: '비활성화/활성화',
      onClick: (loadingPoint: LoadingPointResponse) => 
        loadingPoint.isActive ? handleDeactivate(loadingPoint.id) : handleActivate(loadingPoint.id),
      variant: 'warning' as const,
    }
  ]

  return (
    <ManagementPageLayout
      title="상차지 관리"
      icon={<MapPin />}
      totalCount={totalCount}
      countLabel="곳"
      primaryAction={{
        label: '상차지 등록',
        onClick: () => setIsCreateModalOpen(true),
        icon: <Plus className="h-4 w-4" />,
      }}
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
          placeholder: '센터명, 상차지명, 주소로 검색...',
        },
      ]}
      isLoading={isLoading}
      error={error ? String(error) : undefined}
    >
      <DataTable
        data={loadingPointsData}
        columns={columns}
        actions={actions}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        getItemId={(loadingPoint) => loadingPoint.id}
        bulkActions={[
          {
            icon: <CheckCircle className="h-4 w-4" />,
            label: '선택된 항목 활성화',
            onClick: handleBulkActivate,
            variant: 'success'
          },
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
          icon: <MapPin />,
          title: '등록된 상차지가 없습니다',
          description: '새로운 상차지를 등록해보세요.',
          action: {
            label: '상차지 등록',
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
      {hasNextPage && !isFetchingNextPage && loadingPointsData.length > 0 && (
        <div className="flex justify-center py-4">
          <Button 
            variant="outline" 
            onClick={() => fetchNextPage()}
            className="text-gray-600 hover:text-gray-900"
          >
            더 보기 ({totalCount - loadingPointsData.length}개 남음)
          </Button>
        </div>
      )}

      {/* 생성 모달 */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>상차지 등록</DialogTitle>
            <DialogClose onClick={() => setIsCreateModalOpen(false)} />
          </DialogHeader>
          <LoadingPointForm
            onSubmit={handleCreateSubmit}
            isLoading={createMutation.isPending}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 수정 모달 */}
      <Dialog open={!!editingLoadingPoint} onOpenChange={(open) => !open && setEditingLoadingPoint(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>상차지 정보 수정</DialogTitle>
            <DialogClose onClick={() => setEditingLoadingPoint(null)} />
          </DialogHeader>
          {editingLoadingPoint && (
            <LoadingPointForm
              loadingPoint={editingLoadingPoint}
              onSubmit={handleUpdateSubmit}
              isLoading={updateMutation.isPending}
              onCancel={() => setEditingLoadingPoint(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </ManagementPageLayout>
  )
}