'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LoadingPoint {
  id: string
  name: string | null
  centerName: string
  loadingPointName: string
  lotAddress?: string | null
  roadAddress?: string | null
  isActive: boolean
}

interface LoadingPointSelectorProps {
  value?: string
  onValueChange: (loadingPointId: string) => void
  className?: string
  placeholder?: string
  searchTerm?: string
  onSearchTermChange?: (term: string) => void
  page?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  includeInactive?: boolean
}

export function LoadingPointSelector({ 
  value, 
  onValueChange, 
  className,
  placeholder = "상차지를 선택하세요",
  searchTerm,
  onSearchTermChange,
  page,
  onPageChange,
  pageSize = 20,
  includeInactive = false
}: LoadingPointSelectorProps) {
  const isSearchControlled = searchTerm !== undefined
  const isPageControlled = page !== undefined

  const [internalSearch, setInternalSearch] = useState(searchTerm ?? '')
  const [internalPage, setInternalPage] = useState(1)
  const [loadingPoints, setLoadingPoints] = useState<LoadingPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const effectiveSearch = isSearchControlled ? searchTerm! : internalSearch
  const effectivePage = isPageControlled ? page! : internalPage

  const fetchAbortController = useRef<AbortController | null>(null)

  const normalizeItems = useCallback((payload: any) => {
    if (!payload) return [] as LoadingPoint[]
    if (Array.isArray(payload.data?.items)) return payload.data.items
    if (Array.isArray(payload.data)) return payload.data
    if (Array.isArray(payload.items)) return payload.items
    if (Array.isArray(payload.data?.loadingPoints)) return payload.data.loadingPoints
    if (Array.isArray(payload.loadingPoints)) return payload.loadingPoints
    return [] as LoadingPoint[]
  }, [])

  const extractTotal = useCallback((payload: any) => {
    const pagination = payload?.pagination || payload?.data?.pagination || payload?.data?.meta
    if (pagination) {
      return (
        pagination.total ??
        pagination.totalCount ??
        pagination.count ??
        pagination.totalItems ??
        null
      )
    }
    return (
      payload?.data?.total ??
      payload?.total ??
      null
    )
  }, [])

  const loadLoadingPoints = useCallback(async (pageToLoad: number, append = false) => {
    try {
      setError(null)
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      fetchAbortController.current?.abort()
      const controller = new AbortController()
      fetchAbortController.current = controller

      const params = new URLSearchParams({
        limit: String(pageSize),
        page: String(pageToLoad)
      })

      if (effectiveSearch) {
        params.set('search', effectiveSearch)
      }

      if (!includeInactive) {
        params.set('isActive', 'true')
      }

      const response = await fetch(`/api/loading-points?${params.toString()}`, {
        signal: controller.signal
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error?.message || '상차지 목록을 불러오지 못했습니다')
      }

      const items = normalizeItems(payload)
      const total = extractTotal(payload)

      setLoadingPoints(prev => (
        append ? [...prev, ...items] : items
      ))

      if (total != null) {
        setHasMore(pageToLoad * pageSize < total)
      } else {
        setHasMore(items.length === pageSize)
      }

      if (!isPageControlled) {
        setInternalPage(pageToLoad)
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      console.error('LoadingPoints fetch error:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      if (!append) {
        setLoadingPoints([])
        setHasMore(false)
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [effectiveSearch, pageSize, includeInactive, isPageControlled, normalizeItems, extractTotal])

  useEffect(() => {
    if (isSearchControlled) {
      setInternalSearch(searchTerm!)
    }
  }, [isSearchControlled, searchTerm])

  useEffect(() => {
    if (isPageControlled) {
      setInternalPage(page!)
    }
  }, [isPageControlled, page])

  useEffect(() => {
    loadLoadingPoints(isPageControlled ? effectivePage : 1, false)
    if (!isPageControlled) {
      setInternalPage(1)
    }
  }, [effectiveSearch, effectivePage, includeInactive, pageSize, isPageControlled, loadLoadingPoints])

  useEffect(() => {
    if (isPageControlled) {
      loadLoadingPoints(effectivePage, effectivePage > 1)
    }
  }, [isPageControlled, effectivePage, loadLoadingPoints])

  useEffect(() => () => fetchAbortController.current?.abort(), [])

  const handleSearchChange = useCallback((term: string) => {
    if (!isSearchControlled) {
      setInternalSearch(term)
    }
    onSearchTermChange?.(term)

    if (!isPageControlled) {
      setInternalPage(1)
    }
  }, [isSearchControlled, onSearchTermChange, isPageControlled])

  const handleLoadMore = useCallback(() => {
    const nextPage = (isPageControlled ? effectivePage : internalPage) + 1
    onPageChange?.(nextPage)
    if (!isPageControlled) {
      setInternalPage(nextPage)
      loadLoadingPoints(nextPage, true)
    }
  }, [effectivePage, internalPage, isPageControlled, onPageChange, loadLoadingPoints])

  const selectedLoadingPoint = useMemo(
    () => loadingPoints.find(lp => lp.id === value),
    [loadingPoints, value]
  )

  const searchableItems = useMemo(() => loadingPoints, [loadingPoints])

  if (isLoading && !isLoadingMore && loadingPoints.length === 0) {
    return (
      <div className={cn("h-11 w-full rounded-lg border-2 border-gray-300 bg-gray-50 animate-pulse", className)} />
    )
  }

  if (error) {
    return (
      <div className={cn("h-11 w-full rounded-lg border-2 border-red-300 bg-red-50 flex items-center px-4 text-sm text-red-600", className)}>
        오류: {error}
      </div>
    )
  }

  return (
    <Select 
      value={value || ''} 
      onValueChange={onValueChange}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {selectedLoadingPoint ? (
            <span className="flex items-center gap-2">
              <span className="font-medium">{selectedLoadingPoint.name || selectedLoadingPoint.loadingPointName || selectedLoadingPoint.centerName}</span>
              {selectedLoadingPoint.lotAddress && (
                <span className="text-sm text-gray-500">({selectedLoadingPoint.lotAddress})</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 py-2" onKeyDown={(e) => e.stopPropagation()}>
          <Input
            value={effectiveSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="상차지 검색"
            className="h-9"
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
        {loadingPoints.length === 0 ? (
          <div className="px-3 py-4 text-sm text-gray-500 text-center">
            등록된 상차지가 없습니다
          </div>
        ) : (
          searchableItems
            .filter(lp => includeInactive || lp.isActive)
            .map((loadingPoint) => (
              <SelectItem key={loadingPoint.id} value={loadingPoint.id}>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">
                    {loadingPoint.name || loadingPoint.loadingPointName || loadingPoint.centerName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {loadingPoint.centerName}
                    {loadingPoint.lotAddress ? ` • ${loadingPoint.lotAddress}` : ''}
                  </span>
                </div>
              </SelectItem>
            ))
        )}
        </div>
        {hasMore && (
          <div className="px-2 py-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? '불러오는 중...' : '더 보기'}
            </Button>
          </div>
        )}
      </SelectContent>
    </Select>
  )
}
