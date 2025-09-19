'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Route, 
  Calculator, 
  Upload, 
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  Settings,
  HelpCircle,
  Building2,
  Shield,
  LogOut,
  DollarSign
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { PermissionGate, AdminOnly } from '@/components/auth/PermissionGate'
import { UserRole } from '@prisma/client'
import { checkClientPermission } from '@/lib/auth/rbac'

// 권한별 네비게이션 메뉴 정의
const navigation = [
  { 
    name: '대시보드', 
    href: '/', 
    icon: LayoutDashboard,
    badge: null,
    description: '전체 현황 조회',
    resource: 'admin',
    action: 'read'
  },
  { 
    name: '센터 관리', 
    href: '/loading-points', 
    icon: Building2,
    badge: null,
    description: '센터 등록 및 관리',
    resource: 'loading-points',
    action: 'read'
  },
  { 
    name: '기사 관리', 
    href: '/drivers', 
    icon: Users,
    badge: 'HOT',
    description: '운송기사 등록 및 관리',
    resource: 'drivers',
    action: 'read'
  },
  { 
    name: '고정 관리', 
    href: '/fixed-routes', 
    icon: Route,
    badge: null,
    description: '고정노선 관리',
    resource: 'fixed_routes',
    action: 'read'
  },
  { 
    name: '용차 관리', 
    href: '/charters', 
    icon: Truck,
    badge: 'NEW',
    description: '용차 요청 및 관리',
    resource: 'charters',
    action: 'read'
  },
  { 
    name: '정산 관리', 
    href: '/settlements', 
    icon: Calculator,
    badge: null,
    description: '월별 정산 처리',
    resource: 'settlements',
    action: 'read'
  },
  {
    name: '데이터 가져오기',
    href: '/import',
    icon: Upload,
    badge: null,
    description: 'CSV 파일 업로드',
    resource: 'import',
    action: 'execute'
  },
  { 
    name: '요율 관리', 
    href: '/center-fares', 
    icon: DollarSign,
    badge: null,
    description: '센터별 차량/지역 요율 관리',
    resource: 'centerFares',
    action: 'read'
  }
]

// 관리자 전용 메뉴
const adminNavigation = [
  {
    name: '시스템 관리',
    href: '/admin',
    icon: Settings,
    badge: 'ADMIN',
    description: '시스템 설정 및 관리',
    resource: 'system',
    action: 'manage'
  },
  {
    name: '감사 로그',
    href: '/admin/audit',
    icon: Shield,
    badge: null,
    description: '시스템 활동 로그',
    resource: 'audit',
    action: 'read'
  }
]

// Quick stats removed - replaced with center fares management

/**
 * AdminSidebar - 관리자 사이드바 컴포넌트
 * 
 * 🔑 핵심 특징:
 * - NextAuth useSession()을 직접 사용하여 세션 상태를 실시간 구독
 * - 세션이 없으면 사이드바를 숨기거나 최소화 (로그인 필요 안내 표시)
 * - 로그아웃 시 즉시 UI가 반응하여 사이드바 상태가 자동으로 변경
 * - 클라이언트 컴포넌트로 실시간 상태 반영 및 반응형 UI 제공
 * 
 * 🎯 세션 상태별 동작:
 * - loading: 스켈레톤 UI 표시
 * - 미인증: 로고만 표시하는 최소 사이드바 + "로그인 필요" 안내
 * - 인증됨: 전체 메뉴 + 사용자 정보 + 로그아웃 버튼 표시
 * 
 * 🔒 권한 관리:
 * - RBAC 시스템과 연동하여 메뉴별 권한 체크
 * - PermissionGate 컴포넌트로 권한별 메뉴 표시 제어
 * 
 * ⚠️ 주의사항:
 * - 반드시 "use client" 클라이언트 컴포넌트여야 함
 * - useSession 훅 사용으로 NextAuthProvider 하위에서만 동작
 */
export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)
  
  // NextAuth useSession 훅으로 세션 상태 직접 구독
  const { data: session, status } = useSession()
  
  // 세션에서 사용자 정보 추출
  const user = session?.user
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated' && !!user
  
  // 권한 확인 헬퍼 함수
  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false
    return checkClientPermission(user.role, resource as any, action)
  }
  
  const handleToggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  // 로그아웃 처리 함수 - NextAuth signOut 사용
  const handleLogout = async () => {
    try {
      console.log('🔓 [LOGOUT] Initiating logout from sidebar')
      await signOut({ 
        callbackUrl: '/auth/signin',  // 간단한 경로로 변경
        redirect: true 
      })
    } catch (error) {
      console.error('❌ [LOGOUT] Error during logout:', error)
    }
  }

  // 로딩 중인 경우: 스켈레톤 UI 표시
  if (isLoading) {
    return (
      <div className={cn(
        "flex h-full flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-out",
        "bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950",
        "border-r border-neutral-800/50 shadow-2xl w-16"
      )}>
        <div className="flex items-center justify-center h-16 border-b border-neutral-800/50">
          <div className="h-8 w-8 bg-neutral-700 rounded-lg animate-pulse" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-neutral-700 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // 세션이 없는 경우: 숨겨진/최소화된 사이드바 표시
  if (!isAuthenticated || !user) {
    return (
      <div className={cn(
        "flex h-full flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-out",
        "bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950",
        "border-r border-neutral-800/50 shadow-2xl w-16"
      )}>
        {/* 로고만 표시 */}
        <div className="flex items-center justify-center h-16 border-b border-neutral-800/50">
          <div className="h-10 w-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
            <Zap className="h-6 w-6 text-white relative z-10" />
          </div>
        </div>
        
        {/* 로그인 필요 안내 */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-neutral-400 text-xs">로그인</div>
            <div className="text-neutral-400 text-xs">필요</div>
          </div>
        </div>
      </div>
    )
  }

  // 인증된 사용자: 전체 사이드바 표시
  return (
    <div className={cn(
      "flex h-full flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-out",
      "bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950",
      "border-r border-neutral-800/50 shadow-2xl",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header with Logo */}
      <div className={cn(
        "flex shrink-0 items-center border-b border-neutral-800/50 relative",
        collapsed ? "h-16 px-3 justify-center" : "h-16 px-4 justify-between"
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

      {/* Removed Quick Stats section */}

      {/* Navigation */}
      <nav className={cn(
        "flex-1 px-4 py-6 space-y-2 overflow-y-auto",
        collapsed ? "px-3" : "px-4"
      )}>
        {/* 일반 메뉴 - 권한 기반 렌더링 */}
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <PermissionGate
              key={item.name}
              resource={item.resource}
              action={item.action}
            >
              <div
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
                              : item.badge === 'NEW'
                              ? "bg-success-500/20 text-success-400 border border-success-500/30"
                              : "bg-warning-500/20 text-warning-400 border border-warning-500/30"
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
            </PermissionGate>
          )
        })}

        {/* 구분선 - 관리자 메뉴가 있을 때만 표시 */}
        <AdminOnly>
          <div className="my-4">
            <div className="border-t border-neutral-800/50"></div>
          </div>
        </AdminOnly>

        {/* 관리자 전용 메뉴 */}
        {adminNavigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <PermissionGate
              key={item.name}
              resource={item.resource}
              action={item.action}
            >
              <div
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
                          'bg-gradient-to-r from-amber-500/20 to-amber-600/20',
                          'text-amber-400 shadow-lg shadow-amber-500/10',
                          'border border-amber-500/30'
                        ]
                      : [
                          'text-neutral-400 hover:text-amber-300',
                          'hover:bg-amber-950/20',
                          'border border-transparent hover:border-amber-700/30'
                        ]
                  )}
                >
                  <div className="relative flex items-center">
                    <item.icon className={cn(
                      'h-5 w-5 flex-shrink-0 transition-colors duration-200',
                      collapsed ? '' : 'mr-4',
                      isActive 
                        ? 'text-amber-400' 
                        : 'text-neutral-500 group-hover:text-amber-300'
                    )} />
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
                    )}
                  </div>
                  
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold truncate">
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30">
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
                      <p className="text-xs text-amber-400 mt-1 font-medium">관리자 전용</p>
                    </div>
                  </div>
                )}
              </div>
            </PermissionGate>
          )
        })}

        {/* 사용자 정보 표시 - 세션 상태에 반응 */}
        {!collapsed && user && (
          <div className="mt-6 space-y-3">
            {/* 사용자 기본 정보 */}
            <div className="p-3 bg-neutral-800/30 rounded-xl border border-neutral-700/30">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-400 mb-1">로그인 사용자</p>
                  <p className="text-sm font-semibold text-white truncate" title={user.name}>
                    {user.name || '이름 없음'}
                  </p>
                  <p className="text-xs text-neutral-400 truncate mt-0.5" title={user.email}>
                    {user.email}
                  </p>
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0 mt-1",
                  user.isActive ? "bg-success-500" : "bg-danger-500"
                )} />
              </div>
            </div>
            
            {/* 사용자 역할 정보 */}
            <div className="p-3 bg-neutral-800/30 rounded-xl border border-neutral-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-400">현재 역할</p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {user.role === UserRole.ADMIN && '관리자'}
                    {user.role === UserRole.DISPATCHER && '배차담당자'}
                    {user.role === UserRole.ACCOUNTANT && '정산담당자'}
                  </p>
                </div>
                <div className="text-xs text-neutral-500">
                  {user.role}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className={cn(
        "border-t border-neutral-800/50 p-4",
        collapsed ? "px-3" : "px-4"
      )}>
        {!collapsed ? (
          <div className="space-y-3">
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-red-800/30 hover:border-red-700/50 rounded-lg transition-all duration-200 group"
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
              로그아웃
            </button>

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
            {/* Logout Button - Collapsed */}
            <button 
              onClick={handleLogout}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-red-800/30 hover:border-red-700/50 rounded-lg transition-all duration-200 group"
              title="로그아웃"
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>
            
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