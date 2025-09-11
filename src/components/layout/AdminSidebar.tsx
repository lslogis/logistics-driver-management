'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  MapPin, 
  Route, 
  Calculator, 
  Upload, 
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  TrendingUp,
  Settings,
  HelpCircle
} from 'lucide-react'

const navigation = [
  { 
    name: '대시보드', 
    href: '/', 
    icon: LayoutDashboard,
    badge: null,
    description: '전체 현황 조회'
  },
  { 
    name: '기사 관리', 
    href: '/drivers', 
    icon: Users,
    badge: 'HOT',
    description: '운송기사 등록 및 관리'
  },
  { 
    name: '차량 관리', 
    href: '/vehicles', 
    icon: Truck,
    badge: null,
    description: '차량 정보 및 배정'
  },
  { 
    name: '노선 관리', 
    href: '/routes', 
    icon: Route,
    badge: null,
    description: '운송 노선 설정'
  },
  { 
    name: '운행 관리', 
    href: '/trips', 
    icon: MapPin,
    badge: 'NEW',
    description: '일일 운행 기록'
  },
  { 
    name: '정산 관리', 
    href: '/settlements', 
    icon: Calculator,
    badge: null,
    description: '월별 정산 처리'
  },
  {
    name: '데이터 가져오기',
    href: '/import/drivers',
    icon: Upload,
    badge: null,
    description: 'CSV 파일 업로드'
  }
]

const quickStats = [
  { label: '활성 기사', value: 42, trend: +8 },
  { label: '금일 운행', value: 156, trend: +12 },
  { label: '월 매출', value: '₩2.4M', trend: +15 }
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)
  
  const handleToggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  return (
    <div className={cn(
      "flex h-full flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-out",
      "bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950",
      "border-r border-neutral-800/50 shadow-2xl",
      collapsed ? "w-20" : "w-72"
    )}>
      {/* Header with Logo */}
      <div className={cn(
        "flex shrink-0 items-center border-b border-neutral-800/50 relative",
        collapsed ? "h-20 px-4 justify-center" : "h-20 px-6 justify-between"
      )}>
        {/* Logo and Brand */}
        <div className={cn(
          "flex items-center transition-all duration-300",
          collapsed ? "justify-center" : "justify-start"
        )}>
          <div className="relative">
            <div className="h-10 w-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
              <Zap className="h-6 w-6 text-white relative z-10" />
            </div>
          </div>
          
          {!collapsed && (
            <div className="ml-4 transition-all duration-300">
              <h1 className="text-xl font-bold text-white tracking-tight">
                LogiFlow
              </h1>
              <p className="text-xs text-neutral-400 font-medium tracking-wide">
                Transportation Management
              </p>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={handleToggleCollapse}
            className={cn(
              "p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-200",
              "transition-all duration-200 hover:scale-105 active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-brand-500/50",
              collapsed && "absolute -right-3 top-1/2 -translate-y-1/2 bg-neutral-800 shadow-lg border border-neutral-700"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
      </div>

      {/* Quick Stats */}
      {!collapsed && (
        <div className="px-6 py-4 border-b border-neutral-800/50">
          <div className="grid grid-cols-1 gap-3">
            {quickStats.map((stat, index) => (
              <div key={stat.label} className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors">
                <div>
                  <p className="text-xs font-medium text-neutral-400">{stat.label}</p>
                  <p className="text-sm font-semibold text-white">{stat.value}</p>
                </div>
                <div className={cn(
                  "flex items-center text-xs font-medium",
                  stat.trend > 0 ? "text-success-400" : "text-danger-400"
                )}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.trend > 0 ? '+' : ''}{stat.trend}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn(
        "flex-1 px-4 py-6 space-y-2 overflow-y-auto",
        collapsed ? "px-3" : "px-4"
      )}>
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center rounded-xl font-medium transition-all duration-200',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  collapsed ? 'px-3 py-4 justify-center' : 'px-4 py-3',
                  isActive
                    ? [
                        'bg-gradient-to-r from-brand-500/20 to-brand-600/20',
                        'text-brand-400 shadow-lg shadow-brand-500/10',
                        'border border-brand-500/30'
                      ]
                    : [
                        'text-neutral-400 hover:text-white',
                        'hover:bg-neutral-800/50',
                        'border border-transparent hover:border-neutral-700/50'
                      ]
                )}
              >
                <div className="relative flex items-center">
                  <item.icon className={cn(
                    'h-5 w-5 flex-shrink-0 transition-colors duration-200',
                    collapsed ? '' : 'mr-4',
                    isActive 
                      ? 'text-brand-400' 
                      : 'text-neutral-500 group-hover:text-white'
                  )} />
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-brand-400 to-brand-600 rounded-full" />
                  )}
                </div>
                
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold truncate">
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide",
                          item.badge === 'HOT' 
                            ? "bg-danger-500/20 text-danger-400 border border-danger-500/30" 
                            : "bg-success-500/20 text-success-400 border border-success-500/30"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">
                      {item.description}
                    </p>
                  </div>
                )}
              </Link>

              {/* Tooltip for collapsed state */}
              {collapsed && hoveredItem === item.name && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 animate-slide-right">
                  <div className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 shadow-xl min-w-max">
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-neutral-400 mt-1">{item.description}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "border-t border-neutral-800/50 p-4",
        collapsed ? "px-3" : "px-4"
      )}>
        {!collapsed ? (
          <div className="space-y-3">
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-lg transition-colors">
                <Settings className="h-4 w-4" />
                설정
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-lg transition-colors">
                <HelpCircle className="h-4 w-4" />
                도움말
              </button>
            </div>
            
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-success-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-neutral-400">시스템 정상</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-success-400" />
                <span className="text-xs text-neutral-500">99.9%</span>
              </div>
            </div>
            
            {/* Version */}
            <div className="text-center">
              <p className="text-xs text-neutral-600">
                v2.1.0 • {new Date().getFullYear()}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <button className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-lg transition-colors">
              <Settings className="h-4 w-4" />
            </button>
            <div className="h-2 w-2 bg-success-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}