'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, User, Truck, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { CharterRequestResponse } from '@/lib/services/charter.service'

interface TomorrowCharter {
  id: string
  date: string
  routeName: string
  driverName: string
  vehiclePlateNumber: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'SUBSTITUTE'
  startTime?: string
  endTime?: string
  fare?: number
}

interface ApiResponse {
  ok: boolean
  data?: {
    charterRequests: CharterRequestResponse[]
    pagination: {
      page: number
      limit: number
      totalCount: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
  error?: {
    code: string
    message: string
  }
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'SCHEDULED':
      return { text: '예정', color: 'text-blue-600 bg-blue-50', icon: Calendar }
    case 'COMPLETED':
      return { text: '완료', color: 'text-green-600 bg-green-50', icon: CheckCircle2 }
    case 'CANCELLED':
      return { text: '결행', color: 'text-red-600 bg-red-50', icon: XCircle }
    case 'SUBSTITUTE':
      return { text: '대차', color: 'text-amber-600 bg-amber-50', icon: RefreshCw }
    default:
      return { text: '알수없음', color: 'text-slate-600 bg-slate-50', icon: AlertTriangle }
  }
}

export function TomorrowTripsSection() {
  const [charters, setCharters] = useState<TomorrowCharter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTomorrowCharters() {
      try {
        setLoading(true)
        setError(null)

        // 내일 날짜 계산 (한국 시간 기준)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        
        const tomorrowEnd = new Date(tomorrow)
        tomorrowEnd.setHours(23, 59, 59, 999)

        const dateFrom = tomorrow.toISOString()
        const dateTo = tomorrowEnd.toISOString()

        const response = await fetch(
          `/api/charters/requests?dateFrom=${dateFrom}&dateTo=${dateTo}&page=1&limit=100`
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data: ApiResponse = await response.json()

        if (!data.ok) {
          throw new Error(data.error?.message || '데이터를 불러오는데 실패했습니다')
        }

        // CharterRequestResponse를 TomorrowCharter로 변환
        const charterRequests = data.data?.charterRequests || []
        const mappedCharters: TomorrowCharter[] = charterRequests.map((charter: CharterRequestResponse) => ({
          id: charter.id,
          date: charter.date ? (typeof charter.date === 'string' ? charter.date : new Date(charter.date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
          routeName: `${charter.center?.centerName || '센터'} - ${charter.vehicleType || '차량'}`,
          driverName: charter.driver?.name || '미정',
          vehiclePlateNumber: charter.driver?.vehicleNumber || '미정',
          status: 'SCHEDULED',
          startTime: undefined,
          endTime: undefined,
          fare: charter.totalFare || undefined
        }))

        setCharters(mappedCharters)
      } catch (err) {
        console.error('Failed to fetch tomorrow charters:', err)
        setError('내일 배차내역을 불러오는데 실패했습니다')
        
        // 실패시 더미 데이터 제공
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowStr = tomorrow.toISOString().split('T')[0]
        
        setCharters([
          {
            id: 'demo-1',
            date: tomorrowStr,
            routeName: '서울-부산 노선',
            driverName: '김기사',
            vehiclePlateNumber: '12가3456',
            status: 'SCHEDULED',
            startTime: '08:00',
            fare: 350000
          },
          {
            id: 'demo-2', 
            date: tomorrowStr,
            routeName: '인천-대구 노선',
            driverName: '박기사',
            vehiclePlateNumber: '78바9012',
            status: 'SCHEDULED',
            startTime: '09:30',
            fare: 280000
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTomorrowCharters()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            내일 배차내역
          </CardTitle>
          <CardDescription>
            {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', { 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })} 예정된 운행
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-32"></div>
                      <div className="h-3 bg-slate-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              내일 배차내역
              <span className="text-sm font-normal text-slate-500">
                ({charters.length}건)
              </span>
            </CardTitle>
            <CardDescription>
              {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', { 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })} 예정된 운행
            </CardDescription>
          </div>
          <Link 
            href="/charters" 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            전체보기 →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">{error}</span>
            </div>
          </div>
        )}

        {charters.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">내일 예정된 배차가 없습니다</p>
            <p className="text-sm mt-1">새로운 운행을 등록해보세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {charters.map((charter) => {
              const statusInfo = getStatusInfo(charter.status)
              const StatusIcon = statusInfo.icon

              return (
                <div
                  key={charter.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <StatusIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      {charter.status !== 'SCHEDULED' && (
                        <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full ${statusInfo.color} flex items-center justify-center`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="font-medium text-slate-900 mb-1">
                        {charter.routeName}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {charter.driverName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          {charter.vehiclePlateNumber}
                        </div>
                        {charter.startTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {charter.startTime}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {charter.fare && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-900">
                          {charter.fare.toLocaleString()}원
                        </div>
                      </div>
                    )}
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {charters.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center text-sm text-slate-600">
              <span>
                예정 {charters.filter(t => t.status === 'SCHEDULED').length}건, 
                완료 {charters.filter(t => t.status === 'COMPLETED').length}건, 
                결행 {charters.filter(t => t.status === 'CANCELLED').length}건
              </span>
              <Link 
                href="/charters" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                용차관리로 이동
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}