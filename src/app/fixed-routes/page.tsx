'use client'

import React, { useState, useMemo } from 'react'
import { 
  Route, 
  Calendar, 
  CheckCircle, 
  TrendingUp, 
  Plus, 
  RefreshCw, 
  Upload, 
  Download, 
  Filter, 
  Search,
  MapPin,
  Users,
  Clock,
  Target
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { useAuth } from '@/hooks/useAuth'
import { 
  FixedContractResponse, 
  CreateFixedContractRequest, 
  UpdateFixedContractRequest 
} from '@/lib/validations/fixedContract'
import { 
  useFixedContracts,
  useCreateFixedContract,
  useUpdateFixedContract,
  useDeleteFixedContract,
  useToggleFixedContractStatus,
  useLoadingPointsForContracts
} from '@/hooks/useFixedContracts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { copyToClipboard, formatFixedContractInfo, sendSMS, shareToKakao, makePhoneCall } from '@/lib/utils/share'
import ManagementPageTemplate from '@/components/templates/ManagementPageTemplate'
import { getFixedContractColumns, getFixedContractContextMenuItems, FixedContractItem } from '@/components/templates/FixedContractsTemplateConfig'
import RegisterFixedContractModal from '@/components/forms/RegisterFixedContractModal'
import FixedRoutesTable from '@/components/fixedRoutes/FixedRoutesTable'
import RoutePerformanceWidget from '@/components/fixedRoutes/RoutePerformanceWidget'
import RouteScheduleWidget from '@/components/fixedRoutes/RouteScheduleWidget'
import RouteMapView from '@/components/fixedRoutes/RouteMapView'
import { ImportModal } from '@/components/import'
import { cn } from '@/lib/utils'

export default function FixedRoutesPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingFixedContract, setEditingFixedContract] = useState<FixedContractResponse | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)

  // Data fetching
  const { 
    data, 
    isLoading, 
    error,
    refetch,
    isFetching
  } = useFixedContracts({
    search: searchTerm,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
  })
  
  const fixedContractsData = (data as any)?.contracts || []
  const totalCount = (data as any)?.pagination?.totalCount || 0
  
  // Fetch all fixed routes for statistics
  const allRoutesQuery = useFixedContracts({ limit: 1000 })
  const allRoutesData = (allRoutesQuery.data as any)?.contracts || []
  
  // Statistics calculation
  const stats = useMemo(() => {
    const totalRoutes = allRoutesData.length
    const activeRoutes = allRoutesData.filter((route: any) => route.isActive).length
    
    // 이번 달 운행 횟수 (operatingDays 기준으로 추정)
    const thisMonth = new Date()
    const daysInMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0).getDate()
    const thisMonthOperations = allRoutesData
      .filter((route: any) => route.isActive && route.operatingDays)
      .reduce((sum: number, route: any) => {
        // operatingDays가 문자열 또는 배열인 경우 모두 처리
        const days = Array.isArray(route.operatingDays)
          ? route.operatingDays
          : (typeof route.operatingDays === 'string'
              ? route.operatingDays.split(',').map((day: string) => day.trim()).filter(Boolean)
              : [])
        const avgDaysPerWeek = days.length
        const weeksInMonth = Math.ceil(daysInMonth / 7)
        return sum + (avgDaysPerWeek * weeksInMonth)
      }, 0)

    // 노선별 평균 수익 (활성 노선들의 월 평균)
    const averageRevenue = allRoutesData
      .filter((route: any) => route.isActive && route.monthlyOperatingCost)
      .reduce((sum: number, route: any, _index: number, arr: any[]) => {
        return sum + (Number(route.monthlyOperatingCost) / arr.length)
      }, 0)

    return {
      total: totalRoutes,
      active: activeRoutes,
      thisMonthOperations: Math.round(thisMonthOperations),
      averageRevenue: Math.round(averageRevenue)
    }
  }, [allRoutesData])

  // Mock performance data for widgets
  const performanceData = useMemo(() => {
    return allRoutesData.slice(0, 5).map((route: any, index: number) => ({
      routeId: route.id,
      routeName: route.routeName,
      monthlyRevenue: Math.floor(Math.random() * 500000) + 1000000,
      operationsCount: Math.floor(Math.random() * 50) + 20,
      efficiency: Math.floor(Math.random() * 30) + 70,
      profitMargin: Math.floor(Math.random() * 25) + 10,
      driverSatisfaction: Math.floor(Math.random() * 2) + 4,
      onTimeRate: Math.floor(Math.random() * 20) + 80,
      costPerOperation: Math.floor(Math.random() * 50000) + 100000,
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
      trendPercentage: Math.floor(Math.random() * 20) + 5
    }))
  }, [allRoutesData])

  // Mock schedule data for widgets
  const scheduleData = useMemo(() => {
    return allRoutesData.map((route: any) => ({
      routeId: route.id,
      routeName: route.routeName,
      driverName: route.driver?.name,
      loadingPointName: route.loadingPoint?.name,
      operatingDays: Array.isArray(route.operatingDays)
        ? route.operatingDays.join(',')
        : route.operatingDays || 'MON,TUE,WED,THU,FRI',
      startTime: '09:00',
      endTime: '18:00',
      status: route.isActive ? 'active' : 'inactive',
      isActive: route.isActive
    }))
  }, [allRoutesData])

  // Mock map data for widgets
  const mapData = useMemo(() => {
    return allRoutesData.map((route: any) => ({
      routeId: route.id,
      routeName: route.routeName,
      waypoints: [
        {
          id: `${route.id}-origin`,
          name: route.loadingPoint?.name || '출발지',
          type: 'origin' as const,
          coordinates: [37.5665 + Math.random() * 0.1, 126.9780 + Math.random() * 0.1] as [number, number],
          estimatedTime: '09:00'
        },
        {
          id: `${route.id}-waypoint`,
          name: '경유지',
          type: 'waypoint' as const,
          coordinates: [37.5665 + Math.random() * 0.1, 126.9780 + Math.random() * 0.1] as [number, number],
          estimatedTime: '12:00'
        },
        {
          id: `${route.id}-destination`,
          name: '도착지',
          type: 'destination' as const,
          coordinates: [37.5665 + Math.random() * 0.1, 126.9780 + Math.random() * 0.1] as [number, number],
          estimatedTime: '18:00'
        }
      ],
      driverName: route.driver?.name,
      status: route.isActive ? 'active' : 'inactive',
      operatingDays: Array.isArray(route.operatingDays)
        ? route.operatingDays.join(',')
        : route.operatingDays || 'MON,TUE,WED,THU,FRI',
      distance: Math.floor(Math.random() * 100) + 50,
      estimatedDuration: Math.floor(Math.random() * 120) + 60
    }))
  }, [allRoutesData])
  
  // Mutations
  const createMutation = useCreateFixedContract()
  const updateMutation = useUpdateFixedContract()
  const deleteMutation = useDeleteFixedContract()
  const toggleMutation = useToggleFixedContractStatus()
  
  // Loading points for form
  const { data: loadingPointsData } = useLoadingPointsForContracts()
  const loadingPoints = loadingPointsData || []
  
  // Filter data based on search
  const filteredRoutesData = useMemo(() => {
    return fixedContractsData.filter((route: any) => {
      const matchesSearch = !searchTerm || 
        route.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.loadingPoint?.name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && route.isActive) ||
        (statusFilter === 'inactive' && !route.isActive)

      return matchesSearch && matchesStatus
    })
  }, [fixedContractsData, searchTerm, statusFilter])

  // Convert FixedContractResponse to FixedContractItem for template
  const templateData: FixedContractItem[] = fixedContractsData.map((contract: any) => ({
    id: contract.id,
    routeName: contract.routeName,
    centerContractType: (contract as any).centerContractType,
    driverContractType: (contract as any).driverContractType,
    operatingDays: contract.operatingDays,
    driver: contract.driver,
    loadingPoint: contract.loadingPoint,
    centerAmount: (contract as any).centerAmount ? Number((contract as any).centerAmount) : undefined,
    driverAmount: (contract as any).driverAmount ? Number((contract as any).driverAmount) : undefined,
    monthlyOperatingCost: contract.monthlyOperatingCost ? Number(contract.monthlyOperatingCost) : undefined,
    dailyOperatingCost: contract.dailyOperatingCost ? Number(contract.dailyOperatingCost) : undefined,
    startDate: contract.startDate,
    endDate: contract.endDate,
    remarks: contract.remarks,
    isActive: contract.isActive,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt
  }))

  // CRUD handlers
  const handleCreate = async (data: CreateFixedContractRequest) => {
    return new Promise<void>((resolve, reject) => {
      createMutation.mutate(data, {
        onSuccess: () => {
          setCreateModalOpen(false)
          resolve()
        },
        onError: (error) => reject(error)
      })
    })
  }

  const handleUpdate = async (id: string, data: UpdateFixedContractRequest) => {
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate({ id, data }, {
        onSuccess: () => {
          setEditModalOpen(false)
          setEditingFixedContract(null)
          resolve()
        },
        onError: (error) => reject(error)
      })
    })
  }

  const handleActivate = (id: string) => {
    toggleMutation.mutate(id)
  }

  const handleDeactivate = (id: string) => {
    toggleMutation.mutate(id)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  // Handle refresh
  const handleRefresh = () => {
    refetch()
    allRoutesQuery.refetch()
    toast.success('데이터를 새로고침했습니다')
  }

  // Handle new route creation
  const handleCreateRoute = () => {
    setCreateModalOpen(true)
  }

  // Context menu handlers
  const handleCopyFixedContract = async (item: FixedContractItem) => {
    const contractInfo = formatFixedContractInfo(item as any)
    const success = await copyToClipboard(contractInfo)
    if (success) {
      toast.success('고정노선 정보가 클립보드에 복사되었습니다')
    } else {
      toast.error('클립보드 복사에 실패했습니다')
    }
  }

  const handleShareToKakao = async (item: FixedContractItem) => {
    try {
      const contractInfo = formatFixedContractInfo(item as any)
      await shareToKakao(`고정계약 정보 - ${item.routeName}`, contractInfo)
      toast.success('카카오톡으로 공유되었습니다')
    } catch (error) {
      console.error('카카오톡 공유 실패:', error)
      toast.error('카카오톡 공유에 실패했습니다')
    }
  }

  const handleSendSMS = (item: FixedContractItem) => {
    try {
      const phone = item.driver?.phone
      if (!phone) {
        toast.error('기사의 연락처가 없습니다')
        return
      }
      const contractInfo = formatFixedContractInfo(item as any)
      sendSMS(phone, contractInfo)
      toast.success('SMS 앱이 실행되었습니다')
    } catch (error) {
      console.error('SMS 발송 실패:', error)
      toast.error('SMS 발송에 실패했습니다')
    }
  }

  const handlePhoneCall = (item: FixedContractItem, phoneNumber: string) => {
    try {
      makePhoneCall(phoneNumber)
    } catch (error) {
      console.error('전화 걸기 실패:', error)
      toast.error('전화 걸기에 실패했습니다')
    }
  }

  const handleEditFixedContract = (item: FixedContractItem) => {
    setEditingFixedContract(fixedContractsData.find((fc: any) => fc.id === item.id) || null)
    setEditModalOpen(true)
  }

  // Context menu items generator
  const getContextMenuItems = (item: FixedContractItem) => {
    return getFixedContractContextMenuItems(item, {
      onCopy: handleCopyFixedContract,
      onKakaoShare: handleShareToKakao,
      onSendSMS: handleSendSMS,
      onPhoneCall: handlePhoneCall,
      onEdit: handleEditFixedContract,
      onActivate: handleActivate,
      onDeactivate: handleDeactivate,
      onDelete: handleDelete
    })
  }

  // Handle loading state
  if (allRoutesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-indigo-600 font-medium">고정노선 데이터를 불러오는 중...</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
          >
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl shadow-lg">
                <Route className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">고정노선 관리</h1>
                <p className="text-lg text-gray-600 mt-1">정기 운송 노선을 체계적으로 관리하세요</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isFetching}
                className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
              
              <PermissionGate resource="fixed-contracts" action="create">
                <Button
                  onClick={handleCreateRoute}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  새 고정노선 등록
                </Button>
              </PermissionGate>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">전체 고정노선</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.total.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">개 노선</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl">
                  <Route className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-violet-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-600">활성 노선</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.active.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">개 운행 중</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">이번 달 운행</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.thisMonthOperations.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">회 운행</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">노선별 평균 수익</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {(stats.averageRevenue / 10000).toLocaleString()}만원
                  </p>
                  <p className="text-xs text-gray-500 mt-1">월 평균</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="bg-white shadow-lg border-indigo-100 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
                {/* Search Input */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="노선명, 기사명, 상차지로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 border-2 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400/20 bg-white"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 h-11 border-2 border-indigo-200 focus:border-indigo-400 bg-white">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 상태</SelectItem>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <PermissionGate resource="fixed-contracts" action="export">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const params = new URLSearchParams()
                        if (searchTerm) params.append('search', searchTerm)
                        if (statusFilter === 'active') params.append('isActive', 'true')
                        if (statusFilter === 'inactive') params.append('isActive', 'false')
                        
                        const response = await fetch(`/api/fixed-contracts/export?${params.toString()}`)
                        
                        if (!response.ok) {
                          throw new Error('Export failed')
                        }
                        
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `fixed-routes-${new Date().toISOString().split('T')[0]}.xlsx`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                        
                        toast.success('엑셀 파일이 다운로드되었습니다')
                      } catch (error) {
                        console.error('Export error:', error)
                        toast.error('엑셀 내보내기에 실패했습니다')
                      }
                    }}
                    className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <Download className="h-4 w-4" />
                    내보내기
                  </Button>
                </PermissionGate>

                <PermissionGate resource="fixed-contracts" action="import">
                  <Button
                    variant="outline"
                    onClick={() => setImportModalOpen(true)}
                    className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <Upload className="h-4 w-4" />
                    가져오기
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Performance Widget */}
          <div className="xl:col-span-2">
            <RoutePerformanceWidget
              data={performanceData}
              isLoading={allRoutesQuery.isLoading}
            />
          </div>

          {/* Schedule Widget */}
          <div className="xl:col-span-1">
            <RouteScheduleWidget
              data={scheduleData}
              isLoading={allRoutesQuery.isLoading}
            />
          </div>
        </div>

        {/* Map View Dashboard */}
        <div className="mb-8">
          <RouteMapView
            data={mapData}
            isLoading={allRoutesQuery.isLoading}
            selectedRouteId={selectedRouteId || undefined}
            onRouteSelect={setSelectedRouteId}
          />
        </div>

        {/* Data Table */}
        <Card className="bg-white shadow-lg border-indigo-100">
          <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <Filter className="h-5 w-5" />
                고정노선 목록
                <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700">
                  {filteredRoutesData.length}개
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <FixedRoutesTable
              data={filteredRoutesData}
              isLoading={isLoading}
              onEdit={(route) => {
                const contract = fixedContractsData.find((c: any) => c.id === route.id)
                setEditingFixedContract(contract || null)
                setEditModalOpen(true)
              }}
              onDelete={handleDelete}
              onToggleStatus={handleActivate}
              onCopy={async (route) => {
                const contractInfo = formatFixedContractInfo(route as any)
                const success = await copyToClipboard(contractInfo)
                if (success) {
                  toast.success('고정노선 정보가 클립보드에 복사되었습니다')
                } else {
                  toast.error('클립보드 복사에 실패했습니다')
                }
              }}
              onShare={async (route) => {
                try {
                  const contractInfo = formatFixedContractInfo(route as any)
                  await shareToKakao(`고정노선 정보 - ${route.routeName}`, contractInfo)
                  toast.success('카카오톡으로 공유되었습니다')
                } catch (error) {
                  console.error('카카오톡 공유 실패:', error)
                  toast.error('카카오톡 공유에 실패했습니다')
                }
              }}
              onCall={(phone) => {
                try {
                  makePhoneCall(phone)
                } catch (error) {
                  console.error('전화 걸기 실패:', error)
                  toast.error('전화 걸기에 실패했습니다')
                }
              }}
              onMessage={(route) => {
                try {
                  const phone = route.driver?.phone
                  if (!phone) {
                    toast.error('기사의 연락처가 없습니다')
                    return
                  }
                  const contractInfo = formatFixedContractInfo(route as any)
                  sendSMS(phone, contractInfo)
                  toast.success('SMS 앱이 실행되었습니다')
                } catch (error) {
                  console.error('SMS 발송 실패:', error)
                  toast.error('SMS 발송에 실패했습니다')
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Create Modal */}
      <RegisterFixedContractModal 
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
        loadingPoints={loadingPoints}
      />

      {/* Edit Modal */}
      {editingFixedContract && (
        <RegisterFixedContractModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setEditingFixedContract(null)
          }}
          onSubmit={(data) => handleUpdate(editingFixedContract.id, data)}
          isLoading={updateMutation.isPending}
          loadingPoints={loadingPoints}
          editData={editingFixedContract}
        />
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        type="fixed-contracts"
        onSuccess={() => {
          handleRefresh()
        }}
      />
    </div>
  )
}
