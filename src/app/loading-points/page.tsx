'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Plus, MapPin, Edit, UserX, CheckCircle, X, Copy, MessageSquare, MessageCircle, Phone } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { ContextMenu, ContextMenuItem } from '@/components/ui/ContextMenu'
import AddressSearchInput, { SelectedAddress } from '@/components/ui/AddressSearchInput'
import { copyToClipboard, formatLoadingPointInfo, sendSMS, shareToKakao, makePhoneCall } from '@/lib/utils/share'

// Simple form component
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
    phone2: loadingPoint?.phone2 || '',
    remarks: loadingPoint?.remarks || ''
  })

  const handleAddressSelect = (address: SelectedAddress) => {
    setFormData(prev => ({
      ...prev,
      lotAddress: address.lotAddress,
      roadAddress: address.roadAddress,
      loadingPointName: address.placeName || prev.loadingPointName,
      phone1: address.phone || prev.phone1,
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

        <AddressSearchInput
          label="주소 검색"
          placeholder="주소를 검색하세요"
          lotAddress={formData.lotAddress}
          roadAddress={formData.roadAddress}
          onAddressSelect={handleAddressSelect}
        />

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

        <div>
          <Label htmlFor="remarks">비고</Label>
          <textarea
            id="remarks"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="특이사항이나 추가 정보를 입력하세요"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            maxLength={500}
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.remarks.length}/500자
          </p>
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

export default function LoadingPointsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // 'active', 'inactive', '' (전체)
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
  } = useLoadingPoints(searchTerm, statusFilter)
  
  const loadingPointsData = data?.pages?.flatMap((page: any) => page.items || []) || []
  // 모든 페이지에서 동일한 totalCount를 사용 (가장 최신 페이지의 totalCount)
  const totalCount = data?.pages?.[data?.pages?.length - 1]?.totalCount || data?.pages?.[0]?.totalCount || 0
  
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

  const handleBulkActivate = (ids: string[]) => {
    // 비활성화 상태인 항목만 필터링
    const inactiveIds = ids.filter(id => {
      const item = loadingPointsData.find(item => item.id === id)
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
      const item = loadingPointsData.find(item => item.id === id)
      return item && item.isActive
    })
    
    if (activeIds.length === 0) {
      toast.error('비활성화할 수 있는 항목이 없습니다. (이미 모두 비활성화되었거나 선택된 항목이 없습니다)')
      return
    }
    
    const confirmMessage = activeIds.length < ids.length 
      ? `${ids.length}개 중 ${activeIds.length}개만 비활성화됩니다. (나머지는 이미 비활성화 상태)\n계속하시겠습니까?`
      : `선택된 ${activeIds.length}개 상차지를 비활성화하시겠습니까?`
    
    if (window.confirm(confirmMessage)) {
      bulkDeactivateMutation.mutate(activeIds, {
        onSuccess: () => setSelectedIds([])
      })
    }
  }

  const handleBulkHardDelete = (ids: string[]) => {
    if (window.confirm(`선택된 ${ids.length}개 상차지를 완전히 삭제하시겠습니까?`)) {
      bulkDeleteMutation.mutate(ids, {
        onSuccess: () => setSelectedIds([])
      })
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(loadingPointsData.map(item => item.id))
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

  // 컨텍스트 메뉴 핸들러들
  const handleCopyLoadingPoint = async (loadingPoint: LoadingPointResponse) => {
    const loadingPointInfo = formatLoadingPointInfo(loadingPoint)
    const success = await copyToClipboard(loadingPointInfo)
    if (success) {
      toast.success('상차지 정보가 클립보드에 복사되었습니다')
    } else {
      toast.error('클립보드 복사에 실패했습니다')
    }
  }

  const handleShareToKakao = async (loadingPoint: LoadingPointResponse) => {
    try {
      const loadingPointInfo = formatLoadingPointInfo(loadingPoint)
      await shareToKakao(
        `상차지 정보 - ${loadingPoint.centerName} ${loadingPoint.loadingPointName}`,
        loadingPointInfo
      )
      toast.success('카카오톡으로 공유되었습니다')
    } catch (error) {
      console.error('카카오톡 공유 실패:', error)
      toast.error('카카오톡 공유에 실패했습니다')
    }
  }

  const handleSendSMS = (loadingPoint: LoadingPointResponse) => {
    try {
      const phone = loadingPoint.phone1 || loadingPoint.phone2
      if (!phone) {
        toast.error('연락처가 없는 상차지입니다')
        return
      }
      
      const loadingPointInfo = formatLoadingPointInfo(loadingPoint)
      sendSMS(phone, loadingPointInfo)
      toast.success('SMS 앱이 실행되었습니다')
    } catch (error) {
      console.error('SMS 발송 실패:', error)
      toast.error('SMS 발송에 실패했습니다')
    }
  }

  const handlePhoneCall = (loadingPoint: LoadingPointResponse, phoneNumber: string) => {
    try {
      makePhoneCall(phoneNumber)
    } catch (error) {
      console.error('전화 걸기 실패:', error)
      toast.error('전화 걸기에 실패했습니다')
    }
  }

  // 각 상차지별 컨텍스트 메뉴 아이템 생성
  const getContextMenuItems = (loadingPoint: LoadingPointResponse): ContextMenuItem[] => {
    const hasPhone = !!(loadingPoint.phone1 || loadingPoint.phone2)
    const phoneItems = []
    
    if (loadingPoint.phone1) {
      phoneItems.push({
        id: 'call1',
        label: `전화걸기 (${loadingPoint.phone1})`,
        icon: <Phone className="h-4 w-4" />,
        onClick: () => handlePhoneCall(loadingPoint, loadingPoint.phone1!)
      })
    }
    
    if (loadingPoint.phone2) {
      phoneItems.push({
        id: 'call2',
        label: `전화걸기 (${loadingPoint.phone2})`,
        icon: <Phone className="h-4 w-4" />,
        onClick: () => handlePhoneCall(loadingPoint, loadingPoint.phone2!)
      })
    }

    return [
      {
        id: 'copy',
        label: '복사하기',
        icon: <Copy className="h-4 w-4" />,
        onClick: () => handleCopyLoadingPoint(loadingPoint)
      },
      {
        id: 'kakao',
        label: '카톡 공유',
        icon: <MessageCircle className="h-4 w-4" />,
        onClick: () => handleShareToKakao(loadingPoint)
      },
      {
        id: 'sms',
        label: '문자 보내기',
        icon: <MessageSquare className="h-4 w-4" />,
        onClick: () => handleSendSMS(loadingPoint),
        disabled: !hasPhone
      },
      ...phoneItems,
      {
        id: 'divider1',
        label: '',
        icon: null,
        onClick: () => {},
        divider: true
      },
      {
        id: 'edit',
        label: '수정하기',
        icon: <Edit className="h-4 w-4" />,
        onClick: () => setEditingLoadingPoint(loadingPoint)
      },
      {
        id: 'toggle',
        label: loadingPoint.isActive ? '비활성화' : '활성화',
        icon: loadingPoint.isActive ? <UserX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
        onClick: () => loadingPoint.isActive ? handleDeactivate(loadingPoint.id) : handleActivate(loadingPoint.id),
        destructive: loadingPoint.isActive
      }
    ]
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">오류: {String(error)}</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            새로고침
          </Button>
        </div>
      </div>
    )
  }

  const isAllSelected = loadingPointsData.length > 0 && selectedIds.length === loadingPointsData.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < loadingPointsData.length
  
  // 선택된 항목들의 상태 분석
  const selectedItems = loadingPointsData.filter(item => selectedIds.includes(item.id))
  const selectedActiveCount = selectedItems.filter(item => item.isActive).length
  const selectedInactiveCount = selectedItems.filter(item => !item.isActive).length
  
  // 버튼 활성화 상태 계산
  const canActivate = selectedInactiveCount > 0
  const canDeactivate = selectedActiveCount > 0

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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">센터명</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">상차지명</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">주소</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">담당자</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">연락처</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">비고</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingPointsData.map((item: LoadingPointResponse) => (
                <ContextMenu key={item.id} items={getContextMenuItems(item)} asChild>
                  <tr className="hover:bg-gray-50 cursor-context-menu">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{item.centerName}</div>
                      {!item.isActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                          비활성
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.loadingPointName || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {item.roadAddress && <div className="mb-1">{item.roadAddress}</div>}
                        {item.lotAddress && <div className="text-gray-600 text-xs">{item.lotAddress}</div>}
                        {!item.roadAddress && !item.lotAddress && '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {item.manager1 && <div>{item.manager1}</div>}
                        {item.manager2 && <div className="text-gray-600">{item.manager2}</div>}
                        {!item.manager1 && !item.manager2 && '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {item.phone1 && <div>{item.phone1}</div>}
                        {item.phone2 && <div className="text-gray-600">{item.phone2}</div>}
                        {!item.phone1 && !item.phone2 && '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500" title={item.remarks || ''}>
                      <div className="max-w-32 truncate">
                        {item.remarks || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingLoadingPoint(item)
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            item.isActive ? handleDeactivate(item.id) : handleActivate(item.id)
                          }}
                          className={`p-1 transition-colors ${
                            item.isActive 
                              ? 'text-gray-400 hover:text-yellow-600' 
                              : 'text-gray-400 hover:text-green-600'
                          }`}
                          title={item.isActive ? '비활성화' : '활성화'}
                        >
                          {item.isActive ? <UserX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                </ContextMenu>
              ))}
              {loadingPointsData.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 상차지가 없습니다</h3>
                    <p className="text-gray-500 mb-4">새로운 상차지를 등록해보세요.</p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      상차지 등록
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Loading indicators */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm">추가 데이터 로딩 중...</span>
          </div>
        </div>
      )}
      
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

      {/* Create Modal */}
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

      {/* Edit Modal */}
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