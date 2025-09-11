import Link from 'next/link'
import { DashboardStats } from '@/components/DashboardStats'
import '@/styles/design-system.css'

export default function HomePage() {
  return (
    <div className="page-container">
      {/* 헤더 */}
      <header className="page-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h1 className="text-heading-2 text-slate-900">
                  운송기사관리 시스템
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">Transportation Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-caption text-slate-600">시스템 정상</span>
              </div>
              <div className="text-caption text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                MVP v1.0.0
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="page-content">
        {/* 환영 섹션 */}
        <div className="text-center mb-8">
          <h2 className="text-heading-1 text-slate-900 mb-3">
            운송업무 통합 관리 플랫폼
          </h2>
          <p className="text-body-secondary max-w-3xl mx-auto leading-relaxed">
            기사, 차량, 노선, 운행, 정산을 하나의 시스템에서 통합 관리하여<br/>
            효율적인 운송업무 운영과 데이터 기반 의사결정을 지원합니다.
          </p>
        </div>

        {/* 통계 대시보드 */}
        <DashboardStats />

        {/* 주요 기능 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 기사 관리 */}
          <Link href="/drivers" className="group">
            <div className="card card-hover p-6 group-focus:ring-2 group-focus:ring-sky-500 group-focus:ring-offset-2">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-heading-3 text-slate-900 group-hover:text-blue-600 transition-colors">
                      기사 관리
                    </h3>
                    <svg className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-body-secondary mb-3 line-clamp-2">
                    기사 정보 등록, 수정, 상태 관리 및<br/>운행 이력 추적
                  </p>
                  <div className="flex items-center space-x-4 text-caption text-slate-500">
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
                      CRUD 완료
                    </span>
                    <span>프로필 관리</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* 차량 관리 */}
          <Link href="/vehicles" className="group">
            <div className="card card-hover p-6 group-focus:ring-2 group-focus:ring-sky-500 group-focus:ring-offset-2">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                  <svg className="h-7 w-7 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2a2 2 0 00-2-2H8V7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-heading-3 text-slate-900 group-hover:text-orange-600 transition-colors">
                      차량 관리
                    </h3>
                    <svg className="h-5 w-5 text-slate-400 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-body-secondary mb-3 line-clamp-2">
                    차량 등록, 기사 배정, 소유권 관리 및<br/>운행 상태 추적
                  </p>
                  <div className="flex items-center space-x-4 text-caption text-slate-500">
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
                      CRUD 완료
                    </span>
                    <span>배정 관리</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* 노선 관리 */}
          <Link href="/routes" className="group">
            <div className="card card-hover p-6 group-focus:ring-2 group-focus:ring-sky-500 group-focus:ring-offset-2">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <svg className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-heading-3 text-slate-900 group-hover:text-indigo-600 transition-colors">
                      노선 관리
                    </h3>
                    <svg className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-body-secondary mb-3 line-clamp-2">
                    운행 노선 등록, 요일별 패턴 설정 및<br/>운임 요율 관리
                  </p>
                  <div className="flex items-center space-x-4 text-caption text-slate-500">
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
                      CRUD 완료
                    </span>
                    <span>요금 관리</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* 운행 관리 */}
          <Link href="/trips" className="group">
            <div className="card card-hover p-6 group-focus:ring-2 group-focus:ring-sky-500 group-focus:ring-offset-2">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                  <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-heading-3 text-slate-900 group-hover:text-green-600 transition-colors">
                      운행 관리
                    </h3>
                    <svg className="h-5 w-5 text-slate-400 group-hover:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-body-secondary mb-3 line-clamp-2">
                    일별 운행 등록, 상태 변경 및<br/>결행/대차 처리 관리
                  </p>
                  <div className="flex items-center space-x-4 text-caption text-slate-500">
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
                      CRUD 완료
                    </span>
                    <span>상태 관리</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* 정산 관리 */}
          <Link href="/settlements" className="group">
            <div className="card card-hover p-6 group-focus:ring-2 group-focus:ring-sky-500 group-focus:ring-offset-2">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                  <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-heading-3 text-slate-900 group-hover:text-emerald-600 transition-colors">
                      정산 관리
                    </h3>
                    <svg className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-body-secondary mb-3 line-clamp-2">
                    월별 정산 생성, 미리보기, 확정 및<br/>엑셀 내보내기
                  </p>
                  <div className="flex items-center space-x-4 text-caption text-slate-500">
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
                      CRUD 완료
                    </span>
                    <span>Excel 출력</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* 데이터 가져오기 */}
          <Link href="/import/drivers" className="group">
            <div className="card card-hover p-6 group-focus:ring-2 group-focus:ring-sky-500 group-focus:ring-offset-2">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <svg className="h-7 w-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-heading-3 text-slate-900 group-hover:text-purple-600 transition-colors">
                      데이터 가져오기
                    </h3>
                    <svg className="h-5 w-5 text-slate-400 group-hover:text-purple-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-body-secondary mb-3 line-clamp-2">
                    CSV 파일로 기사 및 운행 데이터<br/>일괄 등록 및 검증
                  </p>
                  <div className="flex items-center space-x-4 text-caption text-slate-500">
                    <span className="flex items-center">
                      <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
                      API 완료
                    </span>
                    <span>CSV 업로드</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 추가 정보 섹션 */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 시스템 상태 */}
          <div className="card p-6">
            <h3 className="text-heading-3 text-slate-900 mb-4">시스템 상태</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-body-secondary">데이터베이스</span>
                <span className="flex items-center text-green-600 text-sm font-medium">
                  <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                  정상
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-secondary">API 서버</span>
                <span className="flex items-center text-green-600 text-sm font-medium">
                  <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                  정상
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-secondary">백업</span>
                <span className="flex items-center text-amber-600 text-sm font-medium">
                  <span className="h-2 w-2 bg-amber-500 rounded-full mr-2"></span>
                  진행중
                </span>
              </div>
            </div>
          </div>

          {/* 최근 업데이트 */}
          <div className="card p-6">
            <h3 className="text-heading-3 text-slate-900 mb-4">최근 업데이트</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-body-secondary">운행 관리 모달 개선</span>
                <span className="text-caption text-slate-500">오늘</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-body-secondary">정산 Excel 내보내기</span>
                <span className="text-caption text-slate-500">1일 전</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-body-secondary">차량 배정 시스템</span>
                <span className="text-caption text-slate-500">2일 전</span>
              </div>
            </div>
          </div>

          {/* 도움말 */}
          <div className="card p-6">
            <h3 className="text-heading-3 text-slate-900 mb-4">도움말 & 지원</h3>
            <div className="space-y-3">
              <a href="#" className="block text-body-secondary hover:text-blue-600 transition-colors">
                → 사용자 매뉴얼
              </a>
              <a href="#" className="block text-body-secondary hover:text-blue-600 transition-colors">
                → FAQ 자주묻는질문
              </a>
              <a href="#" className="block text-body-secondary hover:text-blue-600 transition-colors">
                → 기술 지원 요청
              </a>
              <div className="pt-2 border-t border-slate-200">
                <p className="text-caption text-slate-500">
                  문의: support@transport.co.kr
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}