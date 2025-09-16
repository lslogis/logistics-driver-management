'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Truck, 
  Route, 
  Calculator, 
  Upload, 
  MapPin,
  ArrowRight,
  Plus,
  FileText,
  BarChart3,
  Calendar
} from 'lucide-react'

const quickActions = [
  {
    title: '기사 관리',
    description: '기사 등록, 수정, 상태 관리',
    href: '/drivers',
    icon: Users,
    color: 'blue',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    hoverColor: 'hover:bg-blue-100',
    borderColor: 'hover:border-blue-300'
  },
  {
    title: '고정노선 관리',
    description: '고정노선 등록, 기사 배정',
    href: '/fixed-routes',
    icon: Route,
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    hoverColor: 'hover:bg-indigo-100',
    borderColor: 'hover:border-indigo-300'
  },
  {
    title: '센터 관리',
    description: '센터 등록, 담당자 관리',
    href: '/loading-points',
    icon: MapPin,
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    hoverColor: 'hover:bg-cyan-100',
    borderColor: 'hover:border-cyan-300'
  },
  {
    title: '운행 관리',
    description: '일별 운행, 결행/대차 처리',
    href: '/trips',
    icon: Calendar,
    color: 'green',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    hoverColor: 'hover:bg-green-100',
    borderColor: 'hover:border-green-300'
  },
  {
    title: '정산 관리',
    description: '월별 정산, 엑셀 내보내기',
    href: '/settlements',
    icon: Calculator,
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    hoverColor: 'hover:bg-emerald-100',
    borderColor: 'hover:border-emerald-300'
  },
  {
    title: '데이터 가져오기',
    description: 'CSV 파일 일괄 등록',
    href: '/import',
    icon: Upload,
    color: 'purple',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    hoverColor: 'hover:bg-purple-100',
    borderColor: 'hover:border-purple-300'
  }
]

export function QuickActionsSection() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">빠른 작업</h2>
          <p className="text-slate-600 text-sm mt-1">자주 사용하는 기능에 빠르게 접근하세요</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          <BarChart3 className="h-3 w-3" />
          <span>관리 도구</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon

          return (
            <Link key={action.href} href={action.href} className="group">
              <Card className={`h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${action.borderColor} border-0 shadow-sm bg-gradient-to-br from-white to-${action.color}-50/30`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 ${action.bgColor} rounded-xl ${action.hoverColor} transition-all duration-300 group-hover:scale-110 shadow-sm`}>
                      <Icon className={`h-5 w-5 ${action.iconColor}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <CardTitle className="text-base group-hover:text-blue-600 transition-colors font-semibold">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed text-slate-500">
                      {action.description}
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* 추가 빠른 작업 */}
      <div className="mt-8 pt-6 border-t border-slate-200/60">
        <h3 className="text-base font-semibold text-slate-700 mb-4">추가 작업</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link 
            href="/trips?action=new" 
            className="group flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2.5 bg-green-100 rounded-xl group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300 shadow-sm">
              <Plus className="h-4 w-4 text-green-700" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-900 text-sm group-hover:text-green-700 transition-colors">
                새 운행 등록
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                새로운 운행 일정 추가
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all duration-300" />
          </Link>

          <Link 
            href="/settlements?action=generate" 
            className="group flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2.5 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 group-hover:scale-110 transition-all duration-300 shadow-sm">
              <FileText className="h-4 w-4 text-emerald-700" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                정산 생성
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                이달 정산 자동 생성
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-300" />
          </Link>
        </div>
      </div>
    </div>
  )
}