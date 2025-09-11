'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  Wind,
  Eye,
  Droplets
} from 'lucide-react'

interface Notification {
  id: string
  type: 'warning' | 'success' | 'info' | 'error'
  title: string
  message: string
  time: string
}

interface WeatherInfo {
  temperature: number
  condition: 'sunny' | 'cloudy' | 'rainy'
  humidity: number
  windSpeed: number
  visibility: number
  description: string
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: '결행 발생',
    message: '김기사님 오늘 운행 결행 처리됨',
    time: '30분 전'
  },
  {
    id: '2',
    type: 'info', 
    title: '새 운행 등록',
    message: '내일 서울-부산 노선 배정 완료',
    time: '1시간 전'
  },
  {
    id: '3',
    type: 'success',
    title: '정산 완료',
    message: '9월 정산 확정 및 지급 완료',
    time: '2시간 전'
  },
  {
    id: '4',
    type: 'warning',
    title: '미배정 차량',
    message: '12가3456 차량 내일 배정 필요',
    time: '3시간 전'
  }
]

const mockWeather: WeatherInfo = {
  temperature: 22,
  condition: 'cloudy',
  humidity: 65,
  windSpeed: 2.5,
  visibility: 10,
  description: '구름 많음'
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'warning':
      return { icon: AlertTriangle, color: 'text-amber-500' }
    case 'error':
      return { icon: AlertTriangle, color: 'text-red-500' }
    case 'success':
      return { icon: CheckCircle, color: 'text-green-500' }
    case 'info':
    default:
      return { icon: Bell, color: 'text-blue-500' }
  }
}

const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case 'sunny':
      return { icon: Sun, color: 'text-yellow-500' }
    case 'rainy':
      return { icon: CloudRain, color: 'text-blue-500' }
    case 'cloudy':
    default:
      return { icon: Cloud, color: 'text-slate-500' }
  }
}

export function NotificationsAndWeatherSection() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [weather, setWeather] = useState<WeatherInfo>(mockWeather)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-6">
      {/* 알림 섹션 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-slate-600" />
            긴급 알림
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-auto">
              {notifications.filter(n => n.type === 'warning' || n.type === 'error').length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">모든 알림이 처리되었습니다</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const { icon: Icon, color } = getNotificationIcon(notification.type)
                
                return (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Icon className={`h-4 w-4 ${color} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-900">
                        {notification.title}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {notification.message}
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {notification.time}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                모든 알림 보기
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 날씨 위젯 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Thermometer className="h-4 w-4 text-slate-600" />
            오늘 날씨
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 메인 날씨 정보 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const { icon: WeatherIcon, color } = getWeatherIcon(weather.condition)
                  return <WeatherIcon className={`h-8 w-8 ${color}`} />
                })()}
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {weather.temperature}°C
                  </div>
                  <div className="text-sm text-slate-600">
                    {weather.description}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">
                  {currentTime.toLocaleDateString('ko-KR', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-xs text-slate-500">
                  {currentTime.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            {/* 상세 날씨 정보 */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
              <div className="text-center">
                <Droplets className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                <div className="text-xs text-slate-500">습도</div>
                <div className="text-sm font-medium text-slate-900">
                  {weather.humidity}%
                </div>
              </div>
              <div className="text-center">
                <Wind className="h-4 w-4 text-slate-500 mx-auto mb-1" />
                <div className="text-xs text-slate-500">풍속</div>
                <div className="text-sm font-medium text-slate-900">
                  {weather.windSpeed}m/s
                </div>
              </div>
              <div className="text-center">
                <Eye className="h-4 w-4 text-slate-500 mx-auto mb-1" />
                <div className="text-xs text-slate-500">가시거리</div>
                <div className="text-sm font-medium text-slate-900">
                  {weather.visibility}km
                </div>
              </div>
            </div>

            {/* 운행 관련 날씨 조언 */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>운행 참고:</strong> 
                {weather.condition === 'rainy' && ' 우천으로 안전운행에 주의하세요.'}
                {weather.condition === 'cloudy' && ' 흐린 날씨로 시야 확보에 주의하세요.'}
                {weather.condition === 'sunny' && ' 맑은 날씨로 운행하기 좋은 날입니다.'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 오늘의 할 일 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4 text-slate-600" />
            오늘의 할 일
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                className="h-4 w-4 text-blue-600 rounded border-slate-300"
                defaultChecked
              />
              <span className="text-sm text-slate-600 line-through">
                내일 배차 확인 완료
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                className="h-4 w-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-sm text-slate-900">
                미배정 차량 3대 배정
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                className="h-4 w-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-sm text-slate-900">
                9월 정산 내역 검토
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                className="h-4 w-4 text-blue-600 rounded border-slate-300"
              />
              <span className="text-sm text-slate-900">
                신규 기사 면담
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-200">
            <button className="w-full text-sm text-slate-600 hover:text-slate-800 transition-colors">
              + 새 할 일 추가
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}