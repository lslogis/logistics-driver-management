'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useMemo } from 'react'
import { Calculator, Eye, Edit, Copy, Share2, CheckCircle, XCircle, DollarSign, Calendar, TrendingUp, Percent, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ContextMenuItem } from '@/components/ui/ContextMenu'
import { ThemedManagementPage } from '@/components/shared/ThemedManagementPage'
import { ColorTheme } from '@/components/shared/ColorThemeProvider'
import { Rate, CreateRateData, UpdateRateData, VEHICLE_TYPE_LABELS, RATE_TYPE_LABELS } from '@/types/management'
import { dummyRates } from '@/data/dummyData'
import { cn } from '@/lib/utils'

// Mock hooks for demonstration
const useRates = (search: string, statusFilter: string) => {
  const filteredData = useMemo(() => {
    return dummyRates.filter(rate => {
      const matchesSearch = !search || 
        rate.rateName.toLowerCase().includes(search.toLowerCase()) ||
        rate.rateCode.toLowerCase().includes(search.toLowerCase()) ||
        rate.region.toLowerCase().includes(search.toLowerCase()) ||
        rate.units.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && rate.isActive) ||
        (statusFilter === 'inactive' && !rate.isActive)

      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter])

  return {
    data: { pages: [{ items: filteredData }] },
    isLoading: false,
    error: null,
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false
  }
}

const useMockRateMutations = () => ({
  create: { mutate: (data: any) => toast.success('요율이 등록되었습니다'), isPending: false },
  update: { mutate: (data: any) => toast.success('요율이 수정되었습니다'), isPending: false },
  activate: { mutate: (id: string) => toast.success('요율이 활성화되었습니다') },
  deactivate: { mutate: (id: string) => toast.success('요율이 비활성화되었습니다') },
  bulkActivate: { mutate: (ids: string[]) => toast.success(`${ids.length}개 요율이 활성화되었습니다`) },
  bulkDeactivate: { mutate: (ids: string[]) => toast.success(`${ids.length}개 요율이 비활성화되었습니다`) },
  bulkDelete: { mutate: (ids: string[]) => toast.success(`${ids.length}개 요율이 삭제되었습니다`) },
  export: { mutate: () => toast.success('엑셀 파일이 다운로드되었습니다'), isPending: false }
})

// Rate Form
const RateForm: React.FC<{
  rate?: Rate
  onSubmit: (data: CreateRateData | UpdateRateData) => void
  isLoading: boolean
  onCancel: () => void
}> = ({ rate, onSubmit, isLoading, onCancel }) => (
  <div className="p-6">
    <div className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">요율명 *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={rate?.rateName}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">요율코드 *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={rate?.rateCode}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">요율유형 *</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={rate?.rateType}
              required
            >
              <option value="">선택하세요</option>
              <option value="distance">거리기준</option>
              <option value="time">시간기준</option>
              <option value="weight">중량기준</option>
              <option value="volume">부피기준</option>
              <option value="fixed">정액</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">적용차량</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={rate?.vehicleType}
            >
              <option value="all">전체 차량</option>
              <option value="small">소형</option>
              <option value="medium">중형</option>
              <option value="large">대형</option>
              <option value="extra_large">특대형</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">적용지역</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={rate?.region}
              placeholder="예: 수도권, 전국"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={rate?.units}
              placeholder="예: 원/km, 원/시간, 원/톤"
            />
          </div>
        </div>
      </div>

      {/* Rate Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">요율 정보</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">기본요율 *</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={rate?.baseRate}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최소요금</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={rate?.minimumCharge}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최대요금</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={rate?.maximumCharge}
            />
          </div>
        </div>
      </div>

      {/* Validity Period */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">유효기간</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일 *</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={rate?.validFrom.toISOString().split('T')[0]}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={rate?.validTo?.toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
            <input
              type="number"
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={rate?.priority || 1}
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">추가 정보</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">적용조건</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              defaultValue={rate?.conditions}
              placeholder="요율 적용 조건을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={2}
              defaultValue={rate?.notes}
              placeholder="추가 설명이나 특이사항을 입력하세요"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>취소</Button>
        <Button 
          onClick={() => onSubmit({})} 
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {isLoading ? '저장 중...' : (rate ? '수정' : '등록')}
        </Button>
      </div>
    </div>
  </div>
)

export default function RatesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [rateTypeFilter, setRateTypeFilter] = useState('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<Rate | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Data fetching
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useRates(searchTerm, statusFilter)
  
  const ratesData = useMemo(() => {
    return data?.pages?.flatMap((page: any) => (page.items || page.data || [])) || []
  }, [data])

  const totalCount = ratesData.length

  // Mutations
  const mutations = useMockRateMutations()

  // Filter data
  const filteredData = useMemo(() => {
    return ratesData.filter(rate => {
      const matchesRateType = rateTypeFilter === 'all' || rate.rateType === rateTypeFilter
      return matchesRateType
    })
  }, [ratesData, rateTypeFilter])

  // CRUD handlers
  const handleCreate = (data: CreateRateData) => {
    mutations.create.mutate(data)
    setCreateModalOpen(false)
  }

  const handleUpdate = (data: UpdateRateData) => {
    if (!editingRate) return
    mutations.update.mutate({ id: editingRate.id, data })
    setEditModalOpen(false)
    setEditingRate(null)
  }

  const handleActivate = (id: string) => mutations.activate.mutate(id)
  const handleDeactivate = (id: string) => mutations.deactivate.mutate(id)

  // Helper functions
  const handleCopyRateInfo = (rate: Rate) => {
    const info = `요율명: ${rate.rateName}\n요율코드: ${rate.rateCode}\n기본요율: ${rate.baseRate.toLocaleString()}${rate.units}\n적용지역: ${rate.region}`
    navigator.clipboard.writeText(info)
    toast.success('요율 정보가 복사되었습니다')
  }

  const handleShareRate = (rate: Rate) => {
    toast.success('요율 정보가 공유되었습니다')
  }

  // Context menu items
  const getContextMenuItems = (rate: Rate): ContextMenuItem[] => [
    {
      id: 'view',
      label: '상세 보기',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => toast.info(`${rate.rateName} 상세 정보`)
    },
    {
      id: 'edit',
      label: '수정',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => {
        setEditingRate(rate)
        setEditModalOpen(true)
      }
    },
    {
      id: 'copy',
      label: '정보 복사',
      icon: <Copy className="h-4 w-4" />,
      onClick: () => handleCopyRateInfo(rate)
    },
    {
      id: 'share',
      label: '공유',
      icon: <Share2 className="h-4 w-4" />,
      onClick: () => handleShareRate(rate)
    },
    {
      id: 'calculate',
      label: '요금 계산',
      icon: <Calculator className="h-4 w-4" />,
      onClick: () => toast.info(`${rate.rateName} 요금 계산기`)
    },
    {
      id: 'toggle',
      label: rate.isActive ? '비활성화' : '활성화',
      icon: rate.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
      onClick: () => rate.isActive ? handleDeactivate(rate.id) : handleActivate(rate.id)
    }
  ]

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // Check if rate is currently valid
  const isRateValid = (rate: Rate) => {
    const today = new Date()
    const validFrom = new Date(rate.validFrom)
    const validTo = rate.validTo ? new Date(rate.validTo) : null
    
    return today >= validFrom && (!validTo || today <= validTo)
  }

  // Get rate validity badge
  const getValidityBadge = (rate: Rate) => {
    if (!rate.isActive) return null
    
    const valid = isRateValid(rate)
    const today = new Date()
    const validTo = rate.validTo ? new Date(rate.validTo) : null
    
    if (!valid && validTo && today > validTo) {
      return (
        <Badge variant="outline" className="text-xs font-semibold bg-red-100 text-red-800 border-red-200">
          만료됨
        </Badge>
      )
    }
    
    if (valid && validTo) {
      const daysLeft = Math.ceil((validTo.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 30) {
        return (
          <Badge variant="outline" className="text-xs font-semibold bg-yellow-100 text-yellow-800 border-yellow-200">
            {daysLeft}일 남음
          </Badge>
        )
      }
    }
    
    if (valid) {
      return (
        <Badge variant="outline" className="text-xs font-semibold bg-green-100 text-green-800 border-green-200">
          유효
        </Badge>
      )
    }
    
    return null
  }

  // Render item function
  const renderItem = (rate: Rate, theme: ColorTheme) => (
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0 mr-4">
        {/* Rate Name and Status */}
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {rate.rateName}
          </h3>
          <Badge
            variant={rate.isActive ? "default" : "secondary"}
            className={cn(
              "text-xs font-semibold",
              rate.isActive 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-red-100 text-red-800 border-red-200"
            )}
          >
            {rate.isActive ? '활성' : '비활성'}
          </Badge>
          {getValidityBadge(rate)}
        </div>

        {/* Rate Code and Type */}
        <div className={cn("text-base font-medium mb-2", theme.primaryText)}>
          {rate.rateCode} - {RATE_TYPE_LABELS[rate.rateType]}
        </div>

        {/* Rate Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-700">
            <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">기본요율:</span>
            <span className="ml-1 font-semibold">{rate.baseRate.toLocaleString()}{rate.units}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium">최소:</span>
            <span className="ml-1">{rate.minimumCharge.toLocaleString()}원</span>
            {rate.maximumCharge && (
              <>
                <span className="ml-3 font-medium">최대:</span>
                <span className="ml-1">{rate.maximumCharge.toLocaleString()}원</span>
              </>
            )}
          </div>
        </div>

        {/* Application Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <span className="font-medium">차량:</span>
            <span>{rate.vehicleType === 'all' ? '전체' : VEHICLE_TYPE_LABELS[rate.vehicleType as keyof typeof VEHICLE_TYPE_LABELS]}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-medium">지역:</span>
            <span>{rate.region}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-medium">우선순위:</span>
            <span>{rate.priority}</span>
          </div>
        </div>

        {/* Validity Period */}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
          <div className="text-gray-700">
            <Calendar className="h-4 w-4 inline mr-1" />
            <span className="font-medium">유효기간:</span>
            <span className="ml-1">{formatDate(rate.validFrom)}</span>
            {rate.validTo && (
              <span> ~ {formatDate(rate.validTo)}</span>
            )}
          </div>
        </div>

        {/* Surcharges */}
        {rate.surcharges && rate.surcharges.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">할증:</span>
            {rate.surcharges.filter(s => s.isActive).slice(0, 3).map((surcharge, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs bg-purple-50 text-purple-700 border-purple-200"
              >
                <Percent className="h-3 w-3 mr-1" />
                {surcharge.name} {surcharge.value}{surcharge.type === 'percentage' ? '%' : '원'}
              </Badge>
            ))}
            {rate.surcharges.filter(s => s.isActive).length > 3 && (
              <span className="text-gray-500">+{rate.surcharges.filter(s => s.isActive).length - 3}개</span>
            )}
          </div>
        )}

        {/* Conditions */}
        {rate.conditions && (
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">조건:</span>
            <span className="ml-1">{rate.conditions}</span>
          </div>
        )}

        {/* Notes */}
        {rate.notes && (
          <div className="mt-2 text-sm text-gray-500">
            <span className="font-medium">비고:</span>
            <span className="ml-1">{rate.notes}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            toast.info(`${rate.rateName} 상세 정보`)
          }}
          className="border-purple-200 text-purple-600 hover:bg-purple-50"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setEditingRate(rate)
            setEditModalOpen(true)
          }}
          className="border-purple-200 text-purple-600 hover:bg-purple-50"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            toast.info(`${rate.rateName} 요금 계산기`)
          }}
          className="border-pink-200 text-pink-600 hover:bg-pink-50"
        >
          <Calculator className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <ThemedManagementPage
        theme="rates"
        title="요율관리"
        subtitle="운송 요율을 효율적으로 관리하세요"
        icon={<Calculator />}
        data={filteredData}
        totalCount={totalCount}
        isLoading={isLoading}
        error={error}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        additionalFilters={[
          {
            label: '요율유형',
            value: rateTypeFilter,
            onChange: setRateTypeFilter,
            options: [
              { value: 'all', label: '전체 유형' },
              { value: 'distance', label: '거리기준' },
              { value: 'time', label: '시간기준' },
              { value: 'weight', label: '중량기준' },
              { value: 'volume', label: '부피기준' },
              { value: 'fixed', label: '정액' }
            ]
          }
        ]}
        onCreateClick={() => setCreateModalOpen(true)}
        onImportClick={() => setImportModalOpen(true)}
        onExportClick={() => mutations.export.mutate()}
        renderItem={renderItem}
        getContextMenuItems={getContextMenuItems}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onBulkActivate={(ids) => mutations.bulkActivate.mutate(ids)}
        onBulkDeactivate={(ids) => mutations.bulkDeactivate.mutate(ids)}
        onBulkDelete={(ids) => mutations.bulkDelete.mutate(ids)}
        emptyStateMessage="등록된 요율이 없습니다"
        emptyStateAction="새로운 요율을 등록하여 시작해보세요"
      />

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              요율 등록
            </DialogTitle>
          </DialogHeader>
          <RateForm
            onSubmit={handleCreate}
            isLoading={mutations.create.isPending}
            onCancel={() => setCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              요율 수정
            </DialogTitle>
          </DialogHeader>
          <RateForm
            rate={editingRate || undefined}
            onSubmit={handleUpdate}
            isLoading={mutations.update.isPending}
            onCancel={() => {
              setEditModalOpen(false)
              setEditingRate(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}