'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">
                오류가 발생했습니다
              </h1>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                페이지를 처리하는 중에 예상치 못한 오류가 발생했습니다.
                페이지를 새로고침하거나 다시 시도해 보세요.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800 font-mono">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 시도
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Import-specific error display component
interface ImportErrorDisplayProps {
  error: string
  onRetry?: () => void
  onReset?: () => void
}

export function ImportErrorDisplay({ error, onRetry, onReset }: ImportErrorDisplayProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            가져오기 오류
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
          </div>
          {(onRetry || onReset) && (
            <div className="mt-4 flex space-x-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  다시 시도
                </button>
              )}
              {onReset && (
                <button
                  onClick={onReset}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  파일 다시 선택
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}