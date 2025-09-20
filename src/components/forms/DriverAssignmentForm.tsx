/**
 * 기사 배정 폼 컴포넌트 - 완전한 기사 배정 및 수익성 계산 인터페이스
 * useDriverAssignment 훅과 통합하여 데이터 동기화 및 검증 제공
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { DriverSelector } from '@/components/ui/DriverSelector'
import { 
  User, 
  Phone, 
  Truck, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Request } from '@/types'
import { useDriverAssignment } from '@/hooks/useDriverAssignment'

interface DriverAssignmentFormProps {
  request: Request
  onSuccess?: (updatedRequest: Request) => void
  onCancel?: () => void
  className?: string
  showProfitability?: boolean
  allowQuickAssign?: boolean
}

export function DriverAssignmentForm({
  request,
  onSuccess,
  onCancel,
  className,
  showProfitability = true,
  allowQuickAssign = true
}: DriverAssignmentFormProps) {
  const {
    state,
    drivers,
    isLoadingDrivers,
    profitability,
    recommendedFee,
    selectDriver,
    updateDriverInfo,
    resetForm,
    validateAssignment,
    submitAssignment,
    autoFillFromDriver,
    calculateOptimalFee,
    getValidationErrors,
    hasUnsavedChanges
  } = useDriverAssignment(request, onSuccess)

  const centerBilling = request.centerBillingTotal || 
    ((request.baseFare || 0) + 
     (request.extraStopFee || 0) + 
     (request.extraRegionFee || 0) + 
     (request.extraAdjustment || 0))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateAssignment()) {
      return
    }

    try {
      await submitAssignment(request.id)
    } catch (error) {
      console.error('Assignment submission failed:', error)
    }
  }

  const handleDriverSelect = (driverId: string | null) => {
    selectDriver(driverId)
  }

  const handleQuickAssign = () => {
    if (state.selectedDriver) {
      autoFillFromDriver(state.selectedDriver)
      
      // 권장 운임으로 자동 설정
      if (centerBilling > 0) {
        updateDriverInfo('driverFee', recommendedFee)
      }
    }
  }

  const handleOptimalFeeCalculation = () => {
    if (centerBilling > 0) {
      calculateOptimalFee(centerBilling, 25) // 25% 목표 마진
    }
  }

  const validationErrors = getValidationErrors()
  const hasErrors = validationErrors.length > 0
  const isModified = hasUnsavedChanges(request)

  // 수익성 상태 아이콘 및 색상
  const getProfitabilityDisplay = () => {
    if (!profitability) return null

    const { status, marginRate, statusColor, statusLabel } = profitability

    const icons = {
      profit: <TrendingUp className="h-4 w-4" />,
      'break-even': <Minus className="h-4 w-4" />,
      loss: <TrendingDown className="h-4 w-4" />
    }

    return {
      icon: icons[status],
      label: statusLabel,
      rate: `${marginRate.toFixed(1)}%`,
      color: statusColor
    }
  }

  const profitabilityDisplay = getProfitabilityDisplay()

  return (
    <div className={cn("space-y-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 헤더 - 요청 정보 요약 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                기사 배정
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                요청 #{request.id.slice(-8)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">상차지</span>
                <div className="font-medium">
                  {request.loadingPoint?.loadingPointName || '미지정'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">배송지역</span>
                <div className="font-medium">{request.regions.join(' → ')}</div>
              </div>
              <div>
                <span className="text-gray-500">차량</span>
                <div className="font-medium">{request.vehicleTon}톤</div>
              </div>
              <div>
                <span className="text-gray-500">센터 청구</span>
                <div className="font-medium text-blue-600">
                  {centerBilling.toLocaleString()}원
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 기사 선택 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">기사 선택</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="driver-select">기사</Label>
              <DriverSelector
                value={state.selectedDriverId}
                onValueChange={handleDriverSelect}
                placeholder="기사를 선택하세요"
                disabled={state.isSubmitting}
                className="mt-1"
              />
            </div>

            {allowQuickAssign && state.selectedDriver && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleQuickAssign}
                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  빠른 배정
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOptimalFeeCalculation}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Calculator className="h-4 w-4 mr-1" />
                  최적 운임 ({recommendedFee.toLocaleString()}원)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 기사 정보 입력 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">기사 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driver-name">
                  <User className="h-4 w-4 inline mr-1" />
                  기사명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="driver-name"
                  value={state.driverName}
                  onChange={(e) => updateDriverInfo('driverName', e.target.value)}
                  placeholder="기사명을 입력하세요"
                  disabled={state.isSubmitting}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="driver-phone">
                  <Phone className="h-4 w-4 inline mr-1" />
                  연락처 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="driver-phone"
                  value={state.driverPhone}
                  onChange={(e) => updateDriverInfo('driverPhone', e.target.value)}
                  placeholder="010-0000-0000"
                  disabled={state.isSubmitting}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="driver-vehicle">
                  <Truck className="h-4 w-4 inline mr-1" />
                  차량 정보
                </Label>
                <Input
                  id="driver-vehicle"
                  value={state.driverVehicle}
                  onChange={(e) => updateDriverInfo('driverVehicle', e.target.value)}
                  placeholder="차종 및 차량번호"
                  disabled={state.isSubmitting}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="delivery-time">
                  <Clock className="h-4 w-4 inline mr-1" />
                  배송 시간
                </Label>
                <Input
                  id="delivery-time"
                  value={state.deliveryTime}
                  onChange={(e) => updateDriverInfo('deliveryTime', e.target.value)}
                  placeholder="예: 오전 9시, 14:00 등"
                  disabled={state.isSubmitting}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="driver-fee">
                <DollarSign className="h-4 w-4 inline mr-1" />
                기사 운임 <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="driver-fee"
                  type="number"
                  value={state.driverFee}
                  onChange={(e) => updateDriverInfo('driverFee', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="1000"
                  disabled={state.isSubmitting}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOptimalFeeCalculation}
                  disabled={state.isSubmitting || centerBilling <= 0}
                  className="px-3"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {recommendedFee > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  권장 운임: {recommendedFee.toLocaleString()}원 (25% 마진 기준)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="driver-notes">비고</Label>
              <Textarea
                id="driver-notes"
                value={state.driverNotes}
                onChange={(e) => updateDriverInfo('driverNotes', e.target.value)}
                placeholder="추가 메모나 특이사항을 입력하세요"
                disabled={state.isSubmitting}
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* 수익성 분석 (옵션) */}
        {showProfitability && profitability && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                수익성 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-600 mb-1">센터 청구</div>
                  <div className="font-bold text-blue-800">
                    {profitability.centerBilling.toLocaleString()}원
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">기사 운임</div>
                  <div className="font-bold text-gray-800">
                    {profitability.driverFee.toLocaleString()}원
                  </div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-600 mb-1">마진</div>
                  <div className="font-bold text-green-800">
                    {profitability.margin.toLocaleString()}원
                  </div>
                </div>
                
                <div className={cn("text-center p-3 rounded-lg", profitability.statusColor.replace('text-', 'bg-').replace('-600', '-50'))}>
                  <div className="text-xs mb-1">수익성</div>
                  <div className="font-bold flex items-center justify-center gap-1">
                    {profitabilityDisplay?.icon}
                    {profitabilityDisplay?.rate}
                  </div>
                </div>
              </div>

              {profitability.recommendation && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">{profitability.recommendation}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 검증 오류 표시 */}
        {hasErrors && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 mb-1">입력 정보를 확인해주세요:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={state.isSubmitting}
            >
              취소
            </Button>
          )}
          
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={state.isSubmitting || !isModified}
          >
            초기화
          </Button>
          
          <Button
            type="submit"
            disabled={state.isSubmitting || hasErrors}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {state.isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                배정 중...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                기사 배정 완료
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}