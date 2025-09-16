'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const errorMessages = {
  Configuration: '서버 설정 오류가 발생했습니다.',
  AccessDenied: '접근이 거부되었습니다.',
  Verification: '인증 토큰이 만료되었거나 이미 사용되었습니다.',
  Default: '인증 중 오류가 발생했습니다.',
  AccountInactive: '비활성화된 계정입니다. 관리자에게 문의하세요.',
  AuthError: '인증 처리 중 오류가 발생했습니다.'
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') as keyof typeof errorMessages

  const message = errorMessages[error] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            인증 오류
          </h2>
          
          <p className="mt-2 text-center text-sm text-gray-600">
            {message}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/auth/signin"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            다시 로그인하기
          </Link>
          
          {error === 'AccountInactive' && (
            <div className="text-center text-sm text-gray-600">
              <p>계정이 비활성화되어 있습니다.</p>
              <p>관리자에게 계정 활성화를 요청하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <AuthErrorContent />
    </Suspense>
  )
}
