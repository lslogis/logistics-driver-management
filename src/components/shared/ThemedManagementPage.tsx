/**
 * Themed Management Page Layout
 * Replicates the exact design system from loading-points page with color themes
 */

'use client'

import React, { useState, useMemo, ReactNode } from 'react'
import { Plus, Upload, Download, CheckCircle, XCircle, Eye, Edit, Copy, Share2, Phone, MessageSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ContextMenu, ContextMenuItem } from '@/components/ui/ContextMenu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ColorTheme, getColorTheme } from './ColorThemeProvider'
import { BaseManagementItem } from '@/types/management'

// Base props for all management pages
export interface ThemedManagementPageProps<T extends BaseManagementItem> {
  // Theme
  theme: string
  
  // Page info
  title: string
  subtitle: string
  icon: ReactNode
  
  // Data
  data: T[]
  totalCount: number
  isLoading: boolean
  error?: string
  
  // Infinite scroll
  fetchNextPage?: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  
  // Search and filters
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  additionalFilters?: Array<{
    label: string
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
  }>
  
  // Actions
  onCreateClick: () => void
  onImportClick: () => void
  onExportClick: () => void
  
  // Item rendering
  renderItem: (item: T, theme: ColorTheme) => ReactNode
  getContextMenuItems: (item: T) => ContextMenuItem[]
  
  // Selection
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  onBulkActivate: (ids: string[]) => void
  onBulkDeactivate: (ids: string[]) => void
  onBulkDelete: (ids: string[]) => void
  
  // Permissions
  canCreate?: boolean
  canEdit?: boolean
  canExport?: boolean
  canImport?: boolean
  
  // Empty state
  emptyStateMessage?: string
  emptyStateAction?: string
}

export function ThemedManagementPage<T extends BaseManagementItem>({
  theme,
  title,
  subtitle,
  icon,
  data,
  totalCount,
  isLoading,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  additionalFilters = [],
  onCreateClick,
  onImportClick,
  onExportClick,
  renderItem,
  getContextMenuItems,
  selectedIds,
  setSelectedIds,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  canCreate = true,
  canEdit = true,
  canExport = true,
  canImport = true,
  emptyStateMessage,
  emptyStateAction
}: ThemedManagementPageProps<T>) {
  const colorTheme = getColorTheme(theme)
  
  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && item.isActive) ||
        (statusFilter === 'inactive' && !item.isActive)
      
      return matchesStatus
    })
  }, [data, statusFilter])

  const hasActiveFilters = Boolean(
    searchTerm ||
    statusFilter !== 'all' ||
    additionalFilters.some(f => f.value && f.value !== 'all')
  )

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredData.map(item => item.id))
    }
  }

  const handleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  if (error) {
    return (
      <div className={cn("min-h-screen p-4", colorTheme.bgGradient)}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
            <p className="text-gray-600 mb-4">{String(error)}</p>
            <Button 
              onClick={() => window.location.reload()}
              className={cn(colorTheme.primary, colorTheme.primaryHover, "text-white")}
            >
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen", colorTheme.bgGradient)}>
      {/* Header Section - Exact copy from loading-points */}
      <div className={cn("bg-white shadow-sm border-b", colorTheme.border)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn("p-3 rounded-xl shadow-lg", colorTheme.iconBg)}>
                {React.cloneElement(icon as React.ReactElement, {
                  className: "h-8 w-8 text-white"
                })}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="text-lg text-gray-600 mt-1">{subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {canCreate && (
                <Button 
                  onClick={onCreateClick}
                  className={cn(
                    "text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200",
                    colorTheme.primary,
                    colorTheme.primaryHover
                  )}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {title.replace('관리', '')} 등록
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters and Actions - Exact copy from loading-points */}
        <Card className={cn("bg-white shadow-lg mb-6", colorTheme.border)}>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
                {/* Search Input */}
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder={`${title.replace('관리', '')}명, 정보로 검색...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                      "h-11 border-2 bg-white",
                      colorTheme.border,
                      colorTheme.borderHover,
                      "focus:ring-opacity-20"
                    )}
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={cn(
                    "w-32 h-11 border-2 bg-white",
                    colorTheme.border,
                    colorTheme.borderHover
                  )}>
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>

                {/* Additional Filters */}
                {additionalFilters.map((filter, index) => (
                  <Select key={index} value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger className={cn(
                      "w-40 h-11 border-2 bg-white",
                      colorTheme.border,
                      colorTheme.borderHover
                    )}>
                      <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}
              </div>

              <div className="flex items-center space-x-3">
                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {selectedIds.length}개 선택됨
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onBulkActivate(selectedIds)}
                      className="border-green-200 text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      활성화
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onBulkDeactivate(selectedIds)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      비활성화
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
                {canImport && (
                  <Button
                    variant="outline"
                    onClick={onImportClick}
                    className={cn(
                      "hover:bg-opacity-50",
                      colorTheme.border,
                      colorTheme.primaryText,
                      colorTheme.secondaryHover
                    )}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    가져오기
                  </Button>
                )}

                {canExport && (
                  <Button
                    variant="outline"
                    onClick={onExportClick}
                    className={cn(
                      "hover:bg-opacity-50",
                      colorTheme.border,
                      colorTheme.primaryText,
                      colorTheme.secondaryHover
                    )}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    내보내기
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className={cn("bg-white shadow-lg", colorTheme.border)}>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className={cn("animate-spin rounded-full h-8 w-8 border-b-2 mr-3", colorTheme.primaryText.replace('text-', 'border-'))}></div>
                <span className="text-gray-600">{title} 목록을 불러오는 중...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && filteredData.length === 0 && (
          <Card className={cn("bg-white shadow-lg", colorTheme.border)}>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="mb-4">
                  {React.cloneElement(icon as React.ReactElement, {
                    className: cn("h-16 w-16 mx-auto", colorTheme.primaryText.replace('text-', 'text-').replace('-600', '-300'))
                  })}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {hasActiveFilters ? '검색 결과가 없습니다' : emptyStateMessage || `등록된 ${title.replace('관리', '')}이/가 없습니다`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {hasActiveFilters
                    ? '검색 조건을 변경하거나 새로운 항목을 등록해보세요.' 
                    : emptyStateAction || `새로운 ${title.replace('관리', '')}을/를 등록하여 시작해보세요.`
                  }
                </p>
                {canCreate && (
                  <Button 
                    onClick={onCreateClick}
                    className={cn(
                      "text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200",
                      colorTheme.primary,
                      colorTheme.primaryHover
                    )}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {title.replace('관리', '')} 등록
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Table/List */}
        {!isLoading && filteredData.length > 0 && (
          <Card className={cn("bg-white shadow-lg", colorTheme.border)}>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className={cn("px-6 py-4 border-b", colorTheme.bgGradient, colorTheme.border)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                        onChange={handleSelectAll}
                        className={cn("rounded border-300 focus:ring-500", colorTheme.primaryText.replace('text-', 'text-').replace('600', '500'))}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        전체 선택
                      </span>
                    </label>
                  </div>
                  <div className="text-sm text-gray-600">
                    총 {filteredData.length.toLocaleString()}개
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className={cn("divide-y", colorTheme.border)}>
                {filteredData.map((item) => (
                  <ContextMenu
                    key={item.id}
                    items={getContextMenuItems(item)}
                  >
                    <div className={cn("p-6 hover:bg-opacity-50 transition-colors cursor-pointer", colorTheme.secondaryHover)}>
                      <div className="flex items-center space-x-4">
                        {/* Checkbox */}
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className={cn("rounded border-300 focus:ring-500", colorTheme.primaryText.replace('text-', 'text-').replace('600', '500'))}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          {renderItem(item, colorTheme)}
                        </div>
                      </div>
                    </div>
                  </ContextMenu>
                ))}
              </div>

              {/* Load More */}
              {hasNextPage && (
                <div className={cn("p-6 border-t", colorTheme.border)}>
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage?.()}
                    disabled={isFetchingNextPage}
                    className={cn("w-full", colorTheme.border, colorTheme.primaryText, colorTheme.secondaryHover)}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <div className={cn("animate-spin rounded-full h-4 w-4 border-b-2 mr-2", colorTheme.primaryText.replace('text-', 'border-'))}></div>
                        불러오는 중...
                      </>
                    ) : (
                      '더 보기'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ThemedManagementPage