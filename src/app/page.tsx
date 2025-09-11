import Link from 'next/link'
import { DashboardStats } from '@/components/DashboardStats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Truck, 
  MapPin, 
  Route, 
  Calculator, 
  Upload 
} from 'lucide-react'
import '@/styles/design-system.css'

const featureCards = [
  {
    title: '기사 관리',
    description: '기사 정보 등록, 수정, 상태 관리 및 운행 이력 추적',
    href: '/drivers',
    icon: Users,
    status: 'CRUD 완료',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    hoverColor: 'group-hover:bg-blue-100'
  },
  {
    title: '차량 관리',
    description: '차량 등록, 기사 배정, 소유권 관리 및 운행 상태 추적',
    href: '/vehicles',
    icon: Truck,
    status: 'CRUD 완료',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    hoverColor: 'group-hover:bg-orange-100'
  },
  {
    title: '노선 관리',
    description: '운행 노선 등록, 요일별 패턴 설정 및 운임 요율 관리',
    href: '/routes',
    icon: Route,
    status: 'CRUD 완료',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    hoverColor: 'group-hover:bg-indigo-100'
  },
  {
    title: '운행 관리',
    description: '일별 운행 등록, 상태 변경 및 결행/대차 처리 관리',
    href: '/trips',
    icon: MapPin,
    status: 'CRUD 완료',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    hoverColor: 'group-hover:bg-green-100'
  },
  {
    title: '정산 관리',
    description: '월별 정산 생성, 미리보기, 확정 및 엑셀 내보내기',
    href: '/settlements',
    icon: Calculator,
    status: 'CRUD 완료',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    hoverColor: 'group-hover:bg-emerald-100'
  },
  {
    title: '데이터 가져오기',
    description: 'CSV 파일로 기사 및 운행 데이터 일괄 등록 및 검증',
    href: '/import/drivers',
    icon: Upload,
    status: 'API 완료',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    hoverColor: 'group-hover:bg-purple-100'
  }
]

export default function HomePage() {
  return (
    <>
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          대시보드
        </h1>
        <p className="text-slate-600 mt-2">
          운송업무 통합 관리 플랫폼에 오신 것을 환영합니다
        </p>
      </div>

      {/* 통계 대시보드 */}
      <div className="mb-8">
        <DashboardStats />
      </div>

      {/* 주요 기능 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {featureCards.map((feature) => {
          const Icon = feature.icon
          return (
            <Link key={feature.href} href={feature.href} className="group">
              <Card className="h-full group-hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 ${feature.bgColor} rounded-lg ${feature.hoverColor} transition-colors`}>
                      <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="group-hover:text-sky-600 transition-colors">
                        {feature.title}
                      </CardTitle>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {feature.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* 시스템 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 시스템 상태 */}
        <Card>
          <CardHeader>
            <CardTitle>시스템 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">데이터베이스</span>
              <span className="flex items-center text-green-600 text-sm font-medium">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                정상
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">API 서버</span>
              <span className="flex items-center text-green-600 text-sm font-medium">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                정상
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">백업</span>
              <span className="flex items-center text-amber-600 text-sm font-medium">
                <span className="h-2 w-2 bg-amber-500 rounded-full mr-2"></span>
                진행중
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 최근 업데이트 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 업데이트</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-slate-600">운행 관리 모달 개선</span>
              <span className="text-xs text-slate-500">오늘</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-slate-600">정산 Excel 내보내기</span>
              <span className="text-xs text-slate-500">1일 전</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-slate-600">차량 배정 시스템</span>
              <span className="text-xs text-slate-500">2일 전</span>
            </div>
          </CardContent>
        </Card>

        {/* 도움말 */}
        <Card>
          <CardHeader>
            <CardTitle>도움말 & 지원</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="#" className="block text-sm text-slate-600 hover:text-sky-600 transition-colors">
              → 사용자 매뉴얼
            </a>
            <a href="#" className="block text-sm text-slate-600 hover:text-sky-600 transition-colors">
              → FAQ 자주묻는질문
            </a>
            <a href="#" className="block text-sm text-slate-600 hover:text-sky-600 transition-colors">
              → 기술 지원 요청
            </a>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                문의: support@transport.co.kr
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}