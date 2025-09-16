'use client'

import React, { useState } from 'react'
import { 
  Map, 
  Navigation, 
  MapPin, 
  Route, 
  Clock, 
  User,
  Maximize2,
  Minimize2,
  Layers,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface RouteMapData {
  routeId: string
  routeName: string
  waypoints: {
    id: string
    name: string
    type: 'origin' | 'waypoint' | 'destination'
    coordinates: [number, number] // [lat, lng]
    estimatedTime?: string
  }[]
  driverName?: string
  status: 'active' | 'inactive' | 'maintenance'
  operatingDays: string
  distance?: number
  estimatedDuration?: number
}

interface RouteMapViewProps {
  data: RouteMapData[]
  isLoading?: boolean
  selectedRouteId?: string
  onRouteSelect?: (routeId: string | null) => void
  className?: string
}

const RouteMapView: React.FC<RouteMapViewProps> = ({
  data,
  isLoading = false,
  selectedRouteId,
  onRouteSelect,
  className
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapView, setMapView] = useState<'standard' | 'satellite' | 'traffic'>('standard')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredRoutes = data.filter(route => 
    filterStatus === 'all' || route.status === filterStatus
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 border-green-200'
      case 'inactive':
        return 'text-gray-600 bg-gray-100 border-gray-200'
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getRouteColor = (status: string, isSelected: boolean) => {
    if (isSelected) return 'border-indigo-500 bg-indigo-50'
    
    switch (status) {
      case 'active':
        return 'border-green-300 bg-green-50 hover:bg-green-100'
      case 'inactive':
        return 'border-gray-300 bg-gray-50 hover:bg-gray-100'
      case 'maintenance':
        return 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
      default:
        return 'border-gray-300 bg-gray-50 hover:bg-gray-100'
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`
  }

  if (isLoading) {
    return (
      <Card className={cn("bg-white shadow-lg border-indigo-100", className)}>
        <CardHeader>
          <div className="h-6 bg-gray-200 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "bg-white shadow-lg border-indigo-100",
      isFullscreen && "fixed inset-4 z-50",
      className
    )}>
      <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-indigo-800">
            <Map className="h-5 w-5" />
            노선 지도 뷰
            <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700">
              {filteredRoutes.length}개 노선
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Map View Selector */}
            <Select value={mapView} onValueChange={(value: any) => setMapView(value)}>
              <SelectTrigger className="w-32 h-8 text-xs border-indigo-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">일반</SelectItem>
                <SelectItem value="satellite">위성</SelectItem>
                <SelectItem value="traffic">교통</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-24 h-8 text-xs border-indigo-200">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
                <SelectItem value="maintenance">정비중</SelectItem>
              </SelectContent>
            </Select>

            {/* Fullscreen Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 px-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className={cn(
          "flex",
          isFullscreen ? "h-[calc(100vh-8rem)]" : "h-96"
        )}>
          {/* Map Area */}
          <div className="flex-1 relative bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Mock Map Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Map className="h-16 w-16 text-indigo-400 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-indigo-600">
                    지도 뷰 준비 중
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    실제 구현에서는 Google Maps 또는 네이버 지도 API를 통해<br/>
                    노선 경로와 실시간 위치를 표시합니다.
                  </p>
                </div>
                
                {/* Mock Route Indicators */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">활성 노선</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-600">정비 중</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-gray-600">비활성</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Map Controls */}
            <div className="absolute top-4 right-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-white shadow-md border-gray-300"
              >
                <Navigation className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-white shadow-md border-gray-300"
              >
                <Layers className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Route List Sidebar */}
          <div className={cn(
            "w-80 border-l border-gray-200 bg-white overflow-y-auto",
            isFullscreen && "w-96"
          )}>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Route className="h-4 w-4" />
                노선 목록
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              {filteredRoutes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-sm">
                    표시할 노선이 없습니다
                  </div>
                </div>
              ) : (
                filteredRoutes.map((route) => (
                  <div
                    key={route.routeId}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      getRouteColor(route.status, selectedRouteId === route.routeId)
                    )}
                    onClick={() => onRouteSelect?.(
                      selectedRouteId === route.routeId ? null : route.routeId
                    )}
                  >
                    {/* Route Header */}
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm truncate flex-1">
                        {route.routeName}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getStatusColor(route.status))}
                      >
                        {route.status === 'active' ? '활성' :
                         route.status === 'maintenance' ? '정비' : '대기'}
                      </Badge>
                    </div>

                    {/* Route Info */}
                    <div className="space-y-1 text-xs text-gray-600">
                      {route.driverName && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{route.driverName}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{route.operatingDays.replace(/,/g, ', ')}</span>
                      </div>
                      
                      {route.distance && (
                        <div className="flex items-center justify-between">
                          <span>거리: {route.distance}km</span>
                          {route.estimatedDuration && (
                            <span>소요: {formatDuration(route.estimatedDuration)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Waypoints Preview */}
                    {selectedRouteId === route.routeId && route.waypoints.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-2">경유지</div>
                        <div className="space-y-1">
                          {route.waypoints.map((waypoint, index) => (
                            <div 
                              key={waypoint.id}
                              className="flex items-center gap-2 text-xs"
                            >
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                waypoint.type === 'origin' && "bg-green-500",
                                waypoint.type === 'waypoint' && "bg-blue-500", 
                                waypoint.type === 'destination' && "bg-red-500"
                              )} />
                              <span className="truncate flex-1">{waypoint.name}</span>
                              {waypoint.estimatedTime && (
                                <span className="text-gray-400">{waypoint.estimatedTime}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RouteMapView
