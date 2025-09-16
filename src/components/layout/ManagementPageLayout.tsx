/**
 * Unified Management Page Layout Component
 * Provides consistent header, search, and content structure for all management pages
 */

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Plus, Upload, Home, Download } from 'lucide-react'

// Types
interface ActionButton {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  loading?: boolean
  disabled?: boolean
}

interface SearchFilter {
  label: string
  type: 'text' | 'select' | 'date' | 'month' | 'custom'
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
  options?: { value: string; label: string }[]
  render?: () => React.ReactNode
}

interface QuickAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'outline'
}

interface ManagementPageLayoutProps {
  // Header Configuration
  title: string
  subtitle?: string
  icon: React.ReactNode
  
  // Action Buttons (displayed in header)
  primaryAction?: ActionButton
  secondaryActions?: ActionButton[]
  exportAction?: ActionButton
  importAction?: ActionButton
  
  // Search and Filters
  searchFilters?: SearchFilter[]
  quickActions?: QuickAction[]
  
  // Content
  children: React.ReactNode
  
  // Loading and Error States
  isLoading?: boolean
  error?: string
  
  // Statistics
  totalCount?: number
  countLabel?: string
}

export function ManagementPageLayout({
  title,
  subtitle,
  icon,
  primaryAction,
  secondaryActions = [],
  exportAction,
  importAction,
  searchFilters = [],
  quickActions = [],
  children,
  isLoading = false,
  error,
  totalCount,
  countLabel,
}: ManagementPageLayoutProps) {
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-red-900">오류가 발생했습니다</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex justify-center space-x-3">
              <Button onClick={() => window.location.reload()}>
                새로고침
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">메인으로</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header - Full width */}
      <header className="bg-white shadow border-b border-gray-200 w-full">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-16">
            {/* Title Section */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {React.cloneElement(icon as React.ReactElement, {
                  className: 'h-6 w-6 text-blue-600'
                })}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>}
              </div>
              {totalCount !== undefined && (
                <div className="ml-4 px-3 py-1 bg-blue-50 rounded-full">
                  <span className="text-sm font-medium text-blue-700">
                    {totalCount.toLocaleString()} {countLabel || '개'}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons - 통일된 디자인 */}
            <div className="flex items-center space-x-2">
              {/* Export Button - 회색 */}
              {exportAction && (
                <Button
                  variant="secondary"
                  size="default"
                  onClick={exportAction.onClick}
                  loading={exportAction.loading}
                  disabled={exportAction.disabled}
                  leftIcon={exportAction.icon || <Download className="h-4 w-4" />}
                  className="h-10 px-4 text-sm font-medium"
                >
                  {exportAction.label}
                </Button>
              )}
              
              {/* Import Button - 파란색 */}
              {importAction && (
                importAction.href ? (
                  <Button
                    variant="outline"
                    size="default"
                    asChild
                    leftIcon={importAction.icon || <Upload className="h-4 w-4" />}
                    className="h-10 px-4 text-sm font-medium"
                  >
                    <Link href={importAction.href}>{importAction.label}</Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={importAction.onClick}
                    loading={importAction.loading}
                    disabled={importAction.disabled}
                    leftIcon={importAction.icon || <Upload className="h-4 w-4" />}
                    className="h-10 px-4 text-sm font-medium"
                  >
                    {importAction.label}
                  </Button>
                )
              )}
              
              {/* Secondary Actions - 파란색 */}
              {secondaryActions.map((action, index) => (
                action.href ? (
                  <Button
                    key={index}
                    variant="outline"
                    size="default"
                    asChild
                    leftIcon={action.icon}
                    className="h-10 px-4 text-sm font-medium"
                  >
                    <Link href={action.href}>{action.label}</Link>
                  </Button>
                ) : (
                  <Button
                    key={index}
                    variant="outline"
                    size="default"
                    onClick={action.onClick}
                    loading={action.loading}
                    disabled={action.disabled}
                    leftIcon={action.icon}
                    className="h-10 px-4 text-sm font-medium"
                  >
                    {action.label}
                  </Button>
                )
              ))}

              {/* Primary Action - 진한 파란색 */}
              {primaryAction && (
                primaryAction.href ? (
                  <Button
                    variant="primary"
                    size="default"
                    asChild
                    leftIcon={primaryAction.icon || <Plus className="h-4 w-4" />}
                    className="h-10 px-4 text-sm font-medium"
                  >
                    <Link href={primaryAction.href}>{primaryAction.label}</Link>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="default"
                    onClick={primaryAction.onClick}
                    loading={primaryAction.loading}
                    disabled={primaryAction.disabled}
                    leftIcon={primaryAction.icon || <Plus className="h-4 w-4" />}
                    className="h-10 px-4 text-sm font-medium"
                  >
                    {primaryAction.label}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {/* Search and Filters */}
        {(searchFilters.length > 0 || quickActions.length > 0) && (
          <div className="w-full p-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 w-full">
              <div className="flex items-center gap-4 w-full">
                {searchFilters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap w-12">
                      {filter.label}
                    </span>
                    {filter.type === 'text' && (
                      <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder={filter.placeholder}
                          value={filter.value || ''}
                          onChange={(e) => filter.onChange(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-gray-900 font-medium border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm h-10"
                        />
                      </div>
                    )}
                    {filter.type === 'select' && (
                      <select
                        className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-gray-900 h-10"
                        value={filter.value || ''}
                        onChange={(e) => filter.onChange(e.target.value)}
                      >
                        {filter.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {(filter.type === 'date' || filter.type === 'month') && (
                      <Input
                        type={filter.type}
                        value={filter.value || ''}
                        onChange={(e) => filter.onChange(e.target.value)}
                        max={filter.type === 'month' ? new Date().toISOString().slice(0, 7) : undefined}
                        className="text-gray-900 font-medium w-40 h-10"
                      />
                    )}
                    {filter.type === 'custom' && filter.render && (
                      filter.render()
                    )}
                  </div>
                ))}
                
                {/* Quick Actions */}
                {quickActions.length > 0 && (
                  <div className="flex items-center space-x-3 ml-auto">
                    <span className="text-sm font-medium text-gray-600">빠른 필터:</span>
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || 'ghost'}
                        size="sm"
                        onClick={action.onClick}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="w-full p-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-500">로딩 중...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  )
}

export default ManagementPageLayout