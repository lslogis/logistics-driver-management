'use client'

import React from 'react'
import { X, MapPin, Phone, User, Calendar, Clock, Navigation, Building2, MessageSquare, QrCode as QrCodeIcon } from 'lucide-react'
import { LoadingPointResponse } from '@/hooks/useLoadingPoints'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPhoneNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface LoadingPointDetailDrawerProps {
  loadingPoint: LoadingPointResponse | null
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
  onCall?: (phone: string) => void
  onSMS?: () => void
  onShare?: () => void
}

export default function LoadingPointDetailDrawer({
  loadingPoint,
  isOpen,
  onClose,
  onEdit,
  onCall,
  onSMS,
  onShare
}: LoadingPointDetailDrawerProps) {
  if (!loadingPoint) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 transition-all duration-300 ease-in-out",
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
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">상차지 상세 정보</h2>
                <p className="text-orange-100 text-sm">Loading Point Details</p>
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
          <Card className="border-orange-100 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">기본 정보</span>
                <Badge
                  variant={loadingPoint.isActive ? "default" : "secondary"}
                  className={cn(
                    "text-sm font-semibold",
                    loadingPoint.isActive 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-red-100 text-red-800 border-red-200"
                  )}
                >
                  {loadingPoint.isActive ? '활성' : '비활성'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {loadingPoint.centerName}
                </h3>
                <div className="text-lg font-medium text-orange-600">
                  {loadingPoint.loadingPointName}
                </div>
              </div>

              {/* Address Section */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <Navigation className="h-4 w-4 mr-2 text-orange-600" />
                  주소 정보
                </h4>
                <div className="space-y-2">
                  {loadingPoint.roadAddress && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">도로명: </span>
                      <span className="text-gray-800">{loadingPoint.roadAddress}</span>
                    </div>
                  )}
                  {loadingPoint.lotAddress && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">지번: </span>
                      <span className="text-gray-700">{loadingPoint.lotAddress}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          {(loadingPoint.manager1 || loadingPoint.manager2 || loadingPoint.phone1 || loadingPoint.phone2) && (
            <Card className="border-orange-100 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-orange-600" />
                  연락처 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingPoint.manager1 && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <User className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{loadingPoint.manager1}</div>
                        {loadingPoint.phone1 && (
                          <div className="text-sm text-gray-600">
                            {formatPhoneNumber(loadingPoint.phone1)}
                          </div>
                        )}
                      </div>
                    </div>
                    {loadingPoint.phone1 && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCall?.(loadingPoint.phone1!)}
                          className="border-green-200 text-green-600 hover:bg-green-50"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onSMS}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {loadingPoint.manager2 && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <User className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{loadingPoint.manager2}</div>
                        {loadingPoint.phone2 && (
                          <div className="text-sm text-gray-600">
                            {formatPhoneNumber(loadingPoint.phone2)}
                          </div>
                        )}
                      </div>
                    </div>
                    {loadingPoint.phone2 && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCall?.(loadingPoint.phone2!)}
                          className="border-green-200 text-green-600 hover:bg-green-50"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onSMS}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          {loadingPoint.remarks && (
            <Card className="border-orange-100 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-orange-600" />
                  비고 사항
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                  <p className="text-gray-800">{loadingPoint.remarks}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card className="border-orange-100 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-600" />
                시스템 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">등록일:</span>
                <span>{formatDate(loadingPoint.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">최종 수정:</span>
                <span>{formatDate(loadingPoint.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-orange-100 bg-orange-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onShare}
                className="border-orange-200 text-orange-600 hover:bg-orange-100"
              >
                <Navigation className="h-4 w-4 mr-2" />
                공유하기
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // QR 코드 생성 기능 (향후 구현)
                  console.log('QR 코드 생성')
                }}
                className="border-orange-200 text-orange-600 hover:bg-orange-100"
              >
                <QrCodeIcon className="h-4 w-4 mr-2" />
                QR 코드
              </Button>
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
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Building2 className="h-4 w-4 mr-2" />
                수정하기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}