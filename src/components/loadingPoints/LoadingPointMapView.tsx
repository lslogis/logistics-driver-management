'use client'

import React, { useEffect, useRef, useState } from 'react'
import { LoadingPointResponse } from '@/hooks/useLoadingPoints'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Building2, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingPointMapViewProps {
  loadingPoints: LoadingPointResponse[]
  selectedPoint?: LoadingPointResponse | null
  onPointSelect?: (point: LoadingPointResponse) => void
  onPointDetail?: (point: LoadingPointResponse) => void
  onPointEdit?: (point: LoadingPointResponse) => void
  onPointCall?: (phone: string) => void
  className?: string
}

declare global {
  interface Window {
    kakao: any
  }
}

export default function LoadingPointMapView({
  loadingPoints,
  selectedPoint,
  onPointSelect,
  onPointDetail,
  onPointEdit,
  onPointCall,
  className
}: LoadingPointMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false)

  // Kakao Maps SDK 로드
  useEffect(() => {
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_API_KEY}&autoload=false&libraries=services`
    script.async = true
    script.onload = () => {
      window.kakao.maps.load(() => {
        setIsKakaoLoaded(true)
      })
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  // 지도 초기화
  useEffect(() => {
    if (!isKakaoLoaded || !mapRef.current) return

    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청
      level: 8
    }

    const mapInstance = new window.kakao.maps.Map(mapRef.current, options)
    setMap(mapInstance)
  }, [isKakaoLoaded])

  // 마커 업데이트
  useEffect(() => {
    if (!map || !window.kakao) return

    // 기존 마커 제거
    markers.forEach(marker => marker.setMap(null))
    setMarkers([])

    const newMarkers: any[] = []
    const geocoder = new window.kakao.maps.services.Geocoder()

    loadingPoints.forEach((point, index) => {
      const address = point.roadAddress || point.lotAddress
      if (!address) return

      // 주소로 좌표 검색
      geocoder.addressSearch(address, (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x)

          // 커스텀 마커 생성
          const markerPosition = coords
          const marker = new window.kakao.maps.Marker({
            position: markerPosition,
            clickable: true
          })

          marker.setMap(map)
          newMarkers.push(marker)

          // 인포윈도우 생성
          const infowindowContent = `
            <div class="p-3 max-w-sm">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-sm text-gray-900 truncate">${point.centerName}</h4>
                  <div class="text-xs text-orange-600 font-medium">${point.loadingPointName}</div>
                </div>
                <div class="ml-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    point.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }">
                    ${point.isActive ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
              <div class="text-xs text-gray-600 mb-2">${address}</div>
              ${point.manager1 || point.phone1 ? `
                <div class="text-xs text-gray-600 mb-2">
                  ${point.manager1 || ''} ${point.phone1 ? `(${point.phone1})` : ''}
                </div>
              ` : ''}
              <div class="flex space-x-1 mt-2">
                <button 
                  onclick="window.loadingPointMapActions?.detail('${point.id}')"
                  class="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
                >
                  상세
                </button>
                <button 
                  onclick="window.loadingPointMapActions?.edit('${point.id}')"
                  class="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  수정
                </button>
                ${point.phone1 ? `
                  <button 
                    onclick="window.loadingPointMapActions?.call('${point.phone1}')"
                    class="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                  >
                    전화
                  </button>
                ` : ''}
              </div>
            </div>
          `

          const infowindow = new window.kakao.maps.InfoWindow({
            content: infowindowContent,
            removable: true
          })

          // 마커 클릭 이벤트
          window.kakao.maps.event.addListener(marker, 'click', () => {
            infowindow.open(map, marker)
            onPointSelect?.(point)
          })

          // 첫 번째 마커로 지도 중심 이동
          if (index === 0) {
            map.setCenter(coords)
            map.setLevel(6)
          }
        }
      })
    })

    setMarkers(newMarkers)
  }, [map, loadingPoints, onPointSelect])

  // 글로벌 액션 함수 설정
  useEffect(() => {
    (window as any).loadingPointMapActions = {
      detail: (id: string) => {
        const point = loadingPoints.find(p => p.id === id)
        if (point) onPointDetail?.(point)
      },
      edit: (id: string) => {
        const point = loadingPoints.find(p => p.id === id)
        if (point) onPointEdit?.(point)
      },
      call: (phone: string) => {
        onPointCall?.(phone)
      }
    }

    return () => {
      delete (window as any).loadingPointMapActions
    }
  }, [loadingPoints, onPointDetail, onPointEdit, onPointCall])

  // 선택된 포인트로 지도 이동
  useEffect(() => {
    if (!map || !selectedPoint || !window.kakao) return

    const geocoder = new window.kakao.maps.services.Geocoder()
    const address = selectedPoint.roadAddress || selectedPoint.lotAddress

    if (address) {
      geocoder.addressSearch(address, (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x)
          map.setCenter(coords)
          map.setLevel(4)
        }
      })
    }
  }, [map, selectedPoint])

  if (!isKakaoLoaded) {
    return (
      <Card className={cn("bg-white shadow-lg border-orange-100", className)}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
            <span className="text-gray-600">지도를 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("bg-white shadow-lg border-orange-100", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-orange-600" />
          상차지 위치
          <Badge variant="secondary" className="ml-2 text-xs">
            {loadingPoints.length}개소
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <div 
            ref={mapRef} 
            className="w-full h-[600px] rounded-b-lg"
          />
          
          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (map && loadingPoints.length > 0) {
                  // 모든 마커가 보이도록 지도 범위 조정
                  const bounds = new window.kakao.maps.LatLngBounds()
                  
                  const geocoder = new window.kakao.maps.services.Geocoder()
                  let processedPoints = 0
                  
                  loadingPoints.forEach(point => {
                    const address = point.roadAddress || point.lotAddress
                    if (address) {
                      geocoder.addressSearch(address, (result: any, status: any) => {
                        if (status === window.kakao.maps.services.Status.OK) {
                          bounds.extend(new window.kakao.maps.LatLng(result[0].y, result[0].x))
                          processedPoints++
                          
                          if (processedPoints === loadingPoints.length) {
                            map.setBounds(bounds, 50) // 50px 패딩
                          }
                        }
                      })
                    }
                  })
                }
              }}
              className="bg-white/90 border-orange-200 text-orange-600 hover:bg-orange-50 shadow-lg"
            >
              <Navigation className="h-4 w-4 mr-1" />
              전체 보기
            </Button>
          </div>

          {/* Selected Point Info Overlay */}
          {selectedPoint && (
            <div className="absolute bottom-4 left-4 right-4">
              <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-bold text-gray-900">{selectedPoint.centerName}</h3>
                        <Badge
                          variant={selectedPoint.isActive ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            selectedPoint.isActive 
                              ? "bg-green-100 text-green-800 border-green-200" 
                              : "bg-red-100 text-red-800 border-red-200"
                          )}
                        >
                          {selectedPoint.isActive ? '활성' : '비활성'}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium text-orange-600 mb-1">
                        {selectedPoint.loadingPointName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {selectedPoint.roadAddress || selectedPoint.lotAddress}
                      </div>
                      {selectedPoint.manager1 && (
                        <div className="text-xs text-gray-600 mt-1">
                          {selectedPoint.manager1} {selectedPoint.phone1 && `(${selectedPoint.phone1})`}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPointDetail?.(selectedPoint)}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPointEdit?.(selectedPoint)}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        <Building2 className="h-4 w-4" />
                      </Button>
                      {selectedPoint.phone1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPointCall?.(selectedPoint.phone1!)}
                          className="border-green-200 text-green-600 hover:bg-green-50"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}