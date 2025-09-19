'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useMemo } from 'react'
import { Route, Eye, Edit, Copy, Share2, CheckCircle, XCircle, MapPin, Clock, Truck, Calendar, Plus, Upload, Download, Building2, UserCheck } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ContextMenuItem, ContextMenu } from '@/components/ui/ContextMenu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImportModal } from '@/components/import'
import { useFixedContracts, useCreateFixedContract, useUpdateFixedContract, useDeleteFixedContract, useToggleFixedContractStatus } from '@/hooks/useFixedContracts'
import { useLoadingPoints } from '@/hooks/useLoadingPoints'
import { cn } from '@/lib/utils'
import { formatPhoneNumber } from '@/lib/utils/format'
import { ContractType } from '@prisma/client'
import { FixedContractResponse } from '@/lib/validations/fixedContract'
import FixedContractForm from '@/components/forms/FixedContractForm'
import FixedContractDetailDrawer from '@/components/fixedRoutes/FixedContractDetailDrawer'

// Contract type labels
const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  FIXED_DAILY: '고정(일대)',
  FIXED_MONTHLY: '고정(월대)',
  CONSIGNED_MONTHLY: '고정지입',
  CHARTER_PER_RIDE: '용차운임'
}

// Operating days labels
const OPERATING_DAYS_LABELS: Record<number, string> = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토'
}

// Format operating days for display
const formatOperatingDays = (days: number[]) => {
  if (!days || days.length === 0) return '-'
  return days.sort((a, b) => a - b).map(d => OPERATING_DAYS_LABELS[d] || d).join(', ')
}

// Format currency
const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null) return '-'
  return `${amount.toLocaleString()}원`
}

// Format date
const formatDate = (date: string | null | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul'
  })
}

export default function FixedRoutesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [contractTypeFilter, setContractTypeFilter] = useState<ContractType | undefined>(undefined)
  const [centerFilter, setCenterFilter] = useState('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<FixedContractResponse | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [detailContract, setDetailContract] = useState<FixedContractResponse | null>(null)

  // Data fetching
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useFixedContracts({
    search: searchTerm || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    contractType: contractTypeFilter,
    page: 1,
    limit: 100
  })

  // Loading points for center filter
  const { data: loadingPointsData } = useLoadingPoints('', 'active')
  
  const contractsData = useMemo(() => {
    let contracts = data?.contracts || []
    
    // Apply center filter
    if (centerFilter !== 'all') {
      contracts = contracts.filter(contract => 
        contract.loadingPoint?.centerName === centerFilter
      )
    }
    
    return contracts
  }, [data, centerFilter])

  // Get loading points for center filter dropdown
  const loadingPoints = loadingPointsData?.pages?.flatMap((page: any) => (page.items || page.data || [])) || []
  const centerOptions = useMemo(() => {
    const centers = loadingPoints.map((point: any) => point.centerName).filter(Boolean)
    return [...new Set(centers)].sort()
  }, [loadingPoints])

  const totalCount = data?.pagination?.totalCount || 0

  // Mutations
  const createMutation = useCreateFixedContract()
  const updateMutation = useUpdateFixedContract()
  const deleteMutation = useDeleteFixedContract()
  const toggleMutation = useToggleFixedContractStatus()

  // CRUD handlers
  const handleCreate = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setCreateModalOpen(false)
        refetch()
      }
    })
  }

  const handleUpdate = (data: any) => {
    if (!editingContract) return
    updateMutation.mutate({ id: editingContract.id, data }, {
      onSuccess: () => {
        setEditModalOpen(false)
        setEditingContract(null)
        refetch()
      }
    })
  }

  const handleToggleStatus = (id: string) => {
    toggleMutation.mutate(id, {
      onSuccess: () => refetch()
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('정말 이 고정계약을 삭제하시겠습니까?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => refetch()
      })
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/fixed-contracts/export')
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `고정계약_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('엑셀 파일이 다운로드되었습니다')
    } catch (error) {
      toast.error('다운로드에 실패했습니다')
    }
  }

  // Context menu items
  const getContextMenuItems = (contract: FixedContractResponse): ContextMenuItem[] => [
    {
      id: 'view',
      label: '상세 보기',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => {
        setDetailContract(contract)
        setDetailDrawerOpen(true)
      }
    },
    {
      id: 'edit',
      label: '수정',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => {
        setEditingContract(contract)
        setEditModalOpen(true)
      }
    },
    {
      id: 'copy',
      label: '정보 복사',
      icon: <Copy className="h-4 w-4" />,
      onClick: () => {
        const info = `${contract.loadingPoint?.centerName || '-'} - ${contract.routeName}\n` +
          `기사: ${contract.driver?.name || '미지정'}\n` +
          `운행요일: ${formatOperatingDays(contract.operatingDays)}\n` +
          `센터계약: ${CONTRACT_TYPE_LABELS[contract.centerContractType]} ${formatCurrency(contract.centerAmount)}`
        navigator.clipboard.writeText(info)
        toast.success('계약 정보가 복사되었습니다')
      }
    },
    {
      id: 'toggle',
      label: contract.isActive ? '비활성화' : '활성화',
      icon: contract.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
      onClick: () => handleToggleStatus(contract.id)
    }
  ]

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">데이터를 불러오는 중 오류가 발생했습니다</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-violet-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg">
                <Route className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">고정 관리</h1>
                <p className="text-lg text-gray-600 mt-1">고정계약 노선을 관리하세요</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setCreateModalOpen(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                계약 등록
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-violet-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">전체 계약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-violet-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">활성 계약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {contractsData.filter(c => c.isActive).length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-violet-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">비활성 계약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">
                {contractsData.filter(c => !c.isActive).length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-violet-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">기사 미지정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {contractsData.filter(c => !c.driverId).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="bg-white shadow-lg border-violet-200 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
                {/* Search Input */}
                <div className="max-w-xs">
                  <Input
                    placeholder="노선명, 센터명, 기사명 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 border-2 border-violet-300 focus:border-violet-500 focus:ring-violet-500/20 bg-white rounded-md"
                  />
                </div>
                
                {/* Center Filter */}
                <Select value={centerFilter} onValueChange={setCenterFilter}>
                  <SelectTrigger className="w-40 h-11 border-2 border-violet-300 focus:border-violet-500 bg-white">
                    <SelectValue placeholder="센터명" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {centerOptions.map((centerName) => (
                      <SelectItem key={centerName} value={centerName}>{centerName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 h-11 border-2 border-violet-300 focus:border-violet-500 bg-white">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>

                {/* Contract Type Filter */}
                <Select 
                  value={contractTypeFilter || 'all'} 
                  onValueChange={(value) => setContractTypeFilter(value === 'all' ? undefined : value as ContractType)}
                >
                  <SelectTrigger className="w-40 h-11 border-2 border-violet-300 focus:border-violet-500 bg-white">
                    <SelectValue placeholder="계약유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-3">
                {/* Action Buttons */}
                <Button
                  variant="outline"
                  onClick={() => setImportModalOpen(true)}
                  className="border-violet-300 text-violet-700 hover:bg-violet-100"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  가져오기
                </Button>

                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="border-violet-300 text-violet-700 hover:bg-violet-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  내보내기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-white shadow-lg border-violet-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mr-3"></div>
                <span className="text-gray-600">고정계약을 불러오는 중...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && contractsData.length === 0 && (
          <Card className="bg-white shadow-lg border-violet-200">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="mb-4">
                  <Route className="h-16 w-16 text-violet-400 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  등록된 고정계약이 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  새로운 고정계약을 등록하여 시작해보세요.
                </p>
                <Button 
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  계약 등록
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contracts List */}
        {!isLoading && contractsData.length > 0 && (
          <Card className="bg-white shadow-lg border-violet-200">
            <CardContent className="p-0">
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 px-6 py-4 border-b border-violet-100">
                <div className="text-sm text-gray-600">
                  총 {totalCount.toLocaleString()}개
                </div>
              </div>

              {/* Contract List */}
              <div className="divide-y divide-violet-100">
                {contractsData.map((contract: FixedContractResponse) => (
                  <ContextMenu
                    key={contract.id}
                    items={getContextMenuItems(contract)}
                    asChild
                  >
                    <div className={cn(
                      "p-6 hover:bg-violet-50/50 transition-colors cursor-pointer",
                      !contract.isActive && "bg-gray-50"
                    )}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          {/* First Line: Route Name and Center */}
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-semibold text-gray-900">
                              {contract.routeName}
                            </span>
                            <Badge variant="outline" className="border-violet-200 text-violet-700">
                              {contract.loadingPoint?.centerName || '센터 미지정'}
                            </Badge>
                            {!contract.isActive && (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                                비활성
                              </Badge>
                            )}
                          </div>

                          {/* Second Line: Center Contract */}
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-600">센터계약:</span>
                              <span className="text-violet-600 font-medium ml-1">
                                {CONTRACT_TYPE_LABELS[contract.centerContractType]}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-600">센터금액:</span>
                              <span className="text-gray-900 font-semibold ml-1">
                                {formatCurrency(contract.centerAmount)}
                              </span>
                            </div>
                          </div>

                          {/* Third Line: Driver Info */}
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center">
                              <Truck className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-600">기사:</span>
                              <span className="text-gray-900 font-medium ml-1">
                                {contract.driver?.name || '미지정'}
                              </span>
                              {(contract.driver?.vehicleNumber || contract.driver?.phone) && (
                                <span className="text-gray-600 ml-2">
                                  ({[
                                    contract.driver?.vehicleNumber,
                                    contract.driver?.phone ? formatPhoneNumber(contract.driver.phone) : null
                                  ].filter(Boolean).join(' / ')})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Fourth Line: Driver Contract */}
                          {(contract.driverContractType || contract.driverAmount) && (
                            <div className="flex items-center space-x-4 text-sm">
                              {contract.driverContractType && (
                                <div className="flex items-center">
                                  <UserCheck className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-gray-600">기사계약:</span>
                                  <span className="text-indigo-600 font-medium ml-1">
                                    {CONTRACT_TYPE_LABELS[contract.driverContractType]}
                                  </span>
                                </div>
                              )}
                              {contract.driverAmount != null && (
                                <div className="flex items-center">
                                  <span className="text-gray-600">기사금액:</span>
                                  <span className="text-gray-900 font-semibold ml-1">
                                    {formatCurrency(contract.driverAmount)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Fifth Line: Operating Days */}
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-600">운행:</span>
                              <span className="text-gray-900 font-medium ml-1">
                                {formatOperatingDays(contract.operatingDays)}
                              </span>
                            </div>
                          </div>

                          {/* Sixth Line: Date Range */}
                          {(contract.startDate || contract.endDate) && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 text-gray-400 mr-2" />
                              <span>
                                {contract.startDate ? formatDate(contract.startDate) : '시작일 미정'}
                                {contract.endDate && ` ~ ${formatDate(contract.endDate)}`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDetailContract(contract)
                              setDetailDrawerOpen(true)
                            }}
                            className="border-violet-200 text-violet-600 hover:bg-violet-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingContract(contract)
                              setEditModalOpen(true)
                            }}
                            className="border-violet-200 text-violet-600 hover:bg-violet-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </ContextMenu>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Modal */}
        <ImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          type="fixed-contracts"
          onSuccess={() => {
            refetch()
          }}
        />

        {/* Create Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>고정계약 등록</DialogTitle>
            </DialogHeader>
            <FixedContractForm
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
              onCancel={() => setCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>고정계약 수정</DialogTitle>
            </DialogHeader>
            <FixedContractForm
              fixedContract={editingContract}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
              onCancel={() => {
                setEditModalOpen(false)
                setEditingContract(null)
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Detail Drawer */}
        <FixedContractDetailDrawer
          contract={detailContract}
          isOpen={detailDrawerOpen}
          onClose={() => {
            setDetailDrawerOpen(false)
            setDetailContract(null)
          }}
          onEdit={() => {
            if (detailContract) {
              setEditingContract(detailContract)
              setEditModalOpen(true)
              setDetailDrawerOpen(false)
              setDetailContract(null)
            }
          }}
          onCall={(phone: string) => {
            window.open(`tel:${phone}`, '_self')
          }}
        />
      </div>
    </div>
  )
}