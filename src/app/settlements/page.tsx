'use client'

import React, { useState } from 'react'
import { Plus, Search, Eye, Download, Lock, DollarSign, Calendar, User, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { SettlementResponse, getSettlementStatusName, getSettlementStatusColor, canEditSettlement, canConfirmSettlement, formatYearMonth } from '@/lib/validations/settlement'
import { useSettlements, usePreviewSettlement, useFinalizeSettlement, useExportSettlements, useCreateSettlement } from '@/hooks/useSettlements'
import Link from 'next/link'

// 상태 배지 컴포넌트
function StatusBadge({ status }: { status: SettlementResponse['status'] }) {
  const color = getSettlementStatusColor(status)
  const name = getSettlementStatusName(status)
  
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800'}`}>
      {name}
    </span>
  )
}

// 정산 미리보기 모달
function PreviewModal({ 
  isOpen, 
  onClose, 
  previewData, 
  onConfirm, 
  isConfirming 
}: { 
  isOpen: boolean
  onClose: () => void
  previewData: any
  onConfirm: () => void
  isConfirming: boolean
}) {
  if (!isOpen || !previewData) return null

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(parseInt(amount))
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                정산 미리보기 - {previewData.driver.name} ({formatYearMonth(previewData.yearMonth)})
              </h3>
            </div>

            {/* 정산 요약 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">총 운행</div>
                <div className="text-2xl font-bold text-blue-900">{previewData.calculation.totalTrips}회</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">기본 요금</div>
                <div className="text-xl font-bold text-green-900">{formatCurrency(previewData.calculation.totalBaseFare)}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-600">공제액</div>
                <div className="text-xl font-bold text-red-900">{formatCurrency(previewData.calculation.totalDeductions)}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600">최종 정산액</div>
                <div className="text-2xl font-bold text-purple-900">{formatCurrency(previewData.calculation.finalAmount)}</div>
              </div>
            </div>

            {/* 경고사항 */}
            {previewData.warnings.length > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-sm text-yellow-800">
                  <strong>주의사항:</strong>
                  <ul className="mt-1 list-disc pl-5">
                    {previewData.warnings.map((warning: string, index: number) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 운행 내역 */}
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">운행 내역 ({previewData.items.length}건)</h4>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">노선</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">기사요금</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">차감</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.items.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            item.status === 'ABSENCE' ? 'bg-red-100 text-red-800' :
                            item.status === 'SUBSTITUTE' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {item.status === 'COMPLETED' ? '완료' :
                             item.status === 'ABSENCE' ? '결행' :
                             item.status === 'SUBSTITUTE' ? '대차' : '예정'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {item.routeName || `${item.loadingPoint} → ${item.unloadingPoint}`}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.driverFare)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-red-600 text-right">
                          {item.deductionAmount ? formatCurrency(item.deductionAmount) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                취소
              </button>
              {previewData.canConfirm && (
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isConfirming}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConfirming ? '확정 중...' : '정산 확정 (월락)'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 메인 SettlementsPage 컴포넌트
export default function SettlementsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [yearMonth, setYearMonth] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [previewModalData, setPreviewModalData] = useState<any>(null)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')

  const { data: settlementsData, isLoading, error } = useSettlements(searchTerm, yearMonth, undefined, selectedStatus)
  const previewMutation = usePreviewSettlement()
  const finalizeMutation = useFinalizeSettlement()
  const exportMutation = useExportSettlements()
  const createMutation = useCreateSettlement()

  const handlePreview = async (driverId: string, yearMonth: string) => {
    try {
      const previewData = await previewMutation.mutateAsync({ driverId, yearMonth })
      setPreviewModalData(previewData)
    } catch (error) {
      // Error is handled by mutation
    }
  }

  const handleConfirmSettlement = async () => {
    if (!previewModalData) return
    
    try {
      await finalizeMutation.mutateAsync({
        driverId: previewModalData.driverId,
        yearMonth: previewModalData.yearMonth
      })
      setPreviewModalData(null)
    } catch (error) {
      // Error is handled by mutation
    }
  }

  const handleExport = (yearMonth: string) => {
    exportMutation.mutate({ yearMonth })
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(parseInt(amount))
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : '알 수 없는 오류'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            새로고침
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                정산 관리
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                메인으로
              </Link>
              <button
                onClick={() => {
                  if (!selectedMonth || !selectedDriverId) {
                    toast.error('빠른 정산 처리 섹션에서 월과 기사 ID를 입력해주세요')
                    return
                  }
                  createMutation.mutate({ driverId: selectedDriverId, yearMonth: selectedMonth })
                }}
                disabled={!selectedMonth || !selectedDriverId || createMutation.isPending}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createMutation.isPending ? '생성 중...' : '정산 생성'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 빠른 정산 섹션 */}
        <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h2 className="text-lg font-medium text-blue-900 mb-3">빠른 정산 처리</h2>
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <label htmlFor="quickMonth" className="block text-sm font-medium text-blue-700 mb-1">
                정산월 선택
              </label>
              <input
                type="month"
                id="quickMonth"
                className="block w-full px-3 py-2 border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={new Date().toISOString().slice(0, 7)}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="quickDriver" className="block text-sm font-medium text-blue-700 mb-1">
                기사 ID (선택사항)
              </label>
              <input
                type="text"
                id="quickDriver"
                className="block w-full px-3 py-2 border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="기사 ID 입력..."
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                if (!selectedMonth) {
                  toast.error('정산월을 선택해주세요')
                  return
                }
                if (!selectedDriverId) {
                  toast.error('기사 ID를 입력해주세요')
                  return
                }
                handlePreview(selectedDriverId, selectedMonth)
              }}
              disabled={!selectedMonth || !selectedDriverId || previewMutation.isPending}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {previewMutation.isPending ? '조회 중...' : '정산 미리보기 → 확정'}
            </button>
          </div>
          <p className="mt-2 text-sm text-blue-600">
            월을 선택하고 기사 ID를 입력한 후 미리보기를 통해 바로 정산을 확정할 수 있습니다.
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                검색
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="기사명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="yearMonth" className="block text-sm font-medium text-gray-700 mb-1">
                정산월
              </label>
              <input
                type="month"
                id="yearMonth"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                id="status"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">전체</option>
                <option value="DRAFT">임시저장</option>
                <option value="CONFIRMED">확정</option>
                <option value="PAID">지급완료</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => yearMonth && handleExport(yearMonth)}
                disabled={!yearMonth || exportMutation.isPending}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                엑셀 내보내기
              </button>
            </div>
          </div>
        </div>

        {/* 정산 목록 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : !settlementsData?.settlements?.length ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">등록된 정산이 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">
                새로운 정산을 생성하거나 미리보기를 확인해보세요.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {settlementsData.settlements.map((settlement: SettlementResponse) => (
                <li key={settlement.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* 첫 번째 줄: 기사명, 정산월, 상태 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-sm font-medium text-gray-900">
                            <User className="h-4 w-4 mr-1 text-gray-400" />
                            {settlement.driver.name}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {formatYearMonth(settlement.yearMonth)}
                          </div>
                          <StatusBadge status={settlement.status} />
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>생성: {new Date(settlement.createdAt).toLocaleDateString('ko-KR')}</p>
                          {settlement.confirmedAt && (
                            <p>확정: {new Date(settlement.confirmedAt).toLocaleDateString('ko-KR')}</p>
                          )}
                        </div>
                      </div>

                      {/* 두 번째 줄: 정산 요약 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                        <div className="text-sm">
                          <span className="text-gray-500">운행: </span>
                          <span className="font-medium">{settlement.totalTrips}회</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">기본요금: </span>
                          <span className="font-medium">{formatCurrency(settlement.totalBaseFare)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">공제액: </span>
                          <span className="font-medium text-red-600">{formatCurrency(settlement.totalDeductions)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">최종: </span>
                          <span className="font-bold text-blue-600">{formatCurrency(settlement.finalAmount)}</span>
                        </div>
                      </div>

                      {/* 연락처 */}
                      <div className="text-sm text-gray-500">
                        {settlement.driver.phone}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handlePreview(settlement.driver.id, settlement.yearMonth)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                        title="미리보기"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canConfirmSettlement(settlement.status) && (
                        <button
                          onClick={() => toast('정산 확정은 미리보기에서 가능합니다')}
                          className="p-2 text-gray-400 hover:text-green-600"
                          title="확정"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleExport(settlement.yearMonth)}
                        className="p-2 text-gray-400 hover:text-purple-600"
                        title="개별 내보내기"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 페이지네이션 */}
        {settlementsData?.pagination && settlementsData.pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-md shadow">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  총 <span className="font-medium">{settlementsData.pagination.total}</span>개 중{' '}
                  <span className="font-medium">
                    {(settlementsData.pagination.page - 1) * settlementsData.pagination.limit + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-medium">
                    {Math.min(
                      settlementsData.pagination.page * settlementsData.pagination.limit,
                      settlementsData.pagination.total
                    )}
                  </span>{' '}
                  개 표시
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 미리보기 모달 */}
      <PreviewModal
        isOpen={!!previewModalData}
        onClose={() => setPreviewModalData(null)}
        previewData={previewModalData}
        onConfirm={handleConfirmSettlement}
        isConfirming={finalizeMutation.isPending}
      />
    </div>
  )
}