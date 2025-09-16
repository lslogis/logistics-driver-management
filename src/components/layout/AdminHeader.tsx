'use client'

import * as React from 'react'
import { 
  Bell, 
  Search, 
  User, 
  Sun, 
  Moon, 
  Maximize2, 
  Menu,
  Plus,
  Calendar,
  Filter,
  MoreHorizontal,
  LogOut,
  Settings,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from 'next-auth/react'
import { UserRole } from '@prisma/client'

interface AdminHeaderProps {
  onToggleSidebar?: () => void
  sidebarCollapsed?: boolean
  title?: string
  subtitle?: string
}

export default function AdminHeader({ 
  onToggleSidebar, 
  sidebarCollapsed = false,
  title = "대시보드",
  subtitle = "운송 관리 시스템 현황"
}: AdminHeaderProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  const [isSearchFocused, setIsSearchFocused] = React.useState(false)
  const [notifications] = React.useState(3)
  const { user } = useAuth()

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    // TODO: Implement dark mode toggle logic
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'light' : 'dark')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      console.log('🔓 [LOGOUT] Initiating logout from header')
      await signOut({ 
        callbackUrl: `${window.location.origin}/auth/signin`,
        redirect: true 
      })
    } catch (error) {
      console.error('❌ [LOGOUT] Error during logout:', error)
    }
  }

  // 역할 한글 변환
  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case UserRole.ADMIN: return '관리자'
      case UserRole.DISPATCHER: return '배차담당자'
      case UserRole.ACCOUNTANT: return '회계담당자'
      default: return '사용자'
    }
  }

  // 프로필 드롭다운 메뉴 아이템
  const profileMenuItems = [
    {
      id: 'profile',
      label: '프로필 설정',
      icon: <User className="h-4 w-4" />,
      onClick: () => {
        // TODO: 프로필 설정 페이지로 이동
        console.log('프로필 설정 클릭')
      }
    },
    {
      id: 'settings',
      label: '계정 설정',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => {
        // TODO: 계정 설정 페이지로 이동
        console.log('계정 설정 클릭')
      }
    },
    {
      id: 'divider1',
      label: '',
      icon: null,
      onClick: () => {},
      divider: true
    },
    {
      id: 'logout',
      label: '로그아웃',
      icon: <LogOut className="h-4 w-4" />,
      onClick: handleLogout,
      destructive: true
    }
  ]

  return (
    <header className={cn(
      "bg-white/95 backdrop-blur-md border-b border-neutral-200/50",
      "h-18 flex items-center justify-between px-6 shadow-sm",
      "dark:bg-neutral-900/95 dark:border-neutral-800/50",
      "transition-all duration-200 ease-out",
      "relative z-40"
    )}>
      {/* Left Section */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Mobile Menu Toggle */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Page Info */}
        <div className="hidden md:block min-w-0">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {title}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
            {subtitle}
          </p>
        </div>

        {/* Quick Actions - Desktop */}
        <div className="hidden lg:flex items-center gap-2 ml-8">
          <Button variant="secondary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            신규 등록
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Calendar className="h-4 w-4" />}>
            금일 운행
          </Button>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className={cn(
          "relative transition-all duration-200",
          isSearchFocused && "transform scale-105"
        )}>
          <Input
            type="text"
            placeholder="기사명, 차량번호, 노선 검색..."
            leftIcon={<Search className="h-4 w-4" />}
            className={cn(
              "bg-neutral-100/50 border-neutral-200/50",
              "focus:bg-white focus:border-brand-300",
              "dark:bg-neutral-800/50 dark:border-neutral-700/50",
              "dark:focus:bg-neutral-800 dark:focus:border-brand-600",
              "transition-all duration-200"
            )}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          
          {/* Search suggestions - would be populated dynamically */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-xl z-50 animate-slide-down">
              <div className="p-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">최근 검색</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded cursor-pointer">
                    <Search className="h-3 w-3 text-neutral-400" />
                    <span className="text-sm">홍길동 기사</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded cursor-pointer">
                    <Search className="h-3 w-3 text-neutral-400" />
                    <span className="text-sm">12가3456</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* System Status - Desktop only */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-success-50 dark:bg-success-950 rounded-lg border border-success-200 dark:border-success-800">
          <div className="h-2 w-2 bg-success-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-success-700 dark:text-success-300">
            시스템 정상
          </span>
        </div>

        {/* Filter Button - Mobile */}
        <Button variant="ghost" size="icon-sm" className="md:hidden">
          <Filter className="h-4 w-4" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleDarkMode}
          className="hidden sm:flex"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Fullscreen Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleFullscreen}
          className="hidden md:flex"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-danger-500 text-white rounded-full text-xs font-bold flex items-center justify-center animate-bounce-subtle">
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </Button>

        {/* User Profile with Dropdown */}
        <div className="flex items-center gap-3 pl-3 border-l border-neutral-200 dark:border-neutral-700">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {user?.name || '게스트'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {getRoleDisplayName(user?.role)} • {user?.email || '로그인 필요'}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="relative hover:scale-105 transition-transform duration-200">
                <div className="h-8 w-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className={cn(
                  "absolute bottom-0 right-0 h-3 w-3 border-2 border-white dark:border-neutral-900 rounded-full",
                  user?.isActive ? "bg-success-500" : "bg-danger-500"
                )} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom">
              {profileMenuItems.map((item) => (
                <React.Fragment key={item.id}>
                  {item.divider && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={item.onClick}
                    className={item.destructive ? 'text-red-600' : ''}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* More Actions - Mobile */}
        <Button variant="ghost" size="icon-sm" className="md:hidden ml-2">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}