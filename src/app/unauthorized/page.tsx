/**
 * 권한 부족 사용자를 위한 Unauthorized 페이지
 * middleware.ts에서 RBAC 위반 시 리다이렉트되는 페이지
 */

'use client'

import React, { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import { 
  ShieldX, 
  AlertCircle, 
  ArrowLeft, 
  Home, 
  Lock,
  User,
  Mail,
  Phone
} from 'lucide-react'

function UnauthorizedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  // URL 파라미터에서 정보 추출
  const reason = searchParams.get('reason') || 'access_denied'
  const requiredRole = searchParams.get('required_role')?.split(',') || []
  const userRole = searchParams.get('user_role')
  const attemptedPath = searchParams.get('path')

  // 사용자 정보
  const user = session?.user

  // 역할 한글 변환
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case UserRole.ADMIN: return '관리자'
      case UserRole.DISPATCHER: return '배차담당자'
      case UserRole.ACCOUNTANT: return '회계담당자'
      default: return role
    }
  }

  // 에러 메시지 생성
  const getErrorMessage = () => {
    switch (reason) {
      case 'insufficient_permissions':
        return {
          title: '접근 권한이 부족합니다',
          description: '현재 역할로는 이 기능에 접근할 수 없습니다.',
          icon: <ShieldX className="w-16 h-16 text-danger-500" />
        }
      case 'account_inactive':
        return {
          title: '비활성화된 계정입니다',
          description: '계정이 비활성화되어 있습니다. 관리자에게 문의하세요.',
          icon: <Lock className="w-16 h-16 text-warning-500" />
        }
      case 'session_expired':
        return {
          title: '세션이 만료되었습니다',
          description: '다시 로그인해 주세요.',
          icon: <AlertCircle className="w-16 h-16 text-info-500" />
        }
      default:
        return {
          title: '접근이 거부되었습니다',
          description: '이 페이지에 접근할 권한이 없습니다.',
          icon: <ShieldX className="w-16 h-16 text-danger-500" />
        }
    }
  }

  const errorInfo = getErrorMessage()

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard')
    }
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  const handleContactAdmin = () => {
    // 관리자에게 문의하는 로직 (이메일, 전화, 또는 티켓 시스템)
    // 여기서는 간단히 이메일 클라이언트를 열도록 구현
    const subject = encodeURIComponent('접근 권한 요청')
    const body = encodeURIComponent(`
안녕하세요,

다음 정보로 접근 권한을 요청드립니다:

- 사용자: ${user?.name || '알 수 없음'} (${user?.email || '알 수 없음'})
- 현재 역할: ${userRole ? getRoleDisplayName(userRole) : '알 수 없음'}
- 요청 페이지: ${attemptedPath || '알 수 없음'}
- 필요 권한: ${requiredRole.map(getRoleDisplayName).join(', ') || '알 수 없음'}
- 사유: ${reason}

감사합니다.
    `)
    
    window.location.href = `mailto:admin@logistic.com?subject=${subject}&body=${body}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 메인 카드 */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          {/* 아이콘 */}
          <div className="flex justify-center mb-6">
            {errorInfo.icon}
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
            {errorInfo.title}
          </h1>

          {/* 설명 */}
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {errorInfo.description}
          </p>

          {/* 상세 정보 */}
          {user && (
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                계정 정보
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                  <User className="w-4 h-4 mr-2" />
                  <span>{user.name}</span>
                </div>
                
                <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>{user.email}</span>
                </div>
                
                <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                  <ShieldX className="w-4 h-4 mr-2" />
                  <span>현재 역할: {userRole ? getRoleDisplayName(userRole) : '알 수 없음'}</span>
                </div>

                {requiredRole.length > 0 && (
                  <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                    <Lock className="w-4 h-4 mr-2" />
                    <span>필요 권한: {requiredRole.map(getRoleDisplayName).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full flex items-center justify-center px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전 페이지로
            </button>

            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center px-4 py-3 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium rounded-xl transition-colors duration-200"
            >
              <Home className="w-4 h-4 mr-2" />
              대시보드로 이동
            </button>

            <button
              onClick={handleContactAdmin}
              className="w-full flex items-center justify-center px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors duration-200"
            >
              <Phone className="w-4 h-4 mr-2" />
              관리자에게 문의
            </button>
          </div>
        </div>

        {/* 추가 도움말 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            지속적인 문제가 발생하면 시스템 관리자에게 문의하세요.
          </p>
        </div>

        {/* 디버그 정보 (개발환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs text-neutral-600 dark:text-neutral-400">
            <h4 className="font-semibold mb-2">디버그 정보:</h4>
            <div className="space-y-1">
              <div>Reason: {reason}</div>
              <div>User Role: {userRole}</div>
              <div>Required Roles: {requiredRole.join(', ')}</div>
              <div>Attempted Path: {attemptedPath}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">로딩 중...</p>
        </div>
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  )
}