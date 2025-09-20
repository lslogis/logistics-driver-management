/**
 * 가상화된 테이블 컴포넌트
 * 대용량 데이터 리스트의 성능 최적화
 */

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { FixedSizeList as List, VariableSizeList, ListChildComponentProps } from 'react-window'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Search, Filter, ArrowUpDown } from 'lucide-react'

interface VirtualizedTableProps<T> {
  data: T[]
  columns: Array<{
    key: keyof T
    label: string
    width?: number
    render?: (value: any, item: T, index: number) => React.ReactNode
    sortable?: boolean
    filterable?: boolean
  }>
  itemHeight?: number
  containerHeight?: number
  onItemClick?: (item: T, index: number) => void
  onItemDoubleClick?: (item: T, index: number) => void
  className?: string
  emptyMessage?: string
  loading?: boolean
  overscan?: number
}

interface SortConfig<T> {
  key: keyof T | null
  direction: 'asc' | 'desc'
}

interface FilterConfig {
  [key: string]: string
}

// 메모이제이션된 행 컴포넌트
const TableRow = React.memo(<T,>({
  index,
  style,
  data: { items, columns, onItemClick, onItemDoubleClick }
}: ListChildComponentProps & {
  data: {
    items: T[]
    columns: VirtualizedTableProps<T>['columns']
    onItemClick?: VirtualizedTableProps<T>['onItemClick']
    onItemDoubleClick?: VirtualizedTableProps<T>['onItemDoubleClick']
  }
}) => {
  const item = items[index]
  
  const handleClick = useCallback(() => {
    onItemClick?.(item, index)
  }, [item, index, onItemClick])

  const handleDoubleClick = useCallback(() => {
    onItemDoubleClick?.(item, index)
  }, [item, index, onItemDoubleClick])

  return (
    <div
      style={style}
      className={cn(
        "flex border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors",
        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {columns.map((column, colIndex) => (
        <div
          key={String(column.key)}
          className="flex items-center px-4 py-3 text-sm"
          style={{ width: column.width || 150, flexShrink: 0 }}
        >
          {column.render 
            ? column.render(item[column.key], item, index)
            : String(item[column.key] || '')
          }
        </div>
      ))}
    </div>
  )
})
TableRow.displayName = 'TableRow'

// 메모이제이션된 헤더 컴포넌트
const TableHeader = React.memo(<T,>({
  columns,
  sortConfig,
  onSort,
  filters,
  onFilterChange
}: {
  columns: VirtualizedTableProps<T>['columns']
  sortConfig: SortConfig<T>
  onSort: (key: keyof T) => void
  filters: FilterConfig
  onFilterChange: (key: string, value: string) => void
}) => {
  return (
    <div className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
      {/* Header Row */}
      <div className="flex">
        {columns.map((column) => (
          <div
            key={String(column.key)}
            className="flex items-center px-4 py-3 text-sm font-medium text-gray-900"
            style={{ width: column.width || 150, flexShrink: 0 }}
          >
            <div className="flex items-center justify-between w-full">
              <span>{column.label}</span>
              {column.sortable && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto"
                  onClick={() => onSort(column.key)}
                >
                  <ArrowUpDown 
                    className={cn(
                      "h-3 w-3",
                      sortConfig.key === column.key ? "text-blue-600" : "text-gray-400"
                    )}
                  />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Filter Row */}
      <div className="flex border-t border-gray-200">
        {columns.map((column) => (
          <div
            key={`filter-${String(column.key)}`}
            className="px-4 py-2"
            style={{ width: column.width || 150, flexShrink: 0 }}
          >
            {column.filterable && (
              <Input
                placeholder={`Filter ${column.label}...`}
                value={filters[String(column.key)] || ''}
                onChange={(e) => onFilterChange(String(column.key), e.target.value)}
                className="h-8 text-xs border-gray-300"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
})
TableHeader.displayName = 'TableHeader'

export function VirtualizedTable<T>({
  data,
  columns,
  itemHeight = 60,
  containerHeight = 400,
  onItemClick,
  onItemDoubleClick,
  className,
  emptyMessage = "No data available",
  loading = false,
  overscan = 5
}: VirtualizedTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({ key: null, direction: 'asc' })
  const [filters, setFilters] = useState<FilterConfig>({})
  const [searchQuery, setSearchQuery] = useState('')
  const listRef = useRef<List>(null)

  // 메모이제이션된 필터링 로직
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // 글로벌 검색
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        Object.values(item as any).some(value =>
          String(value).toLowerCase().includes(query)
        )
      )
    }

    // 컬럼별 필터
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const filterValue = value.toLowerCase()
        filtered = filtered.filter(item =>
          String((item as any)[key] || '').toLowerCase().includes(filterValue)
        )
      }
    })

    return filtered
  }, [data, searchQuery, filters])

  // 메모이제이션된 정렬 로직
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      // 타입별 정렬 로직
      let comparison = 0

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else {
        const aString = String(aValue || '').toLowerCase()
        const bString = String(bValue || '').toLowerCase()
        comparison = aString.localeCompare(bString, 'ko-KR')
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison
    })
  }, [filteredData, sortConfig])

  // 정렬 핸들러
  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  // 필터 핸들러
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  // 필터 초기화
  const clearFilters = useCallback(() => {
    setFilters({})
    setSearchQuery('')
    setSortConfig({ key: null, direction: 'asc' })
  }, [])

  // 검색 시 스크롤을 맨 위로
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0)
    }
  }, [searchQuery, filters, sortConfig])

  // 총 테이블 너비 계산
  const totalWidth = useMemo(() => {
    return columns.reduce((acc, col) => acc + (col.width || 150), 0)
  }, [columns])

  // 로딩 상태
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Loading data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>Data Table</span>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              {sortedData.length} items
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* 글로벌 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search all fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            {/* 필터 초기화 */}
            {(Object.values(filters).some(v => v) || searchQuery || sortConfig.key) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="border-gray-300 text-gray-600"
              >
                <Filter className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* 테이블 헤더 */}
          <TableHeader
            columns={columns}
            sortConfig={sortConfig}
            onSort={handleSort}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* 가상화된 테이블 바디 */}
          {sortedData.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            <div style={{ width: totalWidth, height: containerHeight }}>
              <List
                ref={listRef}
                height={containerHeight}
                itemCount={sortedData.length}
                itemSize={itemHeight}
                width={totalWidth}
                overscanCount={overscan}
                itemData={{
                  items: sortedData,
                  columns,
                  onItemClick,
                  onItemDoubleClick
                }}
              >
                {TableRow}
              </List>
            </div>
          )}
        </div>

        {/* 성능 정보 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500 bg-gray-50">
            Showing {sortedData.length} of {data.length} items | 
            Rendering ~{Math.min(Math.ceil(containerHeight / itemHeight) + overscan * 2, sortedData.length)} DOM nodes | 
            {sortConfig.key && `Sorted by ${String(sortConfig.key)} (${sortConfig.direction})`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 메모이제이션된 테이블 래퍼
 */
export const MemoizedVirtualizedTable = React.memo(VirtualizedTable) as typeof VirtualizedTable