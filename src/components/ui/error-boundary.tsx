'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  ArrowRight,
  CheckCircle 
} from 'lucide-react'

interface ErrorRecoveryProps {
  error: {
    code?: number
    message: string
    type?: 'missing_fare' | 'network' | 'validation' | 'server'
    metadata?: any
  }
  onRetry?: () => void
  onQuickFix?: () => void
  onDismiss?: () => void
  canRecover?: boolean
}

export function ErrorRecovery({ 
  error, 
  onRetry, 
  onQuickFix, 
  onDismiss,
  canRecover = true 
}: ErrorRecoveryProps) {
  const [isRecovering, setIsRecovering] = useState(false)

  const handleQuickFix = async () => {
    setIsRecovering(true)
    try {
      await onQuickFix?.()
    } finally {
      setIsRecovering(false)
    }
  }

  const getErrorConfig = () => {
    switch (error.type) {
      case 'missing_fare':
        return {
          title: '요율 정보가 없습니다',
          description: '선택하신 센터와 차량 타입에 대한 요율이 등록되지 않았습니다.',
          quickFixLabel: '요율 등록하기',
          quickFixIcon: Settings,
          severity: 'warning' as const,
          recoverable: true
        }
      
      case 'network':
        return {
          title: '네트워크 오류',
          description: '인터넷 연결을 확인하고 다시 시도해주세요.',
          quickFixLabel: '다시 시도',
          quickFixIcon: RefreshCw,
          severity: 'error' as const,
          recoverable: true
        }
      
      case 'validation':
        return {
          title: '입력 정보 오류',
          description: error.message,
          quickFixLabel: '입력 확인',
          quickFixIcon: CheckCircle,
          severity: 'warning' as const,
          recoverable: true
        }
      
      default:
        return {
          title: '오류가 발생했습니다',
          description: error.message,
          quickFixLabel: '문제 해결',
          quickFixIcon: Settings,
          severity: 'error' as const,
          recoverable: canRecover
        }
    }
  }

  const config = getErrorConfig()
  const QuickFixIcon = config.quickFixIcon

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-700">
            {config.description}
          </AlertDescription>
        </Alert>

        {/* 빠른 해결 옵션들 */}
        <div className="flex flex-col sm:flex-row gap-3">
          {config.recoverable && onQuickFix && (
            <Button
              onClick={handleQuickFix}
              disabled={isRecovering}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <QuickFixIcon className={`h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
              {isRecovering ? '처리 중...' : config.quickFixLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          
          {onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
              className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </Button>
          )}
          
          {onDismiss && (
            <Button
              variant="ghost"
              onClick={onDismiss}
              className="text-orange-600 hover:text-orange-800 hover:bg-orange-100"
            >
              무시하고 계속
            </Button>
          )}
        </div>

        {/* 상세 정보 (개발 모드에서만) */}
        {process.env.NODE_ENV === 'development' && error.metadata && (
          <details className="text-xs text-gray-600 mt-4">
            <summary className="cursor-pointer hover:text-gray-800">
              상세 정보 (개발용)
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(error.metadata, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  )
}

// 특정 에러 타입별 컴포넌트
export function MissingFareError({ 
  centerName, 
  vehicleType, 
  missingRegions,
  onCreateFare,
  onRetry 
}: {
  centerName: string
  vehicleType: string
  missingRegions: string[]
  onCreateFare: () => void
  onRetry: () => void
}) {
  return (
    <ErrorRecovery
      error={{
        type: 'missing_fare',
        message: `${centerName}의 ${vehicleType} 차량에 대한 요율이 없습니다.`,
        metadata: { centerName, vehicleType, missingRegions }
      }}
      onQuickFix={onCreateFare}
      onRetry={onRetry}
      canRecover={true}
    />
  )
}