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
  BarChart3
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
    title: '차량 관리',
    description: '차량 등록, 기사 배정 관리',
    href: '/vehicles',
    icon: Truck,
    color: 'orange',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    hoverColor: 'hover:bg-orange-100',
    borderColor: 'hover:border-orange-300'
  },
  {
    title: '노선 관리',
    description: '운행 노선, 요율 설정',
    href: '/routes',
    icon: Route,
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    hoverColor: 'hover:bg-indigo-100',
    borderColor: 'hover:border-indigo-300'
  },
  {
    title: '운행 관리',
    description: '일별 운행, 결행/대차 처리',
    href: '/trips',
    icon: MapPin,
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
    href: '/import/drivers',
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">빠른 작업</h2>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            <span>관리 도구</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon

          return (
            <Link key={action.href} href={action.href} className="group">
              <Card className={`h-full transition-all duration-200 hover:shadow-md ${action.borderColor} border`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 ${action.bgColor} rounded-lg ${action.hoverColor} transition-colors`}>
                      <Icon className={`h-5 w-5 ${action.iconColor}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <CardTitle className="text-base group-hover:text-sky-600 transition-colors">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
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
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-medium text-slate-700 mb-3">추가 작업</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link 
            href="/trips?action=new" 
            className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
              <Plus className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-slate-900 text-sm group-hover:text-green-600 transition-colors">
                새 운행 등록
              </div>
              <div className="text-xs text-slate-500">
                새로운 운행 일정 추가
              </div>
            </div>
            <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-green-600 transition-colors ml-auto" />
          </Link>

          <Link 
            href="/settlements?action=generate" 
            className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <div className="font-medium text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                정산 생성
              </div>
              <div className="text-xs text-slate-500">
                이달 정산 자동 생성
              </div>
            </div>
            <ArrowRight className="h-3 w-3 text-slate-400 group-hover:text-emerald-600 transition-colors ml-auto" />
          </Link>
        </div>
      </div>
    </div>
  )
}