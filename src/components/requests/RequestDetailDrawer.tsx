'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  X,
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
  BarChart3,
  Target,
  TrendingUp,
  UserIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Request } from '@/types'
import { DriverAssignmentForm } from '@/components/forms/DriverAssignmentForm'
import { calculateProfitability } from '@/lib/services/profitability.service'

interface RequestDetailDrawerProps {
  request: Request | null
  isOpen: boolean
  onClose: () => void
  onEdit: (request: Request) => void
  onRefresh: (requestId: string) => void
  isLoading?: boolean
}

export function RequestDetailDrawer({ 
  request, 
  isOpen,
  onClose,
  onEdit, 
  onRefresh,
  isLoading 
}: RequestDetailDrawerProps) {
  const [showDriverAssignment, setShowDriverAssignment] = useState(false)

  if (!request) return null

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
    <div 
      className={cn(
        "absolute inset-0 z-[500] transition-all duration-300 ease-in-out",
        isOpen ? "visible" : "invisible"
      )}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-300",
          isOpen ? "opacity-50" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl transition-transform duration-300 ease-in-out overflow-hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TruckIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">용차 요청 상세</h2>
                <p className="text-emerald-100 text-sm">#{request.id.slice(-8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onRefresh(request.id)}
                disabled={isLoading}
                className="text-white hover:bg-white/20 p-2"
              >
                <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Compact Header Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-emerald-100 text-xs mb-1">요청일</div>
              <div className="font-bold">{formatDate(request.requestDate)}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-emerald-100 text-xs mb-1">센터명</div>
              <div className="font-bold truncate">{request.loadingPoint?.centerName || '미지정'}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-emerald-100 text-xs mb-1">노선/톤수</div>
              <div className="font-bold">{request.centerCarNo || '미지정'} / {request.vehicleTon}톤</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-emerald-100 text-xs mb-1">청구금액</div>
              <div className="font-bold">{formatCurrency(centerBilling)}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Core Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status & Progress */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-emerald-800">상태 요약</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-600">기사배정:</span>
                  <span className="font-bold">{hasDriverAssigned ? '완료' : '미배정'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">착지수:</span>
                  <span className="font-bold">{request.stops}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">지역수:</span>
                  <span className="font-bold">{request.regions.length}개</span>
                </div>
              </div>
            </div>
            
            {/* Financial Summary */}
            <div className={cn("border-2 rounded-xl p-4", overallMarginStatus.color)}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5" />
                <h3 className="font-bold">재무 요약</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>청구금액:</span>
                  <span className="font-bold">{formatCurrency(centerBilling)}</span>
                </div>
                <div className="flex justify-between">
                  <span>기사비용:</span>
                  <span className="font-bold">{formatCurrency(driverFee)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>마진율:</span>
                  <div className="text-right">
                    <div className="font-bold">{marginPercentage.toFixed(1)}%</div>
                    <div className="text-xs">{overallMarginStatus.label}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border-2 border-cyan-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <EditIcon className="h-5 w-5 text-cyan-600" />
                <h3 className="font-bold text-cyan-800">빠른 작업</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEdit(request)}
                  className="border-teal-300 text-teal-700 hover:bg-teal-50 text-xs p-2"
                >
                  <EditIcon className="h-3 w-3 mr-1" />
                  수정
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 text-xs p-2"
                >
                  <CopyIcon className="h-3 w-3 mr-1" />
                  복사
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-teal-300 text-teal-700 hover:bg-teal-50 text-xs p-2"
                >
                  <PrinterIcon className="h-3 w-3 mr-1" />
                  인쇄
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs p-2"
                >
                  <TrashIcon className="h-3 w-3 mr-1" />
                  삭제
                </Button>
              </div>
            </div>
          </div>

          {/* Compact Route & Location Info */}
          <Card className="border-emerald-100 shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-3">
                <MapPinIcon className="h-5 w-5 text-emerald-600" />
                상차지 & 요금 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Loading Point Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-teal-800 text-sm">상차지 정보</h4>
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-teal-600">센터명:</span>
                      <span className="font-bold text-teal-800">{request.loadingPoint?.centerName || '미지정'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-teal-600">상차지명:</span>
                      <span className="font-bold text-teal-800">{request.loadingPoint?.loadingPointName || '미지정'}</span>
                    </div>
                    {request.loadingPoint?.lotAddress && (
                      <div className="text-xs text-teal-600 pt-1 border-t border-teal-200">
                        {request.loadingPoint.lotAddress}
                      </div>
                    )}
                  </div>
                  
                  {/* Regions */}
                  <div>
                    <h5 className="text-sm font-medium text-teal-700 mb-2">배송지역 ({request.regions.length}개)</h5>
                    <div className="flex flex-wrap gap-1">
                      {request.regions.map((region, index) => (
                        <Badge 
                          key={index} 
                          className="bg-teal-100 text-teal-800 border border-teal-200 text-xs px-2 py-0.5"
                        >
                          {region}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Fare Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-emerald-800 text-sm">요금 상세</h4>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-600">기본운임:</span>
                      <span className="font-bold">{formatCurrency(request.baseFare || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-600">착지수당:</span>
                      <span className="font-bold">{formatCurrency(request.extraStopFee || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-600">지역운임:</span>
                      <span className="font-bold">{formatCurrency(request.extraRegionFee || 0)}</span>
                    </div>
                    {request.extraAdjustment !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-emerald-600">추가조정:</span>
                        <span className="font-bold">
                          {request.extraAdjustment > 0 ? '+' : ''}{formatCurrency(request.extraAdjustment)}
                        </span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-bold text-emerald-700">총 청구금액:</span>
                      <span className="font-bold text-emerald-800">{formatCurrency(centerBilling)}</span>
                    </div>
                  </div>
                  
                  {/* Adjustment Reason */}
                  {request.extraAdjustment !== 0 && request.adjustmentReason && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                      <div className="text-xs text-amber-700">
                        <span className="font-medium">조정사유:</span> {request.adjustmentReason}
                      </div>
                    </div>
                  )}
                  
                  {/* Notes */}
                  {request.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <div className="text-xs text-yellow-800">
                        <span className="font-medium">메모:</span> {request.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Driver Assignment Information */}
          <Card className="border-teal-100 shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-teal-600" />
                  기사 배정 정보
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setShowDriverAssignment(true)}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
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
            <CardContent className="p-4">
              {!hasDriverAssigned ? (
                <div className="text-center py-6">
                  <UserIcon className="h-12 w-12 text-teal-400 mx-auto mb-3" />
                  <p className="text-teal-600 mb-3 text-sm">기사가 배정되지 않았습니다</p>
                  <Button 
                    onClick={() => setShowDriverAssignment(true)} 
                    size="sm"
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    기사 배정하기
                  </Button>
                </div>
              ) : (
                <div className="border border-teal-200 rounded-lg p-3 bg-teal-50/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-teal-100 text-teal-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900">{request.driverName || '이름 없음'}</div>
                        <div className="text-xs text-gray-600">{request.driverPhone || '연락처 없음'}</div>
                      </div>
                      {request.driver && (
                        <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                          등록 기사
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDriverAssignment(true)}
                      className="h-7 px-2 text-xs text-teal-700 hover:bg-teal-100"
                    >
                      <EditIcon className="h-3 w-3 mr-1" />
                      수정
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center">
                      <div className="text-gray-600">차량정보</div>
                      <div className="font-medium">{request.driverVehicle || '미등록'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">기사운임</div>
                      <div className="font-medium">{formatCurrency(driverFee)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">마진율</div>
                      <div className={cn("font-medium", overallMarginStatus.color.split(' ')[0])}>
                        {marginPercentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {request.deliveryTime && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">배송시간:</span> {request.deliveryTime}
                    </div>
                  )}
                  
                  {request.driverNotes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                      <span className="font-medium">메모:</span> {request.driverNotes}
                    </div>
                  )}
                  
                  {request.dispatchedAt && (
                    <div className="mt-2 text-xs text-gray-500">
                      배정일: {new Date(request.dispatchedAt).toLocaleString('ko-KR')}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Analysis */}
          {hasDriverAssigned && (
            <Card className="border-teal-100 shadow-md">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  수익성 분석
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className={cn("p-4 border-2 rounded-xl", overallMarginStatus.color)}>
                  <div className="text-center mb-3">
                    <div className="text-2xl font-bold mb-1">{marginPercentage.toFixed(1)}%</div>
                    <div className="text-sm font-medium">{overallMarginStatus.label}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center">
                      <div className="text-xs opacity-75 mb-1">총수익</div>
                      <div className="font-bold">{formatCurrency(totalMargin)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs opacity-75 mb-1">청구금액</div>
                      <div className="font-bold">{formatCurrency(centerBilling)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs opacity-75 mb-1">기사비용</div>
                      <div className="font-bold">{formatCurrency(driverFee)}</div>
                    </div>
                  </div>
                  
                  {totalMargin < 0 && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      ⚠️ 손실 발생: 배차 조정 또는 요금 재검토가 필요합니다
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Compact Footer */}
        <div className="border-t border-teal-100 bg-teal-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => console.log('Copy request details')}
                className="text-teal-600 hover:bg-teal-100 text-xs"
              >
                <CopyIcon className="h-3 w-3 mr-1" />
                복사
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => console.log('Print request details')}
                className="text-teal-600 hover:bg-teal-100 text-xs"
              >
                <PrinterIcon className="h-3 w-3 mr-1" />
                인쇄
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                닫기
              </Button>
              <Button
                size="sm"
                onClick={() => onEdit(request)}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
              >
                <EditIcon className="h-4 w-4 mr-1" />
                수정
              </Button>
            </div>
          </div>
        </div>
      </div>

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