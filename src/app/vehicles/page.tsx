'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

export default function VehiclesPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          차량 관리 기능이 비활성화되었습니다
        </h1>
        <p className="text-gray-600 mb-6">
          차량 모델이 제거되고 센터 관리 시스템으로 변경되었습니다. 
          센터 관리 페이지를 이용해주세요.
        </p>
        <a
          href="/loading-points"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          센터 관리로 이동
        </a>
      </div>
    </div>
  )
}