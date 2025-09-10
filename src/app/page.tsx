import Link from 'next/link'
import { Truck, Users, Route, Calculator, Settings, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-primary-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                운송기사관리 시스템
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              MVP v1.0.0
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            운송기사관리 시스템에 오신 것을 환영합니다
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            기사, 차량, 운행, 정산을 통합 관리하여 효율적인 운송업무를 지원합니다.
          </p>
        </div>

        {/* 기능 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* 기사 관리 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body text-center">
              <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                기사 관리
              </h3>
              <p className="text-gray-600 mb-4">
                기사 정보 등록, 수정 및 차량 배정 관리
              </p>
              <Link
                href="/drivers"
                className="btn btn-primary"
              >
                기사 관리
              </Link>
            </div>
          </div>

          {/* 차량 관리 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body text-center">
              <Truck className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                차량 관리
              </h3>
              <p className="text-gray-600 mb-4">
                차량 등록, 소유권 구분 및 배정 현황
              </p>
              <Link
                href="/vehicles"
                className="btn btn-primary"
              >
                차량 관리
              </Link>
            </div>
          </div>

          {/* 노선 관리 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body text-center">
              <Route className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                노선 관리
              </h3>
              <p className="text-gray-600 mb-4">
                고정 노선 템플릿 및 요일별 패턴 설정
              </p>
              <Link
                href="/routes"
                className="btn btn-primary"
              >
                노선 관리
              </Link>
            </div>
          </div>

          {/* 운행 관리 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body text-center">
              <BarChart3 className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                운행 관리
              </h3>
              <p className="text-gray-600 mb-4">
                일일 운행 현황, 결행/대차 처리
              </p>
              <Link
                href="/trips"
                className="btn btn-primary"
              >
                운행 관리
              </Link>
            </div>
          </div>

          {/* 정산 관리 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body text-center">
              <Calculator className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                정산 관리
              </h3>
              <p className="text-gray-600 mb-4">
                월별 정산 처리, 미리보기 및 엑셀 내보내기
              </p>
              <Link
                href="/settlements"
                className="btn btn-primary"
              >
                정산 관리
              </Link>
            </div>
          </div>

          {/* 관리자 */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="card-body text-center">
              <Settings className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                시스템 관리
              </h3>
              <p className="text-gray-600 mb-4">
                사용자 권한, 감사 로그, 시스템 설정
              </p>
              <Link
                href="/admin"
                className="btn btn-primary"
              >
                관리자
              </Link>
            </div>
          </div>
        </div>

        {/* 시스템 상태 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            시스템 상태
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">DB</div>
              <div className="text-sm text-gray-600">연결 상태</div>
              <div className="badge badge-success mt-1">정상</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">API</div>
              <div className="text-sm text-gray-600">응답 시간</div>
              <div className="badge badge-success mt-1">&lt;100ms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">Storage</div>
              <div className="text-sm text-gray-600">사용량</div>
              <div className="badge badge-success mt-1">25%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">Backup</div>
              <div className="text-sm text-gray-600">마지막</div>
              <div className="badge badge-success mt-1">오늘</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}