'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Upload, FileText, User, Truck, Route, Calendar, Download, ArrowRight, CheckCircle, MapPin } from 'lucide-react'
import { ImportModal } from '@/components/import/ImportModal'
import { ImportType } from '@/components/import/types'

const importModules = [
  {
    title: '기사 가져오기',
    description: '운송기사 정보를 CSV 파일로 일괄 등록',
    icon: User,
    type: 'drivers',
    color: 'blue',
    features: ['이름, 전화번호 필수', '계좌정보 포함 가능', '중복 전화번호 자동 제외'],
    templateUrl: '/api/templates/drivers'
  },
  {
    title: '상차지 가져오기',
    description: '상차지 정보를 CSV 파일로 일괄 등록',
    icon: MapPin,
    type: 'loading-points',
    color: 'orange',
    features: ['센터명, 상차지명 필수', '담당자 정보 포함', '중복 상차지명 자동 제외'],
    templateUrl: '/api/templates/loading-points'
  },
  {
    title: '고정계약 가져오기',
    description: '고정계약 정보를 CSV 파일로 일괄 등록',
    icon: Route,
    type: 'fixed-contracts',
    color: 'purple',
    features: ['노선명, 계약형태 필수', '매출/비용 정보', '중복 노선명 자동 제외'],
    templateUrl: '/api/templates/fixed-contracts'
  }
]

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700'
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200', 
    text: 'text-orange-800',
    icon: 'text-orange-600',
    button: 'bg-orange-600 hover:bg-orange-700'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800', 
    icon: 'text-purple-600',
    button: 'bg-purple-600 hover:bg-purple-700'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-600',
    button: 'bg-green-600 hover:bg-green-700'
  }
} as const

export default function ImportPage() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedImportType, setSelectedImportType] = useState<ImportType>('drivers')

  const handleTemplateDownload = (templateUrl: string, filename: string) => {
    fetch(templateUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      })
      .catch(error => {
        console.error('Template download failed:', error)
      })
  }

  const handleImportStart = (type: ImportType) => {
    setSelectedImportType(type)
    setIsImportModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Upload className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                데이터 가져오기
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                메인으로
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="w-full py-6 px-4">
        <div className="space-y-8">
          {/* 안내 섹션 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <FileText className="h-6 w-6 text-blue-600 mt-0.5" />
              <div className="ml-3">
                <h2 className="text-lg font-medium text-blue-900">
                  CSV 파일 업로드 안내
                </h2>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>CSV 파일의 첫 번째 행은 헤더로 사용됩니다</li>
                    <li>각 모듈별로 필수 컬럼이 다르니 템플릿을 확인해주세요</li>
                    <li>업로드 전 검증 단계를 통해 오류를 미리 확인할 수 있습니다</li>
                    <li>최대 파일 크기: 10MB</li>
                    <li>중복 데이터는 자동으로 제외됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 가져오기 모듈 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {importModules.map((module) => {
              const colors = colorClasses[module.color as keyof typeof colorClasses]
              const Icon = module.icon
              
              return (
                <div
                  key={module.type}
                  className={`${colors.bg} ${colors.border} border rounded-lg p-6 transition-all duration-200 hover:shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Icon className={`h-6 w-6 ${colors.icon}`} />
                      </div>
                      <h3 className={`ml-3 text-lg font-semibold ${colors.text}`}>
                        {module.title}
                      </h3>
                    </div>
                  </div>

                  <p className={`text-sm ${colors.text} mb-4`}>
                    {module.description}
                  </p>

                  {/* 기능 목록 */}
                  <div className="mb-4">
                    <ul className="space-y-1">
                      {module.features.map((feature, index) => (
                        <li key={index} className={`flex items-center text-xs ${colors.text}`}>
                          <CheckCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleTemplateDownload(
                        module.templateUrl,
                        `${module.title.replace(' 가져오기', '')}_템플릿.csv`
                      )}
                      className={`inline-flex items-center px-3 py-2 text-xs font-medium text-white rounded-md transition-colors ${colors.button}`}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      템플릿
                    </button>
                    
                    <button
                      onClick={() => handleImportStart(module.type as ImportType)}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${colors.button}`}
                    >
                      시작하기
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 하단 도움말 */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              도움이 필요하신가요?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              CSV 파일 형식이나 가져오기 과정에서 문제가 발생하면 다음 사항을 확인해보세요:
            </p>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>파일이 UTF-8 인코딩으로 저장되었는지 확인</li>
              <li>Excel에서 CSV로 저장할 때 &quot;CSV UTF-8(쉼표 구분자)&quot; 선택</li>
              <li>필수 컬럼이 모두 포함되었는지 템플릿과 비교</li>
              <li>데이터 형식이 올바른지 확인 (날짜, 숫자 등)</li>
            </ul>
          </div>
        </div>
      </main>

      {/* 통합 임포트 모달 */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type={selectedImportType}
        onSuccess={() => {
          setIsImportModalOpen(false)
          // 성공 시 각 해당 페이지로 리다이렉션하거나 새로고침 등 처리
        }}
      />
    </div>
  )
}