'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DispatchForm } from './DispatchForm'
import { 
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
  DollarSignIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Request {
  id: string
  requestDate: string
  centerCarNo: string
  vehicleTon: number
  regions: string[]
  stops: number
  notes?: string
  extraAdjustment: number
  adjustmentReason?: string
  createdAt: string
  updatedAt: string
  dispatches: Dispatch[]
  financialSummary: {
    centerBilling: number
    totalDriverFees: number
    totalMargin: number
    marginPercentage: number
    dispatchCount: number
  }
}

interface Dispatch {
  id: string
  requestId: string
  driverId?: string
  driverName: string
  driverPhone: string
  driverVehicle: string
  deliveryTime?: string
  driverFee: number
  driverNotes?: string
  createdAt: string
  updatedAt: string
  driver?: {
    id: string
    name: string
    phone: string
    vehicleNumber: string
  }
}

interface RequestDetailProps {
  request: Request
  onEdit: () => void
  onCopy: () => void
  onDelete: () => void
  onAddDispatch: (data: any) => Promise<void>
  onEditDispatch: (dispatchId: string, data: any) => Promise<void>
  onDeleteDispatch: (dispatchId: string) => Promise<void>
  isLoading?: boolean
}

export function RequestDetail({ 
  request, 
  onEdit, 
  onCopy, 
  onDelete, 
  onAddDispatch, 
  onEditDispatch, 
  onDeleteDispatch,
  isLoading 
}: RequestDetailProps) {
  const [showAddDispatch, setShowAddDispatch] = useState(false)
  const [editingDispatch, setEditingDispatch] = useState<Dispatch | null>(null)

  const handleAddDispatch = async (data: any) => {
    await onAddDispatch(data)
    setShowAddDispatch(false)
  }

  const handleEditDispatch = async (data: any) => {
    if (editingDispatch) {
      await onEditDispatch(editingDispatch.id, data)
      setEditingDispatch(null)
    }
  }

  const handleDeleteDispatch = async (dispatchId: string) => {
    if (confirm('정말로 이 배차를 삭제하시겠습니까?')) {
      await onDeleteDispatch(dispatchId)
    }
  }

  const getMarginStatus = (marginPercentage: number) => {
    if (marginPercentage >= 40) return { label: '✅ 양호', color: 'text-green-600 bg-green-50 border-green-200' }
    if (marginPercentage >= 20) return { label: '⚠️ 보통', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' }
    if (marginPercentage >= 0) return { label: '⚠️ 낮음', color: 'text-orange-600 bg-orange-50 border-orange-200' }
    return { label: '❌ 손실', color: 'text-red-600 bg-red-50 border-red-200' }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원'
  }

  const overallMarginStatus = getMarginStatus(request.financialSummary.marginPercentage)

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">용차 요청 상세 #{request.id.slice(-8)}</h1>
          <p className="text-gray-600 mt-1">{formatDate(request.requestDate)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <EditIcon className="h-4 w-4 mr-1" />
            수정
          </Button>
          <Button variant="outline" size="sm" onClick={onCopy}>
            <CopyIcon className="h-4 w-4 mr-1" />
            복사
          </Button>
          <Button variant="outline" size="sm">
            <PrinterIcon className="h-4 w-4 mr-1" />
            인쇄
          </Button>
          <Button variant="outline" size="sm">
            <FileTextIcon className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600">
            <TrashIcon className="h-4 w-4 mr-1" />
            삭제
          </Button>
        </div>
      </div>

      {/* Request Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 요청 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">요청일</div>
                <div className="font-medium">{formatDate(request.requestDate)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TruckIcon className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">센터호차</div>
                <div className="font-medium">{request.centerCarNo}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSignIcon className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">차량톤수</div>
                <div className="font-medium">{request.vehicleTon}톤</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-600">착지수</div>
                <div className="font-medium">{request.stops}개</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2">배송지역</div>
            <div className="flex flex-wrap gap-2">
              {request.regions.map((region, index) => (
                <Badge key={index} variant="secondary">
                  {index + 1}. {region}
                </Badge>
              ))}
            </div>
          </div>

          {request.notes && (
            <div>
              <div className="text-sm text-gray-600 mb-1">메모</div>
              <div className="text-sm bg-gray-50 p-3 rounded border">
                {request.notes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fare Information */}
      <Card>
        <CardHeader>
          <CardTitle>💰 요금 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">센터청구</div>
              <div className="text-lg font-semibold text-blue-800">
                {formatCurrency(request.financialSummary.centerBilling)}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-600 mb-1">기사운임</div>
              <div className="text-lg font-semibold text-green-800">
                {formatCurrency(request.financialSummary.totalDriverFees)}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">총 마진</div>
              <div className="text-lg font-semibold text-purple-800">
                {formatCurrency(request.financialSummary.totalMargin)}
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm text-orange-600 mb-1">마진율</div>
              <div className="text-lg font-semibold text-orange-800">
                {request.financialSummary.marginPercentage.toFixed(1)}%
              </div>
            </div>
          </div>

          {request.extraAdjustment !== 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-yellow-600">추가조정:</span>
                  <span className="font-medium ml-2">
                    {request.extraAdjustment > 0 ? '+' : ''}{formatCurrency(request.extraAdjustment)}
                  </span>
                </div>
                <div className="text-sm text-yellow-600">
                  사유: {request.adjustmentReason}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispatch Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🚛 배차 정보
            <Button size="sm" onClick={() => setShowAddDispatch(true)}>
              <PlusIcon className="h-4 w-4 mr-1" />
              배차 추가
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {request.dispatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TruckIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>아직 배차가 등록되지 않았습니다</p>
              <p className="text-sm">배차 추가 버튼을 클릭하여 기사를 배정해보세요</p>
            </div>
          ) : (
            request.dispatches.map((dispatch, index) => {
              const margin = request.financialSummary.centerBilling - dispatch.driverFee
              const marginPercentage = request.financialSummary.centerBilling > 0 
                ? (margin / request.financialSummary.centerBilling) * 100 
                : 0
              const marginStatus = getMarginStatus(marginPercentage)

              return (
                <div key={dispatch.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">배차 #{index + 1}</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDispatch(dispatch)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDispatch(dispatch.id)}
                        className="text-red-600"
                      >
                        삭제
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{dispatch.driverName}</span>
                        <span className="text-gray-600">({dispatch.driverPhone})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TruckIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">{dispatch.driverVehicle}</span>
                      </div>
                      {dispatch.deliveryTime && (
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">{dispatch.deliveryTime}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600">운임:</span>
                        <span className="font-medium ml-2">{formatCurrency(dispatch.driverFee)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">마진:</span>
                        <span className={cn("font-medium ml-2", marginStatus.color.split(' ')[0])}>
                          {formatCurrency(margin)} ({marginPercentage.toFixed(1)}%)
                        </span>
                        <Badge className={cn("ml-2", marginStatus.color)} variant="outline">
                          {marginStatus.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {dispatch.driverNotes && (
                    <div className="text-sm bg-gray-50 p-2 rounded border">
                      메모: {dispatch.driverNotes}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>📊 재무 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("p-4 border rounded-lg", overallMarginStatus.color)}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
              <div className="text-center">
                <div className="text-sm opacity-75 mb-1">센터청구금액</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(request.financialSummary.centerBilling)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm opacity-75 mb-1">기사운임총액</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(request.financialSummary.totalDriverFees)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm opacity-75 mb-1">총 마진</div>
                <div className="text-lg font-semibold">
                  {formatCurrency(request.financialSummary.totalMargin)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm opacity-75 mb-1">마진율</div>
                <div className="text-lg font-semibold">
                  {request.financialSummary.marginPercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="text-center">
              <div className="text-lg font-semibold">
                💎 {overallMarginStatus.label}
              </div>
              {request.financialSummary.totalMargin < 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm">
                    ⚠️ 경고: 배차가 {request.financialSummary.dispatchCount}건인데 청구금액이 부족합니다
                  </p>
                  <p className="text-sm">
                    💡 제안: 추가 조정을 통해 청구금액을 늘리거나 배차를 조정하세요
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={showAddDispatch} onOpenChange={setShowAddDispatch}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 배차 등록</DialogTitle>
          </DialogHeader>
          <DispatchForm
            requestId={request.id}
            centerBilling={request.financialSummary.centerBilling}
            onSubmit={handleAddDispatch}
            onCancel={() => setShowAddDispatch(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDispatch} onOpenChange={(open) => { if (!open) setEditingDispatch(null) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>배차 수정</DialogTitle>
          </DialogHeader>
          {editingDispatch && (
            <DispatchForm
              requestId={request.id}
              centerBilling={request.financialSummary.centerBilling}
              initialData={editingDispatch}
              onSubmit={handleEditDispatch}
              onCancel={() => setEditingDispatch(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}