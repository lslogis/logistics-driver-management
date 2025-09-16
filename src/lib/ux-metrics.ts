'use client'

// UX 성능 측정 유틸리티
export class UXMetrics {
  private static instance: UXMetrics
  private metrics: Map<string, any> = new Map()
  
  static getInstance(): UXMetrics {
    if (!UXMetrics.instance) {
      UXMetrics.instance = new UXMetrics()
    }
    return UXMetrics.instance
  }

  // 로딩 시간 측정
  measureLoadingTime(componentName: string) {
    const startTime = performance.now()
    
    return {
      end: () => {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        this.recordMetric('loading_time', {
          component: componentName,
          duration,
          timestamp: Date.now()
        })
        
        return duration
      }
    }
  }

  // 폼 상호작용 시간 측정
  measureFormInteraction(formName: string) {
    const startTime = performance.now()
    let interactionCount = 0
    
    return {
      recordInteraction: () => {
        interactionCount++
      },
      end: () => {
        const endTime = performance.now()
        const totalTime = endTime - startTime
        
        this.recordMetric('form_interaction', {
          form: formName,
          totalTime,
          interactionCount,
          averageTimePerInteraction: totalTime / Math.max(interactionCount, 1),
          timestamp: Date.now()
        })
        
        return {
          totalTime,
          interactionCount,
          averageTimePerInteraction: totalTime / Math.max(interactionCount, 1)
        }
      }
    }
  }

  // 에러 복구 시간 측정
  measureErrorRecovery(errorType: string) {
    const startTime = performance.now()
    
    return {
      recovered: () => {
        const recoveryTime = performance.now() - startTime
        
        this.recordMetric('error_recovery', {
          errorType,
          recoveryTime,
          timestamp: Date.now()
        })
        
        return recoveryTime
      }
    }
  }

  // 사용자 만족도 점수 기록
  recordSatisfactionScore(action: string, score: number, feedback?: string) {
    this.recordMetric('satisfaction', {
      action,
      score, // 1-5 점수
      feedback,
      timestamp: Date.now()
    })
  }

  // 메트릭 기록
  private recordMetric(type: string, data: any) {
    const key = `${type}_${Date.now()}`
    this.metrics.set(key, { type, ...data })
    
    // 개발 모드에서는 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      console.log(`[UX Metric] ${type}:`, data)
    }
    
    // 실제 환경에서는 분석 서비스로 전송
    this.sendToAnalytics(type, data)
  }

  // 분석 서비스로 데이터 전송
  private sendToAnalytics(type: string, data: any) {
    // 실제 구현에서는 Google Analytics, Mixpanel 등으로 전송
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', `ux_${type}`, {
        custom_parameter: JSON.stringify(data)
      })
    }
  }

  // 성능 리포트 생성
  generateReport(timeRange: { start: Date, end: Date }) {
    const relevantMetrics = Array.from(this.metrics.values())
      .filter(metric => 
        metric.timestamp >= timeRange.start.getTime() && 
        metric.timestamp <= timeRange.end.getTime()
      )

    const loadingTimes = relevantMetrics
      .filter(m => m.type === 'loading_time')
      .map(m => m.duration)

    const formInteractions = relevantMetrics
      .filter(m => m.type === 'form_interaction')

    const errorRecoveries = relevantMetrics
      .filter(m => m.type === 'error_recovery')

    const satisfactionScores = relevantMetrics
      .filter(m => m.type === 'satisfaction')
      .map(m => m.score)

    return {
      loadingPerformance: {
        averageLoadTime: loadingTimes.reduce((a, b) => a + b, 0) / loadingTimes.length || 0,
        p95LoadTime: this.percentile(loadingTimes, 95),
        count: loadingTimes.length
      },
      formPerformance: {
        averageInteractionTime: formInteractions.reduce((sum, f) => sum + f.averageTimePerInteraction, 0) / formInteractions.length || 0,
        averageInteractionCount: formInteractions.reduce((sum, f) => sum + f.interactionCount, 0) / formInteractions.length || 0,
        count: formInteractions.length
      },
      errorRecovery: {
        averageRecoveryTime: errorRecoveries.reduce((sum, e) => sum + e.recoveryTime, 0) / errorRecoveries.length || 0,
        count: errorRecoveries.length
      },
      satisfaction: {
        averageScore: satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length || 0,
        count: satisfactionScores.length
      },
      totalEvents: relevantMetrics.length
    }
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0
    const sorted = values.sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * (p / 100)) - 1
    return sorted[index] || 0
  }
}

// React Hook for UX metrics
export function useUXMetrics() {
  const metrics = UXMetrics.getInstance()
  
  return {
    measureLoading: metrics.measureLoadingTime.bind(metrics),
    measureForm: metrics.measureFormInteraction.bind(metrics),
    measureError: metrics.measureErrorRecovery.bind(metrics),
    recordSatisfaction: metrics.recordSatisfactionScore.bind(metrics),
    generateReport: metrics.generateReport.bind(metrics)
  }
}

// UX 성능 기준
export const UX_PERFORMANCE_THRESHOLDS = {
  LOADING_TIME: {
    EXCELLENT: 1000, // 1초 이하
    GOOD: 2000,      // 2초 이하
    POOR: 5000       // 5초 이상은 개선 필요
  },
  FORM_INTERACTION: {
    EXCELLENT: 500,  // 0.5초 이하
    GOOD: 1000,      // 1초 이하
    POOR: 2000       // 2초 이상은 개선 필요
  },
  ERROR_RECOVERY: {
    EXCELLENT: 3000, // 3초 이하
    GOOD: 5000,      // 5초 이하
    POOR: 10000      // 10초 이상은 개선 필요
  },
  SATISFACTION: {
    EXCELLENT: 4.5,  // 4.5점 이상
    GOOD: 3.5,       // 3.5점 이상
    POOR: 2.5        // 2.5점 이하는 개선 필요
  }
} as const