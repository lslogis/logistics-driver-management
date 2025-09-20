'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  ArrowLeft,
  EditIcon, 
  CopyIcon, 
  PrinterIcon, 
  FileTextIcon, 
  TrashIcon, 
  PlusIcon,
  PhoneIcon,
  TruckIcon,
  ClockIcon,
  MapPinIcon,
  CalendarIcon,
  DollarSignIcon,
  RefreshCcw,
  UserIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Request } from '@/types'
import { DriverAssignmentForm } from '@/components/forms/DriverAssignmentForm'
import { calculateProfitability } from '@/lib/services/profitability.service'

interface RequestDetailProps {
  request: Request
  onBack: () => void
  onEdit: (request: Request) => void
  onRefresh: (requestId: string) => void
  isLoading?: boolean
}

export function RequestDetail({ 
  request, 
  onBack,
  onEdit, 
  onRefresh,
  isLoading 
}: RequestDetailProps) {
  const [showDriverAssignment, setShowDriverAssignment] = useState(false)

  const handleDriverAssignment = async (updatedRequest: Request) => {
    setShowDriverAssignment(false)
    // 새로고침으로 최신 데이터 반영
    onRefresh(updatedRequest.id)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원'
  }

  // Calculate financial summary using profitability service
  const profitability = calculateProfitability(request)
  const centerBilling = profitability.centerBilling
  const driverFee = profitability.driverFee
  const totalMargin = profitability.margin
  const marginPercentage = profitability.marginRate
  const overallMarginStatus = {
    label: profitability.statusLabel,
    color: profitability.statusColor
  }
  
  // Check if driver is assigned
  const hasDriverAssigned = !!(request.driverId || request.driverName)

  return (
    <div className="space-y-6">
      {/* Header with Back Button and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <TruckIcon className="h-8 w-8 text-white" />
              </div>
              용차 요청 상세
            </h1>
            <p className="text-lg text-purple-700 ml-16 font-medium">
              #{request.id.slice(-8)} · {formatDate(request.requestDate)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onRefresh(request.id)}
            disabled={isLoading}
            className="border-2 border-gray-300 hover:border-gray-400 text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <RefreshCcw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
            새로고침
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(request)}
            className="border-2 border-violet-300 text-violet-700 hover:bg-violet-50 hover:border-violet-400 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <EditIcon className="h-4 w-4 mr-1" />
            수정
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <CopyIcon className="h-4 w-4 mr-1" />
            복사
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <PrinterIcon className="h-4 w-4 mr-1" />
            인쇄
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="border-2 border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            삭제
          </Button>
        </div>
      </div>

      {/* Request Information Card */}
      <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-purple-100 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 rounded-t-3xl p-6">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg">
              <span className="text-xl text-white">📋</span>
            </div>
            요청 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Loading Point Information */}
          {request.loadingPoint && (
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-md">
                  <MapPinIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-violet-800">상차지 정보</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-violet-600 mb-1">센터명</div>
                  <div className="text-lg font-bold text-violet-800">
                    {request.loadingPoint.centerName}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-violet-600 mb-1">상차지명</div>
                  <div className="text-lg font-bold text-violet-800">
                    {request.loadingPoint.loadingPointName}
                  </div>
                </div>
                {request.loadingPoint.lotAddress && (
                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-violet-600 mb-1">주소</div>
                    <div className="text-base text-violet-700">
                      {request.loadingPoint.lotAddress}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="h-4 w-4 text-violet-600" />
                <div className="text-sm font-medium text-violet-600">배송일</div>
              </div>
              <div className="text-lg font-bold text-violet-900">{formatDate(request.requestDate)}</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TruckIcon className="h-4 w-4 text-purple-600" />
                <div className="text-sm font-medium text-purple-600">노선번호</div>
              </div>
              <div className="text-lg font-bold text-purple-900">{request.centerCarNo || '미지정'}</div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border-2 border-indigo-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <DollarSignIcon className="h-4 w-4 text-indigo-600" />
                <div className="text-sm font-medium text-indigo-600">차량톤수</div>
              </div>
              <div className="text-lg font-bold text-indigo-900">{request.vehicleTon}톤</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MapPinIcon className="h-4 w-4 text-purple-600" />
                <div className="text-sm font-medium text-purple-600">착지수</div>
              </div>
              <div className="text-lg font-bold text-purple-900">{request.stops}개</div>
            </div>
          </div>

          {/* Regions */}
          <div>
            <div className="text-sm font-medium text-violet-700 mb-3 font-semibold">배송지역</div>
            <div className="flex flex-wrap gap-3">
              {request.regions.map((region, index) => (
                <Badge 
                  key={index} 
                  className="bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800 border-2 border-violet-200 px-4 py-2 text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  {index + 1}. {region}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          {request.notes && (
            <div>
              <div className="text-sm font-medium text-violet-700 mb-2 font-semibold">메모</div>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-4 shadow-sm">
                <div className="text-gray-700 font-medium">{request.notes}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Information Card */}
      <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-t-3xl p-6">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
              <span className="text-xl text-white">💰</span>
            </div>
            요금 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Fare Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-bold text-blue-600 mb-2">기본운임</div>
              <div className="text-2xl font-bold text-blue-800">
                {formatCurrency(request.baseFare || 0)}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-bold text-emerald-600 mb-2">착지수당</div>
              <div className="text-2xl font-bold text-emerald-800">
                {formatCurrency(request.extraStopFee || 0)}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-bold text-violet-600 mb-2">지역운임</div>
              <div className="text-2xl font-bold text-violet-800">
                {formatCurrency(request.extraRegionFee || 0)}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-sm font-bold text-amber-600 mb-2">추가조정</div>
              <div className="text-2xl font-bold text-amber-800">
                {request.extraAdjustment && request.extraAdjustment !== 0 
                  ? `${request.extraAdjustment > 0 ? '+' : ''}${formatCurrency(request.extraAdjustment)}`
                  : '0원'
                }
              </div>
            </div>
          </div>

          {/* Total Billing */}
          <div className="bg-gradient-to-r from-violet-100 via-purple-100 to-indigo-100 border-2 border-violet-300 rounded-2xl p-8 text-center shadow-lg">
            <div className="text-lg font-bold text-violet-700 mb-3">센터 청구 총액</div>
            <div className="text-4xl font-bold text-violet-900 mb-2">
              {formatCurrency(centerBilling)}
            </div>
            <div className="text-sm text-violet-600 font-medium">필수 결제 금액</div>
          </div>

          {/* Adjustment Reason */}
          {request.extraAdjustment !== 0 && request.adjustmentReason && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-5 mt-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-amber-700">추가조정 사유:</span>
              </div>
              <div className="text-amber-800 font-medium">{request.adjustmentReason}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Assignment Information Card */}
      <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 rounded-t-3xl p-6">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <span className="text-xl text-white">🚛</span>
              </div>
              기사 배정 정보
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowDriverAssignment(true)}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:via-purple-700 hover:to-violet-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl"
            >
              {hasDriverAssigned ? (
                <>
                  <EditIcon className="h-4 w-4 mr-1" />
                  기사 수정
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  기사 배정
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!hasDriverAssigned ? (
            <div className="text-center py-12">
              <div className="p-6 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
                <UserIcon className="h-12 w-12 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text-violet-700 mb-3">기사가 배정되지 않았습니다</h3>
              <p className="text-purple-600 mb-6 font-medium">기사 배정 버튼을 클릭하여 운전자를 배정해보세요</p>
              <Button onClick={() => setShowDriverAssignment(true)} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl">
                <PlusIcon className="h-4 w-4 mr-2" />
                기사 배정하기
              </Button>
            </div>
          ) : (
            <div className="border-2 border-violet-200 rounded-2xl p-6 bg-gradient-to-r from-violet-50/50 to-purple-50/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">배정된 기사</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDriverAssignment(true)}
                    className="border-2 border-violet-300 text-violet-700 hover:bg-violet-50 hover:border-violet-400 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <EditIcon className="h-4 w-4 mr-1" />
                    수정
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Driver Info */}
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-700 mb-3">기사 정보</h5>
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{request.driverName || '이름 없음'}</span>
                    {request.driver && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        등록 기사
                      </Badge>
                    )}
                  </div>
                  {request.driverPhone && (
                    <div className="flex items-center gap-3">
                      <PhoneIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{request.driverPhone}</span>
                    </div>
                  )}
                  {request.driverVehicle && (
                    <div className="flex items-center gap-3">
                      <TruckIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{request.driverVehicle}</span>
                    </div>
                  )}
                  {request.deliveryTime && (
                    <div className="flex items-center gap-3">
                      <ClockIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{request.deliveryTime}</span>
                    </div>
                  )}
                  {request.dispatchedAt && (
                    <div className="text-sm text-gray-500">
                      배정일: {new Date(request.dispatchedAt).toLocaleString('ko-KR')}
                    </div>
                  )}
                </div>

                {/* Financial Info */}
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-700 mb-3">재무 정보</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">기사운임:</span>
                      <span className="font-semibold">{formatCurrency(driverFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">마진:</span>
                      <span className={cn("font-semibold", overallMarginStatus.color.split(' ')[0])}>
                        {formatCurrency(totalMargin)} ({marginPercentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Badge className={cn("w-full justify-center", overallMarginStatus.color)} variant="outline">
                      {overallMarginStatus.label}
                    </Badge>
                  </div>
                  {request.driverNotes && (
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-600 mb-1">기사 메모</div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {request.driverNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary Card */}
      <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-t-3xl p-6">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
              <span className="text-xl text-white">📊</span>
            </div>
            재무 요약
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className={cn("p-6 border-2 rounded-xl", overallMarginStatus.color)}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-sm font-medium opacity-75 mb-2">센터청구금액</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(centerBilling)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium opacity-75 mb-2">기사운임</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(driverFee)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium opacity-75 mb-2">총 마진</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalMargin)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium opacity-75 mb-2">마진율</div>
                <div className="text-2xl font-bold">
                  {marginPercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="text-center">
              <div className="text-xl font-bold mb-2">
                💎 {overallMarginStatus.label}
              </div>
              {totalMargin < 0 && (
                <div className="space-y-2">
                  <p className="text-sm">
                    ⚠️ 경고: 기사운임이 청구금액보다 높습니다
                  </p>
                  <p className="text-sm">
                    💡 제안: 추가 조정을 통해 청구금액을 늘리거나 기사운임을 조정하세요
                  </p>
                </div>
              )}
              {!hasDriverAssigned && (
                <div className="space-y-2">
                  <p className="text-sm">
                    ℹ️ 알림: 아직 기사가 배정되지 않았습니다
                  </p>
                  <p className="text-sm">
                    💡 제안: 기사를 배정하여 정확한 마진을 확인하세요
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Assignment Dialog */}
      <Dialog open={showDriverAssignment} onOpenChange={setShowDriverAssignment}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              {hasDriverAssigned ? '기사 정보 수정' : '기사 배정'}
            </DialogTitle>
          </DialogHeader>
          <DriverAssignmentForm
            request={request}
            onSuccess={handleDriverAssignment}
            onCancel={() => setShowDriverAssignment(false)}
            showProfitability={true}
            allowQuickAssign={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}