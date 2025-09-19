'use client'

import React from 'react'
import { Route, User, Truck, Calculator, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const managementPages = [
  {
    id: 'fixed-routes',
    title: '고정관리',
    subtitle: '정기 운송 노선 관리',
    description: '고정 운송 노선을 체계적으로 관리하고 계약 정보, 운행 일정, 담당 기사를 효율적으로 추적할 수 있습니다.',
    icon: Route,
    href: '/fixed-routes',
    colorScheme: 'indigo/violet',
    bgGradient: 'from-indigo-50 to-violet-50',
    borderColor: 'border-indigo-200',
    iconBg: 'bg-gradient-to-r from-indigo-500 to-violet-500',
    buttonClass: 'from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600',
    features: [
      '노선별 상세 정보 관리',
      '운행 일정 및 빈도 설정',
      '담당 기사 및 차량 배정',
      '요금 및 할증료 관리',
      '계약 기간 추적'
    ]
  },
  {
    id: 'enhanced-drivers',
    title: '기사관리',
    subtitle: '운송 기사 통합 관리',
    description: '기사의 기본 정보, 면허 정보, 차량 배정, 실적 관리를 통합적으로 수행하고 평가 시스템을 통해 관리할 수 있습니다.',
    icon: User,
    href: '/enhanced-drivers',
    colorScheme: 'blue/cyan',
    bgGradient: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
    iconBg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    buttonClass: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
    features: [
      '기사 상세 프로필 관리',
      '면허 및 자격 정보',
      '운행 실적 및 평가',
      '차량 배정 관리',
      '연락처 및 비상연락망'
    ]
  },
  {
    id: 'enhanced-vehicles',
    title: '용차관리',
    subtitle: '운송 차량 종합 관리',
    description: '차량의 기본 사양, 정비 이력, 보험 및 검사 일정, 운행 상태를 종합적으로 관리하고 추적할 수 있습니다.',
    icon: Truck,
    href: '/enhanced-vehicles',
    colorScheme: 'green/emerald',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    iconBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
    buttonClass: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
    features: [
      '차량 기본 정보 및 사양',
      '정비 이력 및 일정 관리',
      '보험/검사 만료일 추적',
      '운행 상태 실시간 모니터링',
      '소유자 및 기사 배정'
    ]
  },
  {
    id: 'rates',
    title: '요율관리',
    subtitle: '운송 요율 체계 관리',
    description: '다양한 기준의 운송 요율을 설정하고 할증료, 적용 조건, 유효 기간을 체계적으로 관리할 수 있습니다.',
    icon: Calculator,
    href: '/rates',
    colorScheme: 'purple/pink',
    bgGradient: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
    iconBg: 'bg-gradient-to-r from-purple-500 to-pink-500',
    buttonClass: 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    features: [
      '다양한 기준 요율 설정',
      '할증료 및 부가 요금',
      '지역별/차량별 요율',
      '유효 기간 관리',
      '요금 계산 시뮬레이션'
    ]
  }
]

const designSystemFeatures = [
  {
    title: '통일된 디자인 시스템',
    description: '모든 관리 페이지에서 일관된 UX/UI 패턴 적용'
  },
  {
    title: '색상 테마 시스템',
    description: '각 관리 영역별 고유 색상으로 직관적 구분'
  },
  {
    title: '재사용 가능한 컴포넌트',
    description: '공통 컴포넌트로 개발 효율성 및 유지보수성 확보'
  },
  {
    title: '반응형 디자인',
    description: '모든 디바이스에서 최적화된 사용자 경험'
  },
  {
    title: '접근성 준수',
    description: 'WCAG 2.1 AA 수준의 웹 접근성 기준 준수'
  },
  {
    title: '성능 최적화',
    description: '빠른 로딩과 부드러운 상호작용을 위한 최적화'
  }
]

export default function ManagementDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              물류 관리 시스템 데모
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Next.js 14와 현대적인 디자인 시스템을 활용한 4개의 관리 페이지 구현
            </p>
            <div className="mt-6 flex justify-center">
              <Badge variant="outline" className="px-4 py-2 text-lg font-medium bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                Production Ready
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Management Pages Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            관리 페이지 데모
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {managementPages.map((page) => (
              <Card key={page.id} className={cn("bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden", page.borderColor)}>
                {/* Card Header with Gradient */}
                <CardHeader className={cn("bg-gradient-to-r pb-6", page.bgGradient)}>
                  <div className="flex items-center space-x-4">
                    <div className={cn("p-3 rounded-xl shadow-lg", page.iconBg)}>
                      <page.icon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        {page.title}
                      </CardTitle>
                      <p className="text-lg text-gray-600 mt-1">
                        {page.subtitle}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {page.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-gray-900">주요 기능:</h4>
                    <ul className="space-y-2">
                      {page.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Color Scheme Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <Badge variant="outline" className="text-sm bg-gray-50 text-gray-700">
                      색상: {page.colorScheme}
                    </Badge>
                  </div>

                  {/* Action Button */}
                  <Button asChild className={cn("w-full text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 bg-gradient-to-r", page.buttonClass)}>
                    <Link href={page.href} className="flex items-center justify-center">
                      {page.title} 페이지 보기
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Design System Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            디자인 시스템 특징
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designSystemFeatures.map((feature, index) => (
              <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Technical Implementation */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            기술 구현 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                사용된 기술 스택
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Next.js 14</strong> - App Router 패턴</li>
                <li>• <strong>React 18</strong> - TypeScript 지원</li>
                <li>• <strong>Tailwind CSS</strong> - 유틸리티 기반 스타일링</li>
                <li>• <strong>shadcn/ui</strong> - 컴포넌트 라이브러리</li>
                <li>• <strong>Lucide React</strong> - 일관된 아이콘 시스템</li>
                <li>• <strong>React Hot Toast</strong> - 사용자 피드백</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                구현 특징
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• 색상 테마 시스템 (4가지 고유 색상)</li>
                <li>• 재사용 가능한 ThemedManagementPage 컴포넌트</li>
                <li>• TypeScript 인터페이스와 더미 데이터</li>
                <li>• 컨텍스트 메뉴 및 대량 작업 지원</li>
                <li>• 반응형 디자인 및 접근성 준수</li>
                <li>• 모달 폼 및 검색/필터 기능</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            각 관리 페이지 바로가기
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {managementPages.map((page) => (
              <Button
                key={page.id}
                asChild
                variant="outline"
                className={cn("px-6 py-3 text-sm font-medium hover:scale-105 transition-all duration-200", page.borderColor)}
              >
                <Link href={page.href} className="flex items-center">
                  <page.icon className="h-4 w-4 mr-2" />
                  {page.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}