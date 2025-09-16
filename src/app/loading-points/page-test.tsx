'use client'

import React, { useState } from 'react'
import { Plus, MapPin, Edit, X, UserX, CheckCircle } from 'lucide-react'
import { useLoadingPoints } from '@/hooks/useLoadingPoints'
import ManagementPageLayout from '@/components/layout/ManagementPageLayout'

export default function LoadingPointsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading, error } = useLoadingPoints(searchTerm)
  
  const loadingPointsData = data?.pages?.flatMap((page: any) => page.items || []) || []
  const totalCount = data?.pages?.[0]?.totalCount || 0

  return (
    <ManagementPageLayout
      title="상차지 관리"
      icon={<MapPin />}
      totalCount={totalCount}
      countLabel="곳"
      primaryAction={{
        label: '상차지 등록',
        onClick: () => console.log('Create clicked'),
        icon: <Plus className="h-4 w-4" />,
      }}
      searchFilters={[
        {
          label: '검색',
          type: 'text',
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: '센터명, 상차지명, 주소로 검색...',
        },
      ]}
      isLoading={isLoading}
      error={error ? String(error) : undefined}
    >
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex space-x-2 mb-4">
          <Edit className="h-4 w-4" />
          <UserX className="h-4 w-4" />
          <CheckCircle className="h-4 w-4" />
          <X className="h-4 w-4" />
        </div>
        <p>Testing with ManagementPageLayout</p>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Error: {error ? String(error) : 'None'}</p>
        <p>Data count: {loadingPointsData.length}</p>
        <p>Total: {totalCount}</p>
        
        {/* Test DataTable with minimal props */}
        {loadingPointsData.length > 0 && (
          <div className="mt-6">
            <table className="w-full border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">센터명</th>
                  <th className="p-2 text-left">상차지명</th>
                  <th className="p-2 text-left">상태</th>
                </tr>
              </thead>
              <tbody>
                {loadingPointsData.slice(0, 3).map((item: any) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">{item.centerName}</td>
                    <td className="p-2">{item.loadingPointName}</td>
                    <td className="p-2">
                      {item.isActive ? (
                        <span className="text-green-600">활성</span>
                      ) : (
                        <span className="text-red-600">비활성</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ManagementPageLayout>
  )
}