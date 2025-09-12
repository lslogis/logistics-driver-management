import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole } from '@prisma/client'

// 인증이 필요한 경로들
const protectedPaths = [
  '/dashboard',
  '/drivers',
  '/vehicles', 
  '/routes',
  '/fixed-routes',
  '/loading-points',
  '/trips',
  '/settlements',
  '/admin',
  '/api/drivers',
  '/api/vehicles',
  '/api/routes', 
  '/api/fixed-routes',
  '/api/loading-points',
  '/api/trips',
  '/api/settlements',
  '/api/import',
  '/api/export',
  '/api/templates',
  '/api/audit',
  '/api/dashboard'
]

// 공개 경로들 (인증 불필요) - 정확한 매칭을 위해 순서 중요
const publicPaths = [
  '/api/auth',
  '/api/health',
  '/auth/signin',
  '/auth/signup', 
  '/auth/error',
  '/'  // 루트 경로는 마지막에 위치
  // 주의: /api/templates는 인증이 필요하므로 제거됨
]

// 역할별 접근 제한 경로
const roleBasedPaths = {
  // 관리자만 접근 가능
  admin: [
    '/admin',
    '/api/audit',
    '/api/system'
  ],
  
  // 정산담당자 전용
  accountant: [
    '/settlements/confirm',
    '/api/settlements/confirm'
  ]
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`🔍 [MIDDLEWARE] Processing: ${pathname} | NODE_ENV: ${process.env.NODE_ENV}`)
  
  // 정적 파일과 Next.js 내부 경로는 건너뛰기
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    console.log(`⏭️ [MIDDLEWARE] Skipping static file: ${pathname}`)
    return NextResponse.next()
  }

  // 공개 경로는 인증 검사 생략 (정확한 매칭)
  let matchedPath = null
  const isPublicPath = publicPaths.some(path => {
    // 루트 경로는 정확히 매치
    if (path === '/') {
      if (pathname === '/') {
        matchedPath = path
        return true
      }
      return false
    }
    // 다른 경로들은 prefix 매치
    if (pathname.startsWith(path)) {
      matchedPath = path
      return true
    }
    return false
  })
  console.log(`🔍 [MIDDLEWARE] Public path check: ${pathname} → ${isPublicPath} (matched: ${matchedPath})`)
  if (isPublicPath) {
    console.log(`🟢 [MIDDLEWARE] Public path allowed: ${pathname}`)
    return NextResponse.next()
  }

  // 보호된 경로인지 확인
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  )
  
  console.log(`🔐 [MIDDLEWARE] Protected path check: ${pathname} → ${isProtectedPath}`)

  // 개발환경에서만 인증 우회 (다중 보안 검사)
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_BYPASS !== 'false') {
    // API 인증 우회
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
      console.log(`🔓 [DEV-BYPASS] API bypass activated for: ${pathname}`)
      const requestHeaders = new Headers(request.headers)
      // 개발환경 기본 사용자 정보 설정
      requestHeaders.set('x-user-id', 'dev-user-001')
      requestHeaders.set('x-user-role', 'ADMIN')
      requestHeaders.set('x-user-name', 'Dev User')
      requestHeaders.set('x-user-email', 'dev@example.com')
      requestHeaders.set('x-dev-bypass', 'true')
      
      console.log(`🚀 [DEV-BYPASS] Headers set: bypass=true, role=ADMIN`)

      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      })
    }
    
    // 페이지 인증 우회 (보호된 경로)
    if (isProtectedPath) {
      console.log(`🔓 Dev page bypass activated for: ${pathname}`)
      const requestHeaders = new Headers(request.headers)
      // 개발환경 기본 사용자 정보 설정
      requestHeaders.set('x-user-id', 'dev-user-001')
      requestHeaders.set('x-user-role', 'ADMIN')
      requestHeaders.set('x-user-name', 'Dev User')
      requestHeaders.set('x-user-email', 'dev@example.com')
      requestHeaders.set('x-dev-bypass', 'true')

      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      })
    }
  }

  if (!isProtectedPath) {
    return NextResponse.next()
  }

  try {
    // JWT 토큰 확인
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    // 토큰이 없으면 로그인 페이지로 리다이렉트
    if (!token) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    // 계정 활성 상태 확인
    if (!token.isActive) {
      const errorUrl = new URL('/auth/error', request.url)
      errorUrl.searchParams.set('error', 'AccountInactive')
      return NextResponse.redirect(errorUrl)
    }

    // 역할 기반 접근 제어
    const userRole = token.role as UserRole
    
    // 관리자 전용 경로 체크
    if (roleBasedPaths.admin.some(path => pathname.startsWith(path))) {
      if (userRole !== UserRole.ADMIN) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Forbidden',
            message: '관리자만 접근 가능합니다.'
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // 정산담당자 전용 경로 체크
    if (roleBasedPaths.accountant.some(path => pathname.startsWith(path))) {
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.ACCOUNTANT) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Forbidden',
            message: '정산 담당자만 접근 가능합니다.'
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // 요청 헤더에 사용자 정보 추가 (API 라우트에서 사용 가능)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', token.id as string)
    requestHeaders.set('x-user-role', userRole)
    requestHeaders.set('x-user-name', token.name as string)
    requestHeaders.set('x-user-email', token.email as string)

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })

  } catch (error) {
    console.error('Middleware error:', error)
    
    // 에러 발생 시 로그인 페이지로 리다이렉트
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('error', 'AuthError')
    return NextResponse.redirect(signInUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Next.js 14 호환 matcher 패턴
     * - 페이지 경로: 보호된 경로만 명시적으로 포함
     * - API 경로: /api/auth를 제외한 모든 API 경로 포함
     */
    '/(dashboard|drivers|vehicles|routes|fixed-routes|loading-points|trips|settlements|admin)/:path*',
    '/api/((?!auth).*)',
  ],
}