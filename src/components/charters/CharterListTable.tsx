'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { CharterRequestResponse } from '@/lib/services/charter.service'
import { useDeleteCharter } from '@/hooks/useCharters'
import { hasPermission } from '@/lib/auth/rbac'
import { UserRole } from '@prisma/client'
import { 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  MapPin,
  User,
  Truck,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'

interface CharterListTableProps {
  data?: {
    charterRequests: CharterRequestResponse[]
    totalCount: number
    pagination: {
      page: number
      limit: number
      totalCount: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
  isLoading?: boolean
  error?: Error | null
  onPageChange?: (page: number) => void
  onRefresh?: () => void
  userRole?: UserRole
  className?: string
}

export function CharterListTable({
  data,
  isLoading,
  error,
  onPageChange,
  onRefresh,
  userRole,
  className
}: CharterListTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const deleteMutation = useDeleteCharter()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const formatDate = (date: string | Date) => {
    return dayjs(date).format('MM/DD')
  }

  const formatDateTime = (date: string | Date) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm')
  }

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!data?.charterRequests) return null

    const requests = data.charterRequests
    const totalRevenue = requests.reduce((sum, req) => sum + req.totalFare, 0)
    const totalCost = requests.reduce((sum, req) => sum + req.driverFare, 0)
    const totalMargin = totalRevenue - totalCost
    const negotiatedCount = requests.filter(req => req.isNegotiated).length

    return {
      count: requests.length,
      totalRevenue,
      totalCost,
      totalMargin,
      negotiatedCount,
      averageMargin: requests.length > 0 ? totalMargin / requests.length : 0
    }
  }, [data])

  const canEdit = userRole && hasPermission(userRole, 'charters', 'update')
  const canDelete = userRole && hasPermission(userRole, 'charters', 'delete')

  const handleView = (id: string) => {
    router.push(`/charters/${id}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/charters/${id}/edit`)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteMutation.mutateAsync(deleteId)
      setDeleteId(null)
      onRefresh?.()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || '삭제 중 오류가 발생했습니다')
    }
  }

  // Enhanced status badge rendering
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            대기중
          </Badge>
        )
      case 'assigned':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">
            <User className="h-3 w-3 mr-1" />
            배정됨
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
            <Truck className="h-3 w-3 mr-1" />
            운송중
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            완료
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            취소
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            알수없음
          </Badge>
        )
    }
  }

  // Loading state with enhanced design
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Loading Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="animate-pulse h-8 w-8 bg-green-200 rounded-lg"></div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        
        {/* Loading Table */}
        <div className="bg-white border border-green-100 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-green-100">
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="divide-y divide-green-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Enhanced error state
  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-red-900">데이터 로딩 오류</h3>
                <p className="text-red-700 max-w-md mx-auto">
                  용차 데이터를 불러오는 중 오류가 발생했습니다: {error.message}
                </p>
              </div>
              {onRefresh && (
                <div className="flex justify-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={onRefresh}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    다시 시도
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => window.location.reload()}
                    className="text-red-700 hover:bg-red-100"
                  >
                    페이지 새로고침
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Enhanced empty state
  if (!data?.charterRequests || data.charterRequests.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-12">
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <Truck className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-green-900">용차 요청이 없습니다</h3>
                <p className="text-green-700 max-w-md mx-auto">
                  아직 등록된 용차 요청이 없습니다. 새로운 용차 요청을 등록하여 운송 관리를 시작해보세요.
                </p>
              </div>
              <div className="flex justify-center space-x-3">
                <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">
                  <Truck className="h-4 w-4 mr-2" />
                  첫 번째 용차 등록
                </Button>
                <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100">
                  가이드 보기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Enhanced Data Table */}
      <div className="bg-white rounded-lg shadow-lg border border-green-100 overflow-hidden">
        {/* Modern Table Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-900">용차 목록</h2>
                <p className="text-sm text-green-600">전체 {data.totalCount.toLocaleString()}건의 용차 요청</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-800">{data.pagination.page}</div>
              <div className="text-sm text-green-600">/ {data.pagination.totalPages} 페이지</div>
            </div>
          </div>
        </div>

        {/* Enhanced Card-based List */}
        <div className="divide-y divide-green-50">

          {data.charterRequests.map((charter, index) => {
            const margin = (charter.totalFare || 0) - (charter.driverFare || 0)
            const destinations = charter.destinations?.sort((a, b) => a.order - b.order).map(d => d.region).join(', ') || '미지정'
            const statusBadge = getStatusBadge(undefined)
            
            return (
              <div 
                key={charter.id}
                className="group p-6 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 cursor-pointer border-l-4 border-transparent hover:border-green-400"
                onClick={() => handleView(charter.id)}
              >
                <div className="flex items-center justify-between">
                  {/* Left Section - Charter Info */}
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Status Icon */}
                    <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl group-hover:from-green-200 group-hover:to-emerald-200 transition-colors">
                      <Truck className="h-6 w-6 text-green-600" />
                    </div>
                    
                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {`출발지 → ${destinations}`}
                        </h3>
                        {statusBadge}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-green-500" />
                          <span>{formatDate(charter.date || charter.createdAt)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span className="truncate">{charter.center?.centerName || '매장'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-green-500" />
                          <span className="truncate">{charter.driver?.name || '미배정'}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-green-500" />
                          <Badge variant="outline" className="text-xs border-green-200">
                            {charter.vehicleType || '미지정'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Section - Financials & Actions */}
                  <div className="flex items-center space-x-6">
                    {/* Financial Info */}
                    <div className="text-right space-y-1 min-w-0">
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-sm text-gray-500">매출:</span>
                        <span className="font-bold text-green-600 text-lg">
                          {formatCurrency(charter.totalFare || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-sm text-gray-500">매입:</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(charter.driverFare || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-sm text-gray-500">마진:</span>
                        <span className={`font-bold ${
                          margin >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(margin)}
                        </span>
                      </div>
                      
                      {charter.isNegotiated && (
                        <div className="flex justify-end">
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                            협의금액
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Menu */}
                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(charter.id)}
                        className="h-9 w-9 p-0 hover:bg-green-100 hover:text-green-600 transition-colors"
                        title="상세보기"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(charter.id)}
                          className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(charter.id)}
                          className="h-9 w-9 p-0 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Enhanced Pagination */}
        {data.pagination.totalPages > 1 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-green-700">
                <span className="font-medium">{data.pagination.totalCount.toLocaleString()}건</span>
                <span>중</span>
                <span className="font-medium">
                  {((data.pagination.page - 1) * data.pagination.limit + 1).toLocaleString()}~
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.totalCount).toLocaleString()}건
                </span>
                <span>표시</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(data.pagination.page - 1)}
                  disabled={!data.pagination.hasPrev}
                  className="border-green-300 text-green-700 hover:bg-green-100 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  이전
                </Button>
                
                <div className="flex items-center space-x-1">
                  <span className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium">
                    {data.pagination.page}
                  </span>
                  <span className="text-green-600">/</span>
                  <span className="text-green-800 font-medium">{data.pagination.totalPages}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(data.pagination.page + 1)}
                  disabled={!data.pagination.hasNext}
                  className="border-green-300 text-green-700 hover:bg-green-100 disabled:opacity-50"
                >
                  다음
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              용차 삭제 확인
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              선택한 용차 요청을 영구적으로 삭제하시겠습니까?
              <br />
              <strong className="text-red-600">이 작업은 되돌릴 수 없습니다.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleteMutation.isPending}
              className="flex-1 border-gray-300 hover:bg-gray-50"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>삭제 중...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>영구 삭제</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}