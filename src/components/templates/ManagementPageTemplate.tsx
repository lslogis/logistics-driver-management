'use client'

import React, { useState, useCallback, useEffect, ReactNode, useMemo } from 'react'
import { CheckCircle, UserX, X, Edit } from 'lucide-react'
import { toast } from 'react-hot-toast'
import ManagementPageLayout from '@/components/layout/ManagementPageLayout'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { ContextMenu, ContextMenuItem } from '@/components/ui/ContextMenu'

// Base types for the template
export interface BaseItem {
  id: string
  isActive: boolean
  [key: string]: any
}

export interface TableColumn<T = BaseItem> {
  key: string
  header: string
  width?: string
  render: (item: T) => ReactNode
}

export interface ActionButton {
  label: string
  onClick: () => void
  icon?: ReactNode
  href?: string
  active?: boolean
  loading?: boolean
}

export interface SearchFilter {
  label: string
  type: 'text' | 'select' | 'date' | 'custom'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  render?: () => ReactNode
}

export interface BulkAction<T = BaseItem> {
  activate: (ids: string[]) => void
  deactivate: (ids: string[]) => void
  hardDelete: (ids: string[]) => void
}

export interface CrudActions<T = BaseItem, TCreate = any, TUpdate = any> {
  create: (data: TCreate) => void
  update: (id: string, data: TUpdate) => void
  activate: (id: string) => void
  deactivate: (id: string) => void
}

export interface TemplateProps<T extends BaseItem, TCreate = any, TUpdate = any> {
  // Page configuration
  title: string
  icon: ReactNode
  countLabel: string
  subtitle?: string
  
  // Data
  data: T[]
  totalCount: number
  isLoading: boolean
  error?: string
  
  // Infinite scrolling
  fetchNextPage?: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  
  // Table configuration
  columns: TableColumn<T>[]
  
  // Actions
  primaryAction: ActionButton
  secondaryActions?: ActionButton[]
  exportAction?: ActionButton
  
  // Search and filters
  searchFilters: SearchFilter[]
  
  // CRUD operations
  crudActions: CrudActions<T, TCreate, TUpdate>
  bulkActions: BulkAction<T>
  
  // Context menu items generator
  getContextMenuItems: (item: T) => ContextMenuItem[]
  
  // Form components
  CreateForm: React.ComponentType<{
    onSubmit: (data: TCreate) => void
    isLoading: boolean
    onCancel: () => void
  }>
  EditForm: React.ComponentType<{
    item: T
    onSubmit: (data: TUpdate) => void
    isLoading: boolean
    onCancel: () => void
  }>
  
  // Modal states and mutations
  createModalOpen: boolean
  setCreateModalOpen: (open: boolean) => void
  editModalOpen: boolean
  setEditModalOpen: (open: boolean) => void
  editingItem: T | null
  setEditingItem: (item: T | null) => void
  
  // Mutation states
  isCreatePending: boolean
  isUpdatePending: boolean
  
  // Empty state
  emptyStateConfig?: {
    icon: ReactNode
    title: string
    description: string
    actionLabel: string
  }
}

export default function ManagementPageTemplate<T extends BaseItem, TCreate = any, TUpdate = any>({
  title,
  icon,
  countLabel,
  subtitle,
  data,
  totalCount,
  isLoading,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  columns,
  primaryAction,
  secondaryActions,
  exportAction,
  searchFilters,
  crudActions,
  bulkActions,
  getContextMenuItems,
  CreateForm,
  EditForm,
  createModalOpen,
  setCreateModalOpen,
  editModalOpen,
  setEditModalOpen,
  editingItem,
  setEditingItem,
  isCreatePending,
  isUpdatePending,
  emptyStateConfig
}: TemplateProps<T, TCreate, TUpdate>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Clear selections when search filters change
  const filterValues = useMemo(() => searchFilters.map(f => f.value).join(','), [searchFilters])
  useEffect(() => {
    setSelectedIds([])
  }, [filterValues])

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (fetchNextPage && hasNextPage && !isFetchingNextPage) {
      if (window.innerHeight + document.documentElement.scrollTop 
          >= document.documentElement.offsetHeight - 1000) {
        fetchNextPage()
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    if (fetchNextPage) {
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll, fetchNextPage])

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(data.map(item => item.id))
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

  // Bulk action handlers
  const handleBulkActivate = (ids: string[]) => {
    const inactiveIds = ids.filter(id => {
      const item = data.find(item => item.id === id)
      return item && !item.isActive
    })
    
    if (inactiveIds.length === 0) {
      toast.error('활성화할 수 있는 항목이 없습니다. (이미 모두 활성화되었거나 선택된 항목이 없습니다)')
      return
    }
    
    if (inactiveIds.length < ids.length) {
      toast(`${ids.length}개 중 ${inactiveIds.length}개만 활성화됩니다. (나머지는 이미 활성화 상태)`, {
        icon: '⚠️',
        style: {
          backgroundColor: '#fef3c7',
          color: '#92400e',
          border: '1px solid #f59e0b'
        }
      })
    }
    
    bulkActions.activate(inactiveIds)
    setSelectedIds([])
  }

  const handleBulkDeactivate = (ids: string[]) => {
    const activeIds = ids.filter(id => {
      const item = data.find(item => item.id === id)
      return item && item.isActive
    })
    
    if (activeIds.length === 0) {
      toast.error('비활성화할 수 있는 항목이 없습니다. (이미 모두 비활성화되었거나 선택된 항목이 없습니다)')
      return
    }
    
    const confirmMessage = activeIds.length < ids.length 
      ? `${ids.length}개 중 ${activeIds.length}개만 비활성화됩니다. (나머지는 이미 비활성화 상태)\n계속하시겠습니까?`
      : `선택된 ${activeIds.length}개 항목을 비활성화하시겠습니까?`
    
    if (window.confirm(confirmMessage)) {
      bulkActions.deactivate(activeIds)
      setSelectedIds([])
    }
  }

  const handleBulkHardDelete = (ids: string[]) => {
    if (window.confirm(`선택된 ${ids.length}개 항목을 완전히 삭제하시겠습니까?`)) {
      bulkActions.hardDelete(ids)
      setSelectedIds([])
    }
  }

  // CRUD handlers
  const handleCreateSubmit = (data: TCreate) => {
    crudActions.create(data)
  }

  const handleUpdateSubmit = (data: TUpdate) => {
    if (!editingItem) return
    crudActions.update(editingItem.id, data)
  }

  const handleActivate = (id: string) => {
    crudActions.activate(id)
  }

  const handleDeactivate = (id: string) => {
    if (window.confirm('정말로 이 항목을 비활성화하시겠습니까?')) {
      crudActions.deactivate(id)
    }
  }

  // Selection state calculations
  const isAllSelected = data.length > 0 && selectedIds.length === data.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < data.length
  
  const selectedItems = data.filter(item => selectedIds.includes(item.id))
  const selectedActiveCount = selectedItems.filter(item => item.isActive).length
  const selectedInactiveCount = selectedItems.filter(item => !item.isActive).length
  
  const canActivate = selectedInactiveCount > 0
  const canDeactivate = selectedActiveCount > 0

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">오류: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            새로고침
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ManagementPageLayout
      title={title}
      subtitle={subtitle}
      icon={icon}
      totalCount={totalCount}
      countLabel={countLabel}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      exportAction={exportAction}
      searchFilters={searchFilters}
      isLoading={isLoading}
      error={error}
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

      {/* Table */}
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
                {columns.map((column) => (
                  <th 
                    key={column.key}
                    className="px-4 py-3 text-center text-sm font-semibold text-gray-900"
                    style={{ width: column.width }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item: T) => (
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
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        {column.render(item)}
                      </td>
                    ))}
                  </tr>
                </ContextMenu>
              ))}
              {data.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-gray-500">
                    {emptyStateConfig && (
                      <>
                        <div className="h-16 w-16 mx-auto text-gray-300 mb-4">
                          {emptyStateConfig.icon}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {emptyStateConfig.title}
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {emptyStateConfig.description}
                        </p>
                        <Button onClick={primaryAction.onClick}>
                          {emptyStateConfig.actionLabel}
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Infinite scroll loading indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm">추가 데이터 로딩 중...</span>
          </div>
        </div>
      )}
      
      {/* Manual load more button */}
      {hasNextPage && !isFetchingNextPage && data.length > 0 && (
        <div className="flex justify-center py-4">
          <Button 
            variant="outline" 
            onClick={() => fetchNextPage?.()}
            className="text-gray-600 hover:text-gray-900"
          >
            더 보기 ({totalCount - data.length}개 남음)
          </Button>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="w-auto min-w-[400px] max-w-lg max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>{title.replace('관리', '')} 등록</DialogTitle>
            <DialogClose onClick={() => setCreateModalOpen(false)} />
          </DialogHeader>
          <CreateForm
            onSubmit={handleCreateSubmit}
            isLoading={isCreatePending}
            onCancel={() => setCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={(open) => {
        if (!open) {
          setEditModalOpen(false)
          setEditingItem(null)
        }
      }}>
        <DialogContent className="w-auto min-w-[400px] max-w-lg max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>{title.replace('관리', '')} 정보 수정</DialogTitle>
            <DialogClose onClick={() => {
              setEditModalOpen(false)
              setEditingItem(null)
            }} />
          </DialogHeader>
          {editingItem && (
            <EditForm
              item={editingItem}
              onSubmit={handleUpdateSubmit}
              isLoading={isUpdatePending}
              onCancel={() => {
                setEditModalOpen(false)
                setEditingItem(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </ManagementPageLayout>
  )
}
