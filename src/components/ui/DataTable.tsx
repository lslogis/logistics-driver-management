/**
 * Unified Data Table Component
 * Provides consistent table design with built-in actions, pagination, and empty states
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react'

// Types
interface TableAction {
  icon: React.ReactNode
  label: string
  onClick: (item: any) => void
  variant?: 'default' | 'danger' | 'success' | 'warning'
  show?: (item: any) => boolean
  disabled?: (item: any) => boolean
}

interface TableColumn {
  key: string
  header: string
  render?: (value: any, item: any) => React.ReactNode
  sortable?: boolean
  className?: string
  width?: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface BulkAction {
  icon: React.ReactNode
  label: string
  onClick: (selectedIds: string[]) => void
  variant?: 'default' | 'danger' | 'success' | 'warning'
  disabled?: boolean
}

interface DataTableProps {
  data: any[]
  columns: TableColumn[]
  actions?: TableAction[]
  pagination?: PaginationData
  onPageChange?: (page: number) => void
  emptyState?: {
    icon?: React.ReactNode
    title: string
    description: string
    action?: {
      label: string
      onClick: () => void
    }
  }
  isLoading?: boolean
  className?: string
  // Bulk selection props
  selectable?: boolean
  bulkActions?: BulkAction[]
  selectedIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  getItemId?: (item: any) => string
}

// Action Button Component
function ActionButton({ action, item }: { action: TableAction; item: any }) {
  const show = action.show ? action.show(item) : true
  const disabled = action.disabled ? action.disabled(item) : false
  
  if (!show) return null
  
  const variants = {
    default: 'text-gray-400 hover:text-blue-600 hover:bg-blue-50',
    danger: 'text-gray-400 hover:text-red-600 hover:bg-red-50',
    success: 'text-gray-400 hover:text-green-600 hover:bg-green-50',
    warning: 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50',
  }
  
  return (
    <button
      onClick={() => !disabled && action.onClick(item)}
      disabled={disabled}
      className={`p-1 rounded transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variants[action.variant || 'default']}`}
      title={action.label}
      aria-label={action.label}
    >
      {React.isValidElement(action.icon) ? (
        React.cloneElement(action.icon as React.ReactElement, {
          className: 'h-3.5 w-3.5'
        })
      ) : (
        <span className="h-3.5 w-3.5 block">{action.icon}</span>
      )}
    </button>
  )
}

// Empty State Component
function EmptyState({ emptyState }: { emptyState: DataTableProps['emptyState'] }) {
  if (!emptyState) {
    return (
      <div className="p-12 text-center">
        <div className="text-gray-500">데이터가 없습니다</div>
      </div>
    )
  }
  
  return (
    <div className="p-12 text-center">
      <div className="max-w-sm mx-auto">
        {emptyState.icon && (
          <div className="flex justify-center mb-4">
            {React.cloneElement(emptyState.icon as React.ReactElement, {
              className: 'h-16 w-16 text-gray-300'
            })}
          </div>
        )}
        <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyState.title}</h3>
        <p className="text-gray-500 mb-4">{emptyState.description}</p>
        {emptyState.action && (
          <Button onClick={emptyState.action.onClick}>
            {emptyState.action.label}
          </Button>
        )}
      </div>
    </div>
  )
}

// Pagination Component
function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: PaginationData
  onPageChange: (page: number) => void
}) {
  return (
    <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 rounded-b-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="text-sm text-gray-700">
            총 <span className="font-medium">{pagination.total.toLocaleString()}</span>개 중{' '}
            <span className="font-medium">
              {((pagination.page - 1) * pagination.limit) + 1}
            </span>
            -{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
            개 표시
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-500">
            <span>페이지당</span>
            <span className="font-mono font-medium">{pagination.limit}개</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* First Page */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onPageChange(1)}
            disabled={pagination.page <= 1}
            aria-label="첫 페이지"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </Button>
          
          {/* Previous Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            이전
          </Button>
          
          {/* Page Info */}
          <div className="flex items-center px-3 py-1.5 text-sm font-mono">
            <span className="font-semibold">{pagination.page}</span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-gray-600">{pagination.totalPages}</span>
          </div>
          
          {/* Next Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            다음
          </Button>
          
          {/* Last Page */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onPageChange(pagination.totalPages)}
            disabled={pagination.page >= pagination.totalPages}
            aria-label="마지막 페이지"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Main DataTable Component
export function DataTable({
  data,
  columns,
  actions = [],
  pagination,
  onPageChange,
  emptyState,
  isLoading = false,
  className = '',
  selectable = false,
  bulkActions = [],
  selectedIds = [],
  onSelectionChange,
  getItemId = (item) => item.id,
}: DataTableProps) {
  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      const allIds = data.map(getItemId)
      onSelectionChange(allIds)
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const isAllSelected = data.length > 0 && selectedIds.length === data.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < data.length

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-12 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-500">로딩 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!data.length) {
    return (
      <Card className={className}>
        <EmptyState emptyState={emptyState} />
      </Card>
    )
  }
  
  return (
    <Card className={`${className} force-full-width`}>
      {/* Bulk Actions */}
      {selectable && selectedIds.length > 0 && bulkActions.length > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.length}개 항목 선택됨
            </span>
            <div className="flex space-x-2">
              {bulkActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant === 'danger' ? 'destructive' : action.variant === 'warning' ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={() => action.onClick(selectedIds)}
                  disabled={action.disabled}
                  leftIcon={action.icon}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto !w-full" style={{ width: '100%' }}>
        <Table className="!w-full table-fixed !min-w-full border-collapse text-sm lg:text-base" style={{ width: '100%', minWidth: '100%' }}>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b">
              {selectable && (
                <TableHead className="px-3 py-2 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide ${column.className || ''}`}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide w-20">
                  작업
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => {
              const itemId = getItemId(item)
              const isSelected = selectedIds.includes(itemId)
              
              return (
                <TableRow key={item.id || index} className="group hover:bg-gray-50/50 transition-colors duration-150 border-b border-gray-100">
                  {selectable && (
                    <TableCell className="px-3 py-2 w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectItem(itemId, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                  <TableCell
                    key={`${item.id || index}-${column.key}`}
                    className={`px-3 py-2 text-sm text-center ${column.className || ''}`}
                  >
                    {column.render
                      ? column.render(item[column.key], item)
                      : item[column.key]
                    }
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell className="px-3 py-2 text-sm">
                    <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {actions.map((action, actionIndex) => (
                        <ActionButton
                          key={actionIndex}
                          action={action}
                          item={item}
                        />
                      ))}
                    </div>
                  </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <PaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
        />
      )}
    </Card>
  )
}

// Common action presets
export const commonActions = {
  view: (onClick: (item: any) => void): TableAction => ({
    icon: <Eye />,
    label: '보기',
    onClick,
  }),
  
  edit: (onClick: (item: any) => void, canEdit?: (item: any) => boolean): TableAction => ({
    icon: <Edit />,
    label: '수정',
    onClick,
    show: canEdit,
  }),
  
  delete: (onClick: (item: any) => void, canDelete?: (item: any) => boolean): TableAction => ({
    icon: <Trash2 />,
    label: '삭제',
    onClick,
    variant: 'danger' as const,
    show: canDelete,
  }),
  
  more: (onClick: (item: any) => void): TableAction => ({
    icon: <MoreHorizontal />,
    label: '더보기',
    onClick,
  }),
}

export default DataTable