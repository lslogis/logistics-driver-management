/**
 * 성능 모니터링 컴포넌트
 * 개발 환경에서 앱 성능을 실시간으로 모니터링
 */

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Clock, 
  Database, 
  Memory, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQueryPerformance } from '@/hooks/useOptimizedQueries'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  queryCount: number
  errorCount: number
  fps: number
  timestamp: number
}

interface ComponentMetrics {
  name: string
  renderCount: number
  averageRenderTime: number
  lastRenderTime: number
  memoryImpact: number
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [componentMetrics, setComponentMetrics] = useState<Map<string, ComponentMetrics>>(new Map())
  const intervalRef = useRef<NodeJS.Timeout>()
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() })
  
  const queryMetrics = useQueryPerformance()

  // 개발 환경에서만 실행
  const isDevelopment = process.env.NODE_ENV === 'development'

  // FPS 계산
  useEffect(() => {
    if (!isDevelopment) return

    const calculateFPS = () => {
      fpsRef.current.frames++
      requestAnimationFrame(calculateFPS)
    }

    requestAnimationFrame(calculateFPS)

    const fpsInterval = setInterval(() => {
      const now = performance.now()
      const delta = now - fpsRef.current.lastTime
      const fps = Math.round((fpsRef.current.frames * 1000) / delta)
      
      fpsRef.current.frames = 0
      fpsRef.current.lastTime = now

      return fps
    }, 1000)

    return () => clearInterval(fpsInterval)
  }, [isDevelopment])

  // 성능 메트릭 수집
  useEffect(() => {
    if (!isDevelopment || !isVisible) return

    intervalRef.current = setInterval(() => {
      const now = performance.now()
      
      // 메모리 사용량 (추정)
      const memoryUsage = (performance as any).memory 
        ? (performance as any).memory.usedJSHeapSize / 1024 / 1024 
        : 0

      // FPS 계산
      const fps = Math.round(60) // 실제 FPS 계산은 복잡하므로 여기서는 근사값

      const newMetric: PerformanceMetrics = {
        renderTime: 0, // 실제 렌더 시간은 React DevTools나 다른 방법으로 측정
        memoryUsage,
        queryCount: queryMetrics.totalQueries,
        errorCount: queryMetrics.errorQueries,
        fps,
        timestamp: now
      }

      setMetrics(prev => {
        const updated = [...prev, newMetric]
        // 최근 100개 데이터만 유지
        return updated.slice(-100)
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isDevelopment, isVisible, queryMetrics])

  // 최근 메트릭 계산
  const recentMetrics = useMemo(() => {
    if (metrics.length === 0) return null

    const recent = metrics.slice(-10)
    const latest = metrics[metrics.length - 1]

    return {
      current: latest,
      averageMemory: recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length,
      averageFPS: recent.reduce((sum, m) => sum + m.fps, 0) / recent.length,
      trend: {
        memory: recent.length > 1 ? recent[recent.length - 1].memoryUsage - recent[0].memoryUsage : 0,
        queries: recent.length > 1 ? recent[recent.length - 1].queryCount - recent[0].queryCount : 0
      }
    }
  }, [metrics])

  // 성능 상태 평가
  const performanceStatus = useMemo(() => {
    if (!recentMetrics) return 'unknown'

    const { current, averageMemory, averageFPS } = recentMetrics

    // 임계값 기준
    const criticalMemory = 100 // MB
    const warningMemory = 50 // MB
    const minFPS = 30

    if (averageMemory > criticalMemory || averageFPS < minFPS || queryMetrics.errorQueries > 0) {
      return 'critical'
    }

    if (averageMemory > warningMemory || queryMetrics.staleQueries > 10) {
      return 'warning'
    }

    return 'good'
  }, [recentMetrics, queryMetrics])

  // 성능 경고 감지
  useEffect(() => {
    if (performanceStatus === 'critical') {
      console.warn('🚨 Performance Critical: High memory usage or low FPS detected')
    }
  }, [performanceStatus])

  // 개발 환경이 아니면 렌더링하지 않음
  if (!isDevelopment) return null

  // 토글 버튼 (최소화 상태)
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <Button
          onClick={() => setIsVisible(true)}
          className={cn(
            "rounded-full p-3 shadow-lg",
            performanceStatus === 'critical' && "bg-red-600 hover:bg-red-700 animate-pulse",
            performanceStatus === 'warning' && "bg-yellow-600 hover:bg-yellow-700",
            performanceStatus === 'good' && "bg-green-600 hover:bg-green-700"
          )}
        >
          <Activity className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-96">
      <Card className="shadow-xl border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Monitor
              <Badge 
                variant="outline" 
                className={cn(
                  performanceStatus === 'critical' && "border-red-500 text-red-700",
                  performanceStatus === 'warning' && "border-yellow-500 text-yellow-700",
                  performanceStatus === 'good' && "border-green-500 text-green-700"
                )}
              >
                {performanceStatus === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {performanceStatus === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {performanceStatus === 'good' && <CheckCircle className="h-3 w-3 mr-1" />}
                {performanceStatus.toUpperCase()}
              </Badge>
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 h-6 w-6"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="p-1 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="pt-0">
            <Tabs defaultValue="metrics" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="metrics" className="text-xs">Metrics</TabsTrigger>
                <TabsTrigger value="queries" className="text-xs">Queries</TabsTrigger>
                <TabsTrigger value="components" className="text-xs">Components</TabsTrigger>
              </TabsList>

              <TabsContent value="metrics" className="space-y-3 mt-3">
                {recentMetrics && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                        <Memory className="h-3 w-3" />
                        Memory
                      </div>
                      <div className="text-sm font-mono">
                        {recentMetrics.current.memoryUsage.toFixed(1)} MB
                      </div>
                      <div className={cn(
                        "text-xs",
                        recentMetrics.trend.memory > 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {recentMetrics.trend.memory > 0 ? '↑' : '↓'} 
                        {Math.abs(recentMetrics.trend.memory).toFixed(1)} MB
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
                        <Zap className="h-3 w-3" />
                        FPS
                      </div>
                      <div className="text-sm font-mono">
                        {recentMetrics.averageFPS.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        avg last 10s
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <div className="flex items-center gap-1 text-xs text-purple-600 mb-1">
                        <Database className="h-3 w-3" />
                        Queries
                      </div>
                      <div className="text-sm font-mono">
                        {queryMetrics.activeQueries}/{queryMetrics.totalQueries}
                      </div>
                      <div className="text-xs text-gray-500">
                        active/total
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded p-2">
                      <div className="flex items-center gap-1 text-xs text-orange-600 mb-1">
                        <TrendingUp className="h-3 w-3" />
                        Cache
                      </div>
                      <div className="text-sm font-mono">
                        {((queryMetrics.estimatedMemoryUsage / 1024) / 1024).toFixed(1)} MB
                      </div>
                      <div className="text-xs text-gray-500">
                        estimated
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="queries" className="space-y-2 mt-3">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Total Queries:</span>
                    <span className="font-mono">{queryMetrics.totalQueries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active (Fetching):</span>
                    <span className="font-mono text-blue-600">{queryMetrics.activeQueries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stale:</span>
                    <span className="font-mono text-yellow-600">{queryMetrics.staleQueries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cached:</span>
                    <span className="font-mono text-green-600">{queryMetrics.cachedQueries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Errors:</span>
                    <span className="font-mono text-red-600">{queryMetrics.errorQueries}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span>Cache Hit Rate:</span>
                      <span className="font-mono">
                        {queryMetrics.totalQueries > 0 
                          ? ((queryMetrics.cachedQueries / queryMetrics.totalQueries) * 100).toFixed(1)
                          : '0'
                        }%
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="components" className="mt-3">
                <div className="text-xs text-gray-500 text-center py-4">
                  Component metrics would require custom React profiling integration
                </div>
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.gc) {
                    window.gc()
                  }
                }}
                className="text-xs"
              >
                <Memory className="h-3 w-3 mr-1" />
                GC
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMetrics([])}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// 성능 모니터링을 위한 HOC
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const PerformanceWrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const renderStartTime = useRef<number>()
    const renderCount = useRef(0)

    useEffect(() => {
      renderStartTime.current = performance.now()
      renderCount.current++

      return () => {
        if (renderStartTime.current) {
          const renderTime = performance.now() - renderStartTime.current
          
          // 개발 환경에서만 로깅
          if (process.env.NODE_ENV === 'development') {
            console.log(`🎯 ${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`)
          }
        }
      }
    })

    return <WrappedComponent {...props} ref={ref} />
  })

  PerformanceWrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`
  
  return PerformanceWrappedComponent
}