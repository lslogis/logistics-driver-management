'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowRight, 
  Shield, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Truck,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  // 이미 로그인된 사용자는 대시보드로 자동 리다이렉트 (루프 방지)
  useEffect(() => {
    // 이미 리다이렉트했거나 현재 루트 페이지가 아니면 중단
    if (hasRedirected.current || pathname !== '/') {
      return
    }

    // 인증된 사용자만 리다이렉트
    if (status === 'authenticated' && session?.user) {
      console.log('✅ [LANDING] User already authenticated, redirecting to dashboard')
      hasRedirected.current = true
      router.replace('/dashboard') // push 대신 replace 사용
    }
  }, [status, session, pathname, router])

  // 로딩 중일 때는 로딩 화면 표시
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 이미 로그인된 사용자는 리다이렉트 중 메시지 표시
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드로 이동 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* 헤더 */}
      <header className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <Truck className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-slate-800 bg-clip-text text-transparent">
                  LogiFlow
                </span>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                기능
              </a>
              <a href="#benefits" className="text-gray-600 hover:text-blue-600 transition-colors">
                장점
              </a>
              <Link 
                href="/auth/signin?callbackUrl=/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                로그인
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 히어로 섹션 */}
      <main>
        <section className="relative pt-12 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                <span className="block">운송업무를</span>
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  스마트하게
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                LogiFlow는 운송회사의 기사 관리, 운행 스케줄링, 정산 처리를 하나의 플랫폼에서 
                통합 관리할 수 있는 올인원 솔루션입니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/signin?callbackUrl=/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  서비스 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  자세히 알아보기
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 주요 기능 섹션 */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                모든 운송업무를 한 곳에서
              </h2>
              <p className="text-xl text-gray-600">
                복잡한 운송업무를 간편하게 관리할 수 있는 핵심 기능들
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 기사 관리 */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">기사 관리</h3>
                <p className="text-gray-600">
                  기사 정보, 연락처, 차량 정보를 체계적으로 관리하고 실시간으로 소통하세요.
                </p>
              </div>

              {/* 운행 스케줄링 */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">운행 스케줄링</h3>
                <p className="text-gray-600">
                  효율적인 배차 계획과 실시간 운행 상태 추적으로 업무 효율성을 높이세요.
                </p>
              </div>

              {/* 정산 관리 */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">정산 관리</h3>
                <p className="text-gray-600">
                  정확하고 투명한 정산 처리로 기사와의 신뢰 관계를 구축하세요.
                </p>
              </div>

              {/* 보고서 및 분석 */}
              <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">보고서 및 분석</h3>
                <p className="text-gray-600">
                  데이터 기반의 인사이트로 더 나은 비즈니스 결정을 내리세요.
                </p>
              </div>

              {/* 권한 관리 */}
              <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">권한 관리</h3>
                <p className="text-gray-600">
                  역할별 접근 권한으로 보안을 강화하고 업무 효율성을 높이세요.
                </p>
              </div>

              {/* 실시간 알림 */}
              <div className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl">
                <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">실시간 알림</h3>
                <p className="text-gray-600">
                  중요한 업무 상황을 즉시 알림받아 신속하게 대응하세요.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 장점 섹션 */}
        <section id="benefits" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                왜 LogiFlow를 선택해야 할까요?
              </h2>
              <p className="text-xl text-gray-600">
                검증된 솔루션으로 운송업무의 디지털 전환을 경험하세요
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">업무 효율성 향상</h3>
                <p className="text-gray-600">
                  수작업을 줄이고 자동화된 프로세스로 업무 효율성을 크게 향상시킵니다.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">정확한 정산</h3>
                <p className="text-gray-600">
                  투명하고 정확한 정산 시스템으로 기사와의 신뢰 관계를 구축합니다.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">보안 및 권한 관리</h3>
                <p className="text-gray-600">
                  엔터프라이즈급 보안과 세밀한 권한 관리로 안전한 업무 환경을 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              LogiFlow로 운송업무의 새로운 경험을 시작해보세요
            </p>
            <Link
              href="/auth/signin?callbackUrl=/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
            >
              무료로 시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Truck className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold">LogiFlow</span>
            </div>
            <p className="text-gray-400">
              운송업무의 디지털 전환을 위한 스마트 솔루션
            </p>
            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-gray-500 text-sm">
                © 2024 LogiFlow. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
