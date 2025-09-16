'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useCharterById, useDeleteCharter } from '@/hooks/useCharters'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission } from '@/lib/auth/rbac'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  Truck, 
  User, 
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import dayjs from 'dayjs'

export default function CharterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const charterId = params.id as string
  const { data: charter, isLoading, error } = useCharterById(charterId)
  const deleteMutation = useDeleteCharter()

  const canEdit = user?.role && hasPermission(user.role, 'charters', 'update')
  const canDelete = user?.role && hasPermission(user.role, 'charters', 'delete')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const formatDate = (date: string | Date) => {
    return dayjs(date).format('YYYY년 MM월 DD일')
  }

  const formatDateTime = (date: string | Date) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
  }

  const handleEdit = () => {
    router.push(`/charters/${charterId}/edit`)
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(charterId)
      toast.success('용차가 삭제되었습니다')
      router.push('/charters')
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || '삭제 중 오류가 발생했습니다')
    } finally {
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !charter) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">용차를 찾을 수 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error?.message || '요청하신 용차가 존재하지 않거나 권한이 없습니다.'}
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push('/charters')}>
              목록으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const margin = charter.totalFare - charter.driverFare
  const destinations = charter.destinations.sort((a: any, b: any) => a.order - b.order)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">용차 상세</h1>
            <p className="text-gray-600 mt-1">
              {formatDate(charter.date)} · {charter.center.centerName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {canEdit && (
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              수정
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">운행일</div>
                      <div className="font-medium">{formatDate(charter.date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">센터</div>
                      <div className="font-medium">{charter.center.centerName}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">차량 타입</div>
                      <Badge variant="outline" className="mt-1">{charter.vehicleType}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">기사</div>
                      <div className="font-medium">{charter.driver.name}</div>
                      <div className="text-sm text-gray-500">{charter.driver.phone}</div>
                      <div className="text-sm text-gray-500">{charter.driver.vehicleNumber}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">콜 수</div>
                      <Badge variant="secondary" className="mt-1">
                        {destinations.length}개 목적지
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destinations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                목적지 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {destinations.map((destination: any, index: number) => (
                  <div key={destination.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-medium text-sm">
                      {destination.order}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{destination.region}</div>
                      <div className="text-sm text-gray-500">
                        {index === 0 ? '첫 번째 목적지' : `${index + 1}번째 목적지`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {charter.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  메모
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{charter.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                요금 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Negotiated fare indicator */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">요금 유형</span>
                <Badge variant={charter.isNegotiated ? "destructive" : "default"}>
                  {charter.isNegotiated ? '협의금액' : '계산금액'}
                </Badge>
              </div>

              <Separator />

              {/* Fare breakdown */}
              {!charter.isNegotiated && (
                <>
                  <div className="space-y-3">
                    {(charter.baseFare || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">기본료</span>
                        <span>{formatCurrency(charter.baseFare || 0)}</span>
                      </div>
                    )}
                    {(charter.regionFare || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">지역료</span>
                        <span>{formatCurrency(charter.regionFare || 0)}</span>
                      </div>
                    )}
                    {(charter.stopFare || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">콜료</span>
                        <span>{formatCurrency(charter.stopFare || 0)}</span>
                      </div>
                    )}
                    {(charter.extraFare || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">기타료</span>
                        <span>{formatCurrency(charter.extraFare || 0)}</span>
                      </div>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Total amounts */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">받는 금액</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(charter.totalFare)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">주는 금액</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(charter.driverFare)}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between">
                  <span className="font-bold">마진</span>
                  <span className={`font-bold text-lg ${
                    margin >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(margin)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                등록 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">등록일시</div>
                  <div className="font-medium">{formatDateTime(charter.createdAt)}</div>
                </div>
                
                {charter.updatedAt !== charter.createdAt && (
                  <div>
                    <div className="text-sm text-gray-600">수정일시</div>
                    <div className="font-medium">{formatDateTime(charter.updatedAt)}</div>
                  </div>
                )}
                
                {charter.creator && (
                  <div>
                    <div className="text-sm text-gray-600">등록자</div>
                    <div className="font-medium">{charter.creator.name}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                상태
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">등록 완료</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                용차 요청이 성공적으로 등록되었습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>용차 삭제</DialogTitle>
            <DialogDescription>
              이 용차 요청을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}