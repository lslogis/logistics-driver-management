'use client'

import { useState, useEffect, useRef, useMemo, Suspense } from 'react'
import { signIn, getSession, useSession } from 'next-auth/react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const signInSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요')
})

type SignInForm = z.infer<typeof signInSchema>

/**
 * CallbackUrl 검증 함수 - 클라이언트 사이드에서도 동일한 보안 검증 적용
 * @param callbackUrl 검증할 URL
 * @returns 안전한 URL 또는 기본 URL
 */
function validateCallbackUrl(callbackUrl: string | null): string {
  if (!callbackUrl) {
    return '/dashboard' // 기본 대시보드로
  }

  try {
    // 상대 경로인 경우 (가장 안전)
    if (callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
      // 인증 관련 페이지로는 리다이렉트하지 않음
      if (callbackUrl.startsWith('/auth/')) {
        return '/dashboard'
      }
      return callbackUrl
    }

    // 절대 URL인 경우 도메인 확인
    const url = new URL(callbackUrl)
    const currentOrigin = window.location.origin
    
    // 같은 도메인인지 확인
    if (url.origin === currentOrigin) {
      // 인증 관련 페이지로는 리다이렉트하지 않음
      if (url.pathname.startsWith('/auth/')) {
        return '/dashboard'
      }
      return url.pathname + url.search
    }

    // 외부 도메인은 거부
    console.warn(`🚨 [SECURITY] Rejected external callback URL: ${callbackUrl}`)
    return '/dashboard'
  } catch (error) {
    console.warn(`🚨 [SECURITY] Invalid callback URL: ${callbackUrl}`, error)
    return '/dashboard'
  }
}

function SignInFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">인증 상태 확인 중...</p>
      </div>
    </div>
  )
}

function SignInContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const hasRedirected = useRef(false)
  
  // CallbackUrl 검증 처리 - useMemo로 안정화
  const rawCallbackUrl = searchParams.get('callbackUrl')
  const validatedCallbackUrl = useMemo(() => {
    return validateCallbackUrl(rawCallbackUrl || null)
  }, [rawCallbackUrl])
  
  console.log(`🔍 [SIGNIN] Raw callbackUrl: ${rawCallbackUrl}, Validated: ${validatedCallbackUrl}`)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema)
  })

  // 이미 로그인된 사용자 자동 리다이렉트 처리 (루프 방지)
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (status === 'loading') {
        return // 아직 세션 확인 중
      }

      // 이미 리다이렉트했거나 로그인 페이지가 아니면 중단
      if (hasRedirected.current || pathname !== '/auth/signin') {
        setIsCheckingAuth(false)
        return
      }

      if (status === 'authenticated' && session?.user) {
        console.log(`✅ [SIGNIN] User already authenticated, redirecting to: ${validatedCallbackUrl}`)
        // 이미 로그인된 사용자는 목적지로 리다이렉트 (replace 사용)
        hasRedirected.current = true
        router.replace(validatedCallbackUrl)
        return
      }

      // 세션 확인 완료
      setIsCheckingAuth(false)
    }

    checkAuthAndRedirect()
  }, [status, session, validatedCallbackUrl, pathname, router])

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (result?.error) {
        setError(result.error)
        console.log(`❌ [SIGNIN] Login failed: ${result.error}`)
      } else {
        // 로그인 성공 - 세션 확인 후 검증된 URL로 리다이렉트
        console.log(`✅ [SIGNIN] Login successful, redirecting to: ${validatedCallbackUrl}`)
        const session = await getSession()
        if (session) {
          hasRedirected.current = true
          router.replace(validatedCallbackUrl) // push 대신 replace 사용
        } else {
          console.warn(`⚠️ [SIGNIN] Login appeared successful but no session found`)
          setError('로그인 처리 중 문제가 발생했습니다. 다시 시도해주세요.')
        }
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 세션 확인 중일 때 로딩 표시
  if (isCheckingAuth) {
    return <SignInFallback />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            운송기사관리 시스템
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            계정으로 로그인하세요
          </p>
          {rawCallbackUrl && validatedCallbackUrl !== '/dashboard' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 text-center">
                <span className="font-medium">로그인 후 이동:</span> {validatedCallbackUrl}
              </p>
            </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                이메일
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="이메일 주소"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  )
}
