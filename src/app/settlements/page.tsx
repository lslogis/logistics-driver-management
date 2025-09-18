'use client'

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { DollarSign, Plus, Eye, Download, Lock, Calendar, User, FileText, BarChart3 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { SettlementResponse, getSettlementStatusName, getSettlementStatusColor, canConfirmSettlement, formatYearMonth } from '@/lib/validations/settlement'
import { useSettlements, usePreviewSettlement, useFinalizeSettlement, useExportSettlements, useCreateSettlement } from '@/hooks/useSettlements'
import ManagementPageLayout from '@/components/layout/ManagementPageLayout'
import { DataTable, commonActions } from '@/components/ui/DataTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/SimpleTabs'
import SettlementOverviewCards from '@/components/SettlementOverviewCards'
import SettlementCharts from '@/components/SettlementCharts'
import SettlementInputForm from '@/components/SettlementInputForm'

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
    <div className="fixed inset-0 md:left-64 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 md:left-64 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
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

  // Define table columns
  const columns = [
    {
      key: 'info',
      header: '기본 정보',
      render: (value: any, settlement: SettlementResponse) => (
        <div>
          <div className="flex items-center mb-2">
            <User className="h-4 w-4 mr-1 text-gray-400" />
            <span className="font-medium text-gray-900">{settlement.driver.name}</span>
            <div className="ml-3">
              <StatusBadge status={settlement.status} />
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
            {formatYearMonth(settlement.yearMonth)}
          </div>
          <div className="text-sm text-gray-500">
            {settlement.driver.phone}
          </div>
        </div>
      ),
    },
    {
      key: 'summary',
      header: '정산 요약',
      render: (value: any, settlement: SettlementResponse) => (
        <div className="space-y-1">
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
        </div>
      ),
    },
    {
      key: 'finalAmount',
      header: '최종 정산액',
      render: (finalAmount: string) => (
        <div className="font-bold text-lg text-blue-600">
          {formatCurrency(finalAmount)}
        </div>
      ),
    },
    {
      key: 'dates',
      header: '일자',
      render: (value: any, settlement: SettlementResponse) => (
        <div className="text-xs text-gray-500">
          <div>생성: {new Date(settlement.createdAt).toLocaleDateString('ko-KR')}</div>
          {settlement.confirmedAt && (
            <div className="mt-1">확정: {new Date(settlement.confirmedAt).toLocaleDateString('ko-KR')}</div>
          )}
        </div>
      ),
    },
  ]

  // Define table actions
  const actions = [
    {
      icon: <Eye />,
      label: '미리보기',
      onClick: (settlement: SettlementResponse) => handlePreview(settlement.driver.id, settlement.yearMonth),
    },
    {
      icon: <Lock />,
      label: '확정',
      onClick: () => toast('정산 확정은 미리보기에서 가능합니다'),
      variant: 'success' as const,
      show: (settlement: SettlementResponse) => canConfirmSettlement(settlement.status),
    },
    {
      icon: <Download />,
      label: '내보내기',
      onClick: (settlement: SettlementResponse) => handleExport(settlement.yearMonth),
    },
  ]

  // 샘플 데이터 (실제 구현시 API에서 가져옴)
  const mockChartData = {
    marginTrend: [
      { month: '09월', margin: 2500000 },
      { month: '10월', margin: 3200000 },
      { month: '11월', margin: 2800000 },
      { month: '12월', margin: 3500000 },
      { month: '01월', margin: 4200000 },
      { month: '02월', margin: 3800000 }
    ],
    driverPayoutRatio: [
      { name: '김기사', value: 2500000, percentage: 25.5 },
      { name: '이기사', value: 2200000, percentage: 22.4 },
      { name: '박기사', value: 1800000, percentage: 18.3 },
      { name: '최기사', value: 1600000, percentage: 16.3 },
      { name: '정기사', value: 1700000, percentage: 17.5 }
    ],
    centerMargin: [
      { center: '서울센터', margin: 1200000 },
      { center: '부산센터', margin: 980000 },
      { center: '대구센터', margin: 750000 },
      { center: '인천센터', margin: 650000 }
    ]
  }

  const totalRevenue = 15000000 // 샘플 데이터
  const totalPayout = 9800000   // 샘플 데이터
  const margin = totalRevenue - totalPayout

  const handleSettlementInput = (data: any) => {
    console.log('정산 입력:', data)
    toast.success('정산이 등록되었습니다')
  }

  return (
    <ManagementPageLayout
      title="정산 관리"
      subtitle="기사별, 센터별 정산 및 마진 관리"
      icon={<DollarSign />}
      totalCount={settlementsData?.pagination?.total}
      countLabel="건"
      primaryAction={{
        label: '정산 생성',
        onClick: () => {
          if (!selectedMonth || !selectedDriverId) {
            toast.error('검색 필터에서 월과 기사 ID를 입력해주세요')
            return
          }
          createMutation.mutate({ driverId: selectedDriverId, yearMonth: selectedMonth })
        },
        loading: createMutation.isPending,
        disabled: !selectedMonth || !selectedDriverId,
        icon: <Plus className="h-4 w-4" />,
      }}
      searchFilters={[
        {
          label: '정산월',
          type: 'month',
          value: yearMonth,
          onChange: setYearMonth,
        },
        {
          label: '기사명 검색',
          type: 'text',
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: '기사명으로 검색...',
        },
        {
          label: '상태',
          type: 'select',
          value: selectedStatus,
          onChange: setSelectedStatus,
          options: [
            { value: '', label: '전체' },
            { value: 'DRAFT', label: '임시저장' },
            { value: 'CONFIRMED', label: '확정' },
            { value: 'PAID', label: '지급완료' },
          ],
        },
      ]}
      isLoading={isLoading}
      error={error && typeof error === 'object' && 'message' in error ? (error as Error).message : undefined}
    >
      {/* 상단 요약 카드 */}
      <div className="mb-6">
        <SettlementOverviewCards
          totalRevenue={totalRevenue}
          totalPayout={totalPayout}
          margin={margin}
        />
      </div>

      {/* 탭 구조 */}
      <Tabs defaultValue="by-driver" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="by-driver" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            기사별 정산
          </TabsTrigger>
          <TabsTrigger value="by-center" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            센터별 정산
          </TabsTrigger>
          <TabsTrigger value="payment-log" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            지급내역
          </TabsTrigger>
          <TabsTrigger value="input-form" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            정산 입력
          </TabsTrigger>
        </TabsList>

        {/* 기사별 정산 탭 */}
        <TabsContent value="by-driver" className="space-y-6">
          {/* 차트 섹션 */}
          <SettlementCharts data={mockChartData} />
          
          {/* 빠른 정산 섹션 */}
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">빠른 정산 처리</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
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
              <div>
                <label htmlFor="quickDriverId" className="block text-sm font-medium text-blue-700 mb-1">
                  기사 ID
                </label>
                <input
                  type="text"
                  id="quickDriverId"
                  className="block w-full px-3 py-2 border border-blue-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  placeholder="기사 ID를 입력하세요"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    if (!selectedMonth || !selectedDriverId) {
                      toast.error('월과 기사 ID를 모두 입력해주세요')
                      return
                    }
                    handlePreview(selectedDriverId, selectedMonth)
                  }}
                  disabled={!selectedMonth || !selectedDriverId || previewMutation.isPending}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {previewMutation.isPending ? '조회 중...' : '미리보기 → 확정'}
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm text-blue-600">
              월을 선택하고 기사 ID를 입력한 후 미리보기를 통해 바로 정산을 확정할 수 있습니다.
            </p>
          </div>

          {/* 기사별 정산 테이블 */}
          <DataTable
            data={settlementsData?.settlements || []}
            columns={columns}
            actions={actions}
            pagination={settlementsData?.pagination}
            emptyState={{
              icon: <FileText />,
              title: '등록된 정산이 없습니다',
              description: '새로운 정산을 생성하거나 미리보기를 확인해보세요.',
              action: {
                label: '정산 생성',
                onClick: () => {
                  if (!selectedMonth || !selectedDriverId) {
                    toast.error('검색 필터에서 월과 기사 ID를 먼저 입력해주세요')
                    return
                  }
                  createMutation.mutate({ driverId: selectedDriverId, yearMonth: selectedMonth })
                },
              },
            }}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* 센터별 정산 탭 */}
        <TabsContent value="by-center" className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">센터별 정산 현황</h3>
            <div className="text-gray-500 text-center py-8">
              센터별 정산 기능은 추후 구현 예정입니다.
            </div>
          </div>
        </TabsContent>

        {/* 지급내역 탭 */}
        <TabsContent value="payment-log" className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">지급내역 로그</h3>
            <div className="text-gray-500 text-center py-8">
              지급내역 로그 기능은 추후 구현 예정입니다.
            </div>
          </div>
        </TabsContent>

        {/* 정산 입력 탭 */}
        <TabsContent value="input-form" className="space-y-6">
          <SettlementInputForm 
            onSubmit={handleSettlementInput}
            isLoading={false}
          />
        </TabsContent>
      </Tabs>

      {/* 미리보기 모달 */}
      <PreviewModal
        isOpen={!!previewModalData}
        onClose={() => setPreviewModalData(null)}
        previewData={previewModalData}
        onConfirm={handleConfirmSettlement}
        isConfirming={finalizeMutation.isPending}
      />
    </ManagementPageLayout>
  )
}