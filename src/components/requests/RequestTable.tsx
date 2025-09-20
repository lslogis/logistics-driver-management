'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EyeIcon, EditIcon, User, Phone } from 'lucide-react'
import { Request } from '@/types'
import { requestsAPI } from '@/lib/api/requests'
import { calculateProfitability } from '@/lib/services/profitability.service'

interface RequestTableProps {
  onViewRequest: (request: Request) => void
  onEditRequest: (request: Request) => void
}

export function RequestTable({ onViewRequest, onEditRequest }: RequestTableProps) {
  const [requests, setRequests] = useState<Request[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setIsLoading(true)
    try {
      const response = await requestsAPI.list({ page: 1, limit: 50 })
      setRequests(response.data || [])
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원'
  }

  const getDispatchStatus = (request: Request) => {
    // 새로운 구조: driverId 또는 driverName 기반 판단
    if (request.driverId || request.driverName) {
      return { label: '배차완료', color: 'bg-green-100 text-green-800' }
    }
    
    // 기존 dispatches 배열도 확인 (호환성 유지)
    if (request.dispatches && request.dispatches.length > 0) {
      return { label: `배차완료 (${request.dispatches.length})`, color: 'bg-green-100 text-green-800' }
    }
    
    return { label: '미배차', color: 'bg-gray-100 text-gray-800' }
  }

  const getDriverInfo = (request: Request) => {
    if (request.driverName) {
      return {
        name: request.driverName,
        phone: request.driverPhone || '',
        hasDriver: true
      }
    }
    
    // 기존 dispatches 구조도 확인 (호환성 유지)
    if (request.dispatches && request.dispatches.length > 0) {
      const firstDispatch = request.dispatches[0]
      return {
        name: firstDispatch.driverName || '기사명 미상',
        phone: firstDispatch.driverPhone || '',
        hasDriver: true
      }
    }
    
    return {
      name: '',
      phone: '',
      hasDriver: false
    }
  }

  const getProfitabilityStatus = (request: Request) => {
    const profitability = calculateProfitability(request)
    return profitability
  }

  const calculateCenterBilling = (request: Request) => {
    return request.centerBillingTotal || 
           ((request.baseFare || 0) + 
            (request.extraStopFee || 0) + 
            (request.extraRegionFee || 0) + 
            (request.extraAdjustment || 0))
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-2xl bg-white rounded-3xl">
        <CardContent className="p-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4"></div>
            <div className="text-emerald-600 font-medium text-lg">데이터를 불러오는 중...</div>
            <div className="text-teal-400 text-sm mt-2">잠시만 기다려주세요</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
      <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-t-3xl p-6">
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <span className="text-xl text-white">📋</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">용차 요청 목록</h2>
              <p className="text-sm text-emerald-600 font-medium">전체 요청 내역을 한눈에 확인하세요</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl shadow-lg">
            <div className="text-xs font-medium">총 항목</div>
            <div className="text-lg font-bold">{requests.length}개</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-emerald-100 to-teal-100 sticky top-0 rounded-lg">
              <tr>
                <th className="px-4 py-4 font-bold text-emerald-900 text-center border-r border-emerald-200">배송일</th>
                <th className="px-4 py-4 font-bold text-emerald-900 text-center border-r border-emerald-200">센터명</th>
                <th className="px-4 py-4 font-bold text-emerald-900 text-center border-r border-emerald-200">노선번호</th>
                <th className="px-4 py-4 font-bold text-emerald-900 text-center border-r border-emerald-200">차량</th>
                <th className="px-4 py-4 font-bold text-emerald-900 text-center border-r border-emerald-200">배송지역</th>
                <th className="px-4 py-4 font-bold text-emerald-900 text-center border-r border-emerald-200">기사정보</th>
                <th className="px-4 py-4 font-bold text-emerald-900 text-right border-r border-emerald-200">요금/수익</th>
                <th className="px-4 py-4 font-bold text-emerald-900 text-center border-r border-emerald-200">상태</th>
                <th className="px-4 py-4 font-bold text-emerald-900 text-center">작업</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    등록된 용차 요청이 없습니다
                  </td>
                </tr>
              )}
              {requests.map(request => {
                const dispatchStatus = getDispatchStatus(request)
                const driverInfo = getDriverInfo(request)
                const centerBilling = calculateCenterBilling(request)
                const profitability = getProfitabilityStatus(request)
                
                return (
                  <tr key={request.id} className="bg-white border-b border-emerald-100 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-300 hover:shadow-sm">
                    <td className="px-4 py-4 font-medium text-center">
                      {formatDate(request.requestDate)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {request.loadingPoint?.centerName || '미등록'}
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-xs">
                      {request.centerCarNo}
                    </td>
                    <td className="px-4 py-4 text-center text-xs">
                      {request.vehicleTon}톤
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {request.regions.slice(0, 1).map((region, index) => (
                          <Badge key={index} className="text-xs bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-200">
                            {region}
                          </Badge>
                        ))}
                        {request.regions.length > 1 && (
                          <Badge className="text-xs bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-700 border border-teal-200">
                            +{request.regions.length - 1}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{request.stops}개 착지</div>
                    </td>
                    <td className="px-4 py-4">
                      {driverInfo.hasDriver ? (
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-xs font-medium text-gray-900">
                            <User className="h-3 w-3" />
                            {driverInfo.name}
                          </div>
                          {driverInfo.phone && (
                            <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mt-1">
                              <Phone className="h-3 w-3" />
                              {driverInfo.phone}
                            </div>
                          )}
                          {request.driverFee && (
                            <div className="text-xs text-blue-600 mt-1 font-medium">
                              운임: {formatCurrency(request.driverFee)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-xs text-gray-400">
                          미배정
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-sm">
                          {formatCurrency(centerBilling)}
                        </div>
                        {request.driverFee > 0 && (
                          <div className="text-xs">
                            <div className="text-gray-600">
                              기사비: {formatCurrency(request.driverFee)}
                            </div>
                            <div className={`font-medium ${profitability.statusColor}`}>
                              마진: {formatCurrency(profitability.margin)}
                              <br />
                              ({profitability.marginRate.toFixed(1)}%)
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="space-y-1">
                        <Badge className={`${dispatchStatus.color} border-0 font-medium shadow-sm text-xs`}>
                          {dispatchStatus.label}
                        </Badge>
                        {request.driverFee > 0 && (
                          <div className={`text-xs px-2 py-1 rounded ${profitability.statusColor.replace('text-', 'bg-').replace('-600', '-100').replace('-500', '-100')} ${profitability.statusColor} border`}>
                            {profitability.statusLabel}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewRequest(request)}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <EyeIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditRequest(request)}
                          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 border-teal-200 hover:border-teal-300 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <EditIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}