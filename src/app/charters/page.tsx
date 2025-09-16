'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CharterFilters } from '@/components/charters/CharterFilters'
import { CharterListTable } from '@/components/charters/CharterListTable'
import { useChartersPaginated } from '@/hooks/useCharters'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission } from '@/lib/auth/rbac'
import { GetCharterRequestsQuery } from '@/lib/services/charter.service'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'

function ChartersPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  // Initialize filters from URL
  const [filters, setFilters] = useState<GetCharterRequestsQuery>(() => {
    const params: GetCharterRequestsQuery = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }

    // Add other filters from URL
    const search = searchParams.get('search')
    if (search) params.search = search

    const centerId = searchParams.get('centerId')
    if (centerId) params.centerId = centerId

    const driverId = searchParams.get('driverId')
    if (driverId) params.driverId = driverId

    const vehicleType = searchParams.get('vehicleType')
    if (vehicleType) params.vehicleType = vehicleType

    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) params.dateFrom = dateFrom

    const dateTo = searchParams.get('dateTo')
    if (dateTo) params.dateTo = dateTo

    const isNegotiated = searchParams.get('isNegotiated')
    if (isNegotiated) params.isNegotiated = isNegotiated === 'true'

    return params
  })

  // Fetch data
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useChartersPaginated(filters)

  // Permission checks
  const canCreate = user?.role && hasPermission(user.role, 'charters', 'create')

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  // Handle filters change
  const handleFiltersChange = (newFilters: Omit<GetCharterRequestsQuery, 'page' | 'limit'>) => {
    setFilters(prev => ({
      ...newFilters,
      page: 1, // Reset to first page when filters change
      limit: prev.limit
    }))
  }

  // Handle refresh
  const handleRefresh = () => {
    refetch()
    toast.success('데이터를 새로고침했습니다')
  }

  // Handle new charter creation
  const handleCreateCharter = () => {
    router.push('/charters/new')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">용차 관리</h1>
          <p className="text-gray-600 mt-1">
            용차 요청을 등록하고 관리합니다
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          
          {canCreate && (
            <Button
              onClick={handleCreateCharter}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              새 용차 등록
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <CharterFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Table */}
      <CharterListTable
        data={data}
        isLoading={isLoading}
        error={error}
        onPageChange={handlePageChange}
        onRefresh={handleRefresh}
        userRole={user?.role}
      />
    </div>
  )
}

export default function ChartersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ChartersPageContent />
    </Suspense>
  )
}
