'use client'

import React from 'react'
import { X, Route, Phone, User, Calendar, Clock, Truck, Building2, MapPin, DollarSign, FileText } from 'lucide-react'
import { FixedContractResponse } from '@/lib/validations/fixedContract'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPhoneNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

// Contract type labels
const CONTRACT_TYPE_LABELS: Record<string, string> = {
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

interface FixedContractDetailDrawerProps {
  contract: FixedContractResponse | null
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
  onCall?: (phone: string) => void
  onSMS?: () => void
}

export default function FixedContractDetailDrawer({
  contract,
  isOpen,
  onClose,
  onEdit,
  onCall,
  onSMS
}: FixedContractDetailDrawerProps) {
  if (!contract) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul'
    })
  }

  const formatSimpleDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Seoul'
    })
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return '-'
    return `${amount.toLocaleString()}원`
  }

  const formatOperatingDays = (days: number[]) => {
    if (!days || days.length === 0) return '-'
    return days.sort((a, b) => a - b).map(d => OPERATING_DAYS_LABELS[d] || d).join(', ')
  }

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[500] transition-all duration-300 ease-in-out",
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
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Route className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">고정계약 상세 정보</h2>
                <p className="text-violet-100 text-sm">Fixed Contract Details</p>
              </div>
            </div>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <Card className="border-violet-100 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">계약 기본 정보</span>
                <Badge
                  variant={contract.isActive ? "default" : "secondary"}
                  className={cn(
                    "text-sm font-semibold",
                    contract.isActive 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-red-100 text-red-800 border-red-200"
                  )}
                >
                  {contract.isActive ? '활성' : '비활성'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {contract.routeName}
                </h3>
                <div className="text-lg font-medium text-violet-600">
                  {contract.loadingPoint?.centerName || '센터 미지정'}
                </div>
              </div>

              {/* Contract Dates */}
              {(contract.startDate || contract.endDate) && (
                <div className="bg-violet-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-violet-600" />
                    계약 기간
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">시작일: </span>
                      <span className="text-gray-800">{formatSimpleDate(contract.startDate)}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">종료일: </span>
                      <span className="text-gray-800">{formatSimpleDate(contract.endDate)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Center Contract Info */}
          <Card className="border-blue-100 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                센터 ⬅️➡️ 운수사 간 계약
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">계약형태</span>
                    <div className="text-lg font-semibold text-blue-600">
                      {CONTRACT_TYPE_LABELS[contract.centerContractType]}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">센터금액</span>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(contract.centerAmount)}
                    </div>
                  </div>
                </div>
              </div>

              {contract.specialConditions && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                  <h5 className="font-medium text-gray-800 mb-1">특이사항</h5>
                  <p className="text-gray-700 text-sm">{contract.specialConditions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Driver Contract Info */}
          {(contract.driver || contract.driverContractType || contract.driverAmount) && (
            <Card className="border-green-100 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-green-600" />
                  운수사 ⬅️➡️ 기사 간 계약
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.driver && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{contract.driver.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatPhoneNumber(contract.driver.phone)} | {contract.driver.vehicleNumber}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCall?.(contract.driver!.phone)}
                        className="border-green-200 text-green-600 hover:bg-green-50"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {(contract.driverContractType || contract.driverAmount) && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {contract.driverContractType && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">기사계약형태</span>
                          <div className="text-lg font-semibold text-green-600">
                            {CONTRACT_TYPE_LABELS[contract.driverContractType]}
                          </div>
                        </div>
                      )}
                      {contract.driverAmount && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">기사금액</span>
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(contract.driverAmount)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Operating Days */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-2">운행요일</h5>
                  <div className="text-lg font-semibold text-green-600">
                    {formatOperatingDays(contract.operatingDays)}
                  </div>
                </div>

                {contract.remarks && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <h5 className="font-medium text-gray-800 mb-1">비고</h5>
                    <p className="text-gray-700 text-sm">{contract.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card className="border-violet-100 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-violet-600" />
                시스템 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">등록일:</span>
                <span>{formatDate(contract.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">최종 수정:</span>
                <span>{formatDate(contract.updatedAt)}</span>
              </div>
              {contract.creator && (
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="font-medium">등록자:</span>
                  <span>{contract.creator.name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-violet-100 bg-violet-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              {/* 추후 공유 기능 추가 가능 */}
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                닫기
              </Button>
              <Button
                onClick={onEdit}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <FileText className="h-4 w-4 mr-2" />
                수정하기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}