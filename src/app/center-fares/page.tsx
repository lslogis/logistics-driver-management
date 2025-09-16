'use client'

import React, { useState } from 'react'
import { useCenterFaresPaginated } from '@/hooks/useCenterFares'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { 
  DollarSign, 
  Building2, 
  Truck, 
  MapPin, 
  Plus, 
  Download, 
  Calculator,
  TrendingUp,
  Activity,
  BarChart3,
  FileSpreadsheet
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { FiltersBar } from '@/components/centerFares/FiltersBar'
import { CenterFareTable } from '@/components/centerFares/CenterFareTable'
import { CenterFareCreateModal } from '@/components/centerFares/CenterFareCreateModal'
import { CenterFareEditModal } from '@/components/centerFares/CenterFareEditModal'
import { CenterFareDeleteDialog } from '@/components/centerFares/CenterFareDeleteDialog'
import { CenterFarePolicyDrawer } from '@/components/centerFares/CenterFarePolicyDrawer'
import { FareCalculatorDrawer } from '@/components/centerFares/FareCalculatorDrawer'
import { CenterFare } from '@/lib/api/center-fares'

export default function CenterFaresPage() {
  const { data, isLoading, query, setFilters, setSort, setPage, setSize } = useCenterFaresPaginated()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModal, setEditModal] = useState<{ open: boolean; fare: CenterFare | null }>({
    open: false,
    fare: null,
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; fare: CenterFare | null }>({
    open: false,
    fare: null,
  })
  const [policyDrawer, setPolicyDrawer] = useState<{ open: boolean; fare: CenterFare | null }>({
    open: false,
    fare: null,
  })
  const [calculatorOpen, setCalculatorOpen] = useState(false)

  const handleEdit = (fare: CenterFare) => {
    setEditModal({ open: true, fare })
  }

  const handleDelete = (fare: CenterFare) => {
    setDeleteDialog({ open: true, fare })
  }

  const handlePolicySettings = (fare: CenterFare) => {
    setPolicyDrawer({ open: true, fare })
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality to be implemented')
  }

  return (
    <div className="flex-1 space-y-8 p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen" role="main" aria-label="센터 요율 관리 페이지">
      {/* Premium Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg" aria-hidden="true">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            센터 요율 관리
          </h1>
          <p className="text-lg text-gray-600 ml-16">
            물류센터별 차량 타입과 지역별 요율을 체계적으로 관리하고 정책을 설정합니다
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setCalculatorOpen(true)}
            className="h-12 px-6 rounded-xl border-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 transition-colors font-medium"
            aria-label="운임 계산기 열기"
          >
            <Calculator className="h-5 w-5 mr-2" aria-hidden="true" />
            운임 계산기
          </Button>
          
          <PermissionGate resource="centerFares" action="create">
            <Button 
              onClick={() => setCreateModalOpen(true)}
              className="h-12 px-6 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              aria-label="새로운 센터 요율 등록"
            >
              <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
              새 요율 등록
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="region" aria-label="요율 관리 통계">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-700">총 요율 수</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-blue-900">{data?.pagination?.totalCount || 0}</p>
                    <Badge variant="secondary" className="text-xs bg-blue-200 text-blue-800">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12%
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-3 bg-blue-600 rounded-xl shadow-md">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700">등록된 센터</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-green-900">8</p>
                    <Badge variant="secondary" className="text-xs bg-green-200 text-green-800">
                      <Activity className="h-3 w-3 mr-1" />
                      활성
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-3 bg-green-600 rounded-xl shadow-md">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-700">차량 타입</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-purple-900">5</p>
                    <Badge variant="secondary" className="text-xs bg-purple-200 text-purple-800">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      다양
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-3 bg-purple-600 rounded-xl shadow-md">
                <Truck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-700">배송 지역</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-8" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-orange-900">23</p>
                    <Badge variant="secondary" className="text-xs bg-orange-200 text-orange-800">
                      전국
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-3 bg-orange-600 rounded-xl shadow-md">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters Section */}
      <FiltersBar onFiltersChange={setFilters} activeFilters={query} />

      {/* Enhanced Table Section */}
      <Card className="border-0 shadow-xl bg-white">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                요율 목록
              </CardTitle>
              <p className="text-sm text-gray-600">
                {isLoading ? (
                  '데이터를 불러오는 중...'
                ) : (
                  `총 ${data?.pagination?.totalCount || 0}개의 요율이 등록되어 있습니다`
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleExport}
                className="h-11 px-4 rounded-xl border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium"
                aria-label="센터 요율 데이터를 엑셀 파일로 내보내기"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" aria-hidden="true" />
                엑셀 내보내기
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <CenterFareTable
            data={data ? {
              fares: data.data,
              totalCount: data.pagination.totalCount,
              page: data.pagination.page,
              size: data.pagination.size,
              totalPages: data.pagination.totalPages
            } : undefined}
            isLoading={isLoading}
            query={query}
            onSort={setSort}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPolicySettings={handlePolicySettings}
          />
          
          {/* Enhanced Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="border-t border-gray-100 bg-gray-50 rounded-b-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-700" role="status" aria-live="polite">
                    총 <span className="font-semibold text-gray-900">{data.pagination.totalCount}</span>개 요율 중{' '}
                    <span className="font-semibold text-gray-900">
                      {(data.pagination.page - 1) * data.pagination.size + 1}-{Math.min(data.pagination.page * data.pagination.size, data.pagination.totalCount)}
                    </span>개 표시
                  </div>
                  <Badge variant="outline" className="text-xs" aria-label={`현재 페이지 ${data.pagination.page}, 전체 ${data.pagination.totalPages} 페이지`}>
                    페이지 {data.pagination.page} / {data.pagination.totalPages}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={data.pagination.page <= 1}
                    onClick={() => setPage(data.pagination.page - 1)}
                    className="h-9 px-4 rounded-lg font-medium disabled:opacity-50"
                    aria-label="이전 페이지로 이동"
                  >
                    이전
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(data.pagination.totalPages - 4, data.pagination.page - 2)) + i
                      const isCurrentPage = pageNum === data.pagination.page
                      return (
                        <Button
                          key={pageNum}
                          variant={isCurrentPage ? "primary" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className={`h-9 w-9 rounded-lg font-medium ${
                            isCurrentPage 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'hover:bg-gray-50'
                          }`}
                          aria-label={`페이지 ${pageNum}로 이동`}
                          aria-current={isCurrentPage ? 'page' : undefined}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={data.pagination.page >= data.pagination.totalPages}
                    onClick={() => setPage(data.pagination.page + 1)}
                    className="h-9 px-4 rounded-lg font-medium disabled:opacity-50"
                    aria-label="다음 페이지로 이동"
                  >
                    다음
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals & Dialogs */}
      <CenterFareCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <CenterFareEditModal
        fare={editModal.fare}
        open={editModal.open}
        onOpenChange={(open) => setEditModal({ open, fare: open ? editModal.fare : null })}
      />
      
      <CenterFareDeleteDialog
        fare={deleteDialog.fare}
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, fare: open ? deleteDialog.fare : null })}
      />

      <CenterFarePolicyDrawer
        fare={policyDrawer.fare}
        open={policyDrawer.open}
        onOpenChange={(open) => setPolicyDrawer({ open, fare: open ? policyDrawer.fare : null })}
      />

      <FareCalculatorDrawer
        open={calculatorOpen}
        onOpenChange={setCalculatorOpen}
      />
    </div>
  )
}