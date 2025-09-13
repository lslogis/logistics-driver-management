'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Route, Upload, Edit, UserX, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import ManagementPageLayout from '@/components/layout/ManagementPageLayout'
import { DataTable, commonActions } from '@/components/ui/DataTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// RouteTemplate 타입 정의 (기존 구조 유지)
interface RouteTemplate {
  id: string
  name: string
  startLocation: string
  endLocation: string
  distance: number
  estimatedDuration: number
  tollFee: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Mock 데이터 (실제 API로 교체 예정)
const mockRouteTemplates: RouteTemplate[] = [
  {
    id: '1',
    name: '서울-부산 고속도로',
    startLocation: '서울시 강남구',
    endLocation: '부산시 해운대구',
    distance: 325.5,
    estimatedDuration: 240, // minutes
    tollFee: 35000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '인천-대구 일반도로',
    startLocation: '인천시 남동구',
    endLocation: '대구시 달서구',
    distance: 287.3,
    estimatedDuration: 180,
    tollFee: 28000,
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  },
  {
    id: '3',
    name: '광주-전주 단거리',
    startLocation: '광주시 북구',
    endLocation: '전주시 완산구',
    distance: 95.2,
    estimatedDuration: 90,
    tollFee: 12000,
    isActive: false,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z'
  }
]

// RouteTemplate 목록 조회 훅 (Mock)
function useRouteTemplates(search?: string) {
  const filteredRoutes = search
    ? mockRouteTemplates.filter(route =>
        route.name.toLowerCase().includes(search.toLowerCase()) ||
        route.startLocation.toLowerCase().includes(search.toLowerCase()) ||
        route.endLocation.toLowerCase().includes(search.toLowerCase())
      )
    : mockRouteTemplates

  return {
    data: filteredRoutes,
    isLoading: false,
    error: null,
    totalCount: filteredRoutes.length
  }
}

// RouteTemplate 생성 뮤테이션
function useCreateRouteTemplate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: any) => {
      // TODO: 실제 API 호출로 교체
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routeTemplates'] })
      toast.success('고정노선이 등록되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// RouteTemplate 수정 뮤테이션
function useUpdateRouteTemplate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // TODO: 실제 API 호출로 교체
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routeTemplates'] })
      toast.success('고정노선 정보가 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// RouteTemplate 비활성화 뮤테이션
function useDeactivateRouteTemplate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: 실제 API 호출로 교체
      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routeTemplates'] })
      toast.success('고정노선이 비활성화되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// RouteTemplate 완전 삭제 뮤테이션
function useHardDeleteRouteTemplate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: 실제 API 호출로 교체
      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routeTemplates'] })
      toast.success('고정노선이 완전히 삭제되었습니다')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// Excel 내보내기 뮤테이션
function useExportRouteTemplates() {
  return useMutation({
    mutationFn: async (format: string) => {
      // TODO: 실제 API 호출로 교체
      return { format }
    },
    onSuccess: (data) => {
      toast.success(`${data.format.toUpperCase()} 파일로 내보내기가 완료되었습니다`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// RouteTemplate 폼 컴포넌트
interface RouteTemplateFormProps {
  routeTemplate?: RouteTemplate
  onSubmit: (data: any) => void
  isLoading: boolean
  onCancel: () => void
}

function RouteTemplateForm({ routeTemplate, onSubmit, isLoading, onCancel }: RouteTemplateFormProps) {
  const [formData, setFormData] = useState({
    name: routeTemplate?.name || '',
    startLocation: routeTemplate?.startLocation || '',
    endLocation: routeTemplate?.endLocation || '',
    distance: routeTemplate?.distance?.toString() || '',
    estimatedDuration: routeTemplate?.estimatedDuration?.toString() || '',
    tollFee: routeTemplate?.tollFee?.toString() || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      distance: parseFloat(formData.distance),
      estimatedDuration: parseInt(formData.estimatedDuration),
      tollFee: parseInt(formData.tollFee)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">
            노선명 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="예: 서울-부산 고속도로"
          />
        </div>

        <div>
          <Label htmlFor="startLocation">
            출발지 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="startLocation"
            required
            value={formData.startLocation}
            onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
            placeholder="예: 서울시 강남구"
          />
        </div>

        <div>
          <Label htmlFor="endLocation">
            도착지 <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="endLocation"
            required
            value={formData.endLocation}
            onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
            placeholder="예: 부산시 해운대구"
          />
        </div>

        <div>
          <Label htmlFor="distance">
            거리(km) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            id="distance"
            step="0.1"
            required
            value={formData.distance}
            onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
            placeholder="예: 325.5"
          />
        </div>

        <div>
          <Label htmlFor="estimatedDuration">
            예상소요시간(분) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            id="estimatedDuration"
            required
            value={formData.estimatedDuration}
            onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
            placeholder="예: 240"
          />
        </div>

        <div>
          <Label htmlFor="tollFee">
            통행료(원)
          </Label>
          <Input
            type="number"
            id="tollFee"
            value={formData.tollFee}
            onChange={(e) => setFormData({ ...formData, tollFee: e.target.value })}
            placeholder="예: 35000"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '처리 중...' : routeTemplate ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  )
}

// 메인 RoutesPage 컴포넌트
export default function RoutesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRouteTemplate, setEditingRouteTemplate] = useState<RouteTemplate | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data: routeTemplatesData, isLoading, error, totalCount } = useRouteTemplates(searchTerm)
  
  const createMutation = useCreateRouteTemplate()
  const updateMutation = useUpdateRouteTemplate()
  const deactivateMutation = useDeactivateRouteTemplate()
  const hardDeleteMutation = useHardDeleteRouteTemplate()
  const exportMutation = useExportRouteTemplates()

  const handleCreateSubmit = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsCreateModalOpen(false)
    })
  }

  const handleUpdateSubmit = (data: any) => {
    if (!editingRouteTemplate) return
    
    updateMutation.mutate(
      { id: editingRouteTemplate.id, data },
      {
        onSuccess: () => setEditingRouteTemplate(null)
      }
    )
  }

  const handleDeactivate = (id: string) => {
    if (window.confirm('정말로 이 고정노선을 비활성화하시겠습니까?')) {
      deactivateMutation.mutate(id)
    }
  }

  const handleHardDelete = (id: string) => {
    if (window.confirm('정말로 이 고정노선을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      hardDeleteMutation.mutate(id)
    }
  }

  // 대량 작업 핸들러들
  const handleBulkDeactivate = (ids: string[]) => {
    if (window.confirm(`선택된 ${ids.length}개 고정노선을 비활성화하시겠습니까?`)) {
      Promise.all(ids.map(id => deactivateMutation.mutateAsync(id)))
        .then(() => {
          setSelectedIds([])
          toast.success(`${ids.length}개 고정노선이 비활성화되었습니다`)
        })
        .catch(() => {
          toast.error('일부 고정노선 비활성화에 실패했습니다')
        })
    }
  }

  const handleBulkHardDelete = (ids: string[]) => {
    if (window.confirm(`선택된 ${ids.length}개 고정노선을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      Promise.all(ids.map(id => hardDeleteMutation.mutateAsync(id)))
        .then(() => {
          setSelectedIds([])
          toast.success(`${ids.length}개 고정노선이 완전히 삭제되었습니다`)
        })
        .catch(() => {
          toast.error('일부 고정노선 삭제에 실패했습니다')
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
              {error && typeof error === 'object' && 'message' in error ? (error as Error).message : '알 수 없는 오류'}
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
      key: 'name',
      header: '노선명',
      width: '20%',
      render: (value: any, route: RouteTemplate) => (
        <div className="flex items-center">
          <div>
            <p className="font-medium text-gray-900">{route.name}</p>
            {!route.isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                비활성
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'startLocation',
      header: '출발지',
      width: '20%',
      render: (value: any, route: RouteTemplate) => (
        <div className="text-sm text-gray-900">
          {route.startLocation}
        </div>
      ),
    },
    {
      key: 'endLocation',
      header: '도착지',
      width: '20%',
      render: (value: any, route: RouteTemplate) => (
        <div className="text-sm text-gray-900">
          {route.endLocation}
        </div>
      ),
    },
    {
      key: 'distance',
      header: '거리(km)',
      width: '10%',
      render: (value: any, route: RouteTemplate) => (
        <div className="text-sm text-gray-900">
          {route.distance.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'estimatedDuration',
      header: '예상시간(분)',
      width: '12%',
      render: (value: any, route: RouteTemplate) => (
        <div className="text-sm text-gray-900">
          {route.estimatedDuration.toLocaleString()}
        </div>
      ),
    },
    {
      key: 'tollFee',
      header: '통행료(원)',
      width: '18%',
      render: (value: any, route: RouteTemplate) => (
        <div className="text-sm text-gray-900">
          {route.tollFee ? `₩${route.tollFee.toLocaleString()}` : '-'}
        </div>
      ),
    },
  ]

  // Define table actions - only edit button
  const actions = [
    commonActions.edit(
      (route: RouteTemplate) => setEditingRouteTemplate(route),
      () => true
    ),
  ]

  return (
    <ManagementPageLayout
      title="고정 관리"
      icon={<Route />}
      totalCount={totalCount}
      countLabel="개"
      primaryAction={{
        label: '고정노선 등록',
        onClick: () => setIsCreateModalOpen(true),
        icon: <Plus className="h-4 w-4" />,
      }}
      secondaryActions={[{
        label: 'CSV 가져오기',
        onClick: () => window.location.href = '/import/routes',
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
          placeholder: '노선명, 출발지, 도착지로 검색...',
        },
      ]}
      isLoading={isLoading}
      error={error ? String(error) : undefined}
    >
      <DataTable
        data={routeTemplatesData}
        columns={columns}
        actions={actions}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        getItemId={(route) => route.id}
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
          icon: <Route />,
          title: '등록된 고정노선이 없습니다',
          description: '새로운 고정노선을 등록해보세요.',
          action: {
            label: '고정노선 등록',
            onClick: () => setIsCreateModalOpen(true),
          },
        }}
        isLoading={isLoading}
      />

      {/* 생성 모달 */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>고정노선 등록</DialogTitle>
            <DialogClose onClick={() => setIsCreateModalOpen(false)} />
          </DialogHeader>
          <RouteTemplateForm
            onSubmit={handleCreateSubmit}
            isLoading={createMutation.isPending}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 수정 모달 */}
      <Dialog open={!!editingRouteTemplate} onOpenChange={(open) => !open && setEditingRouteTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>고정노선 정보 수정</DialogTitle>
            <DialogClose onClick={() => setEditingRouteTemplate(null)} />
          </DialogHeader>
          {editingRouteTemplate && (
            <RouteTemplateForm
              routeTemplate={editingRouteTemplate}
              onSubmit={handleUpdateSubmit}
              isLoading={updateMutation.isPending}
              onCancel={() => setEditingRouteTemplate(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </ManagementPageLayout>
  )
}