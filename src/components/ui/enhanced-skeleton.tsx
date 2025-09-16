'use client'

import React from 'react'
import { cn } from "@/lib/utils"
import { Skeleton } from './skeleton'

interface EnhancedSkeletonProps {
  variant: 'table' | 'form' | 'card' | 'list'
  count?: number
  showProgress?: boolean
  className?: string
}

export function EnhancedSkeleton({ 
  variant, 
  count = 3, 
  showProgress = false,
  className 
}: EnhancedSkeletonProps) {
  const skeletonVariants = {
    table: (
      <div className="space-y-3">
        {/* Table header */}
        <div className="grid grid-cols-6 gap-4 py-3 border-b">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-18" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        {/* Table rows */}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 py-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        ))}
      </div>
    ),
    
    form: (
      <div className="space-y-6">
        {/* Form sections */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" /> {/* Section title */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-16 mb-2" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
        
        {/* Pricing section */}
        <div className="space-y-4 p-4 border rounded-lg">
          <Skeleton className="h-5 w-24" />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Skeleton className="h-3 w-12 mb-1" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div>
              <Skeleton className="h-3 w-12 mb-1" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </div>
    ),
    
    card: (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex gap-4 text-sm">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    ),
    
    list: (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 px-4 border-b">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("animate-pulse", className)}>
      {showProgress && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>데이터 로딩 중...</span>
            <span>잠시만 기다려주세요</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full animate-pulse w-2/3"></div>
          </div>
        </div>
      )}
      {skeletonVariants[variant]}
    </div>
  )
}

// 특정 상황별 스켈레톤 컴포넌트
export function CharterFormSkeleton() {
  return <EnhancedSkeleton variant="form" showProgress />
}

export function CharterTableSkeleton({ count = 5 }: { count?: number }) {
  return <EnhancedSkeleton variant="table" count={count} showProgress />
}

export function CharterCardSkeleton({ count = 3 }: { count?: number }) {
  return <EnhancedSkeleton variant="card" count={count} />
}