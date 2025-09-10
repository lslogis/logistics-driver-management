import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole } from '@prisma/client'

// 인증이 필요한 경로들
const protectedPaths = [
  '/dashboard',
  '/drivers',
  '/vehicles', 
  '/routes',
  '/trips',
  '/settlements',
  '/admin',
  '/api/drivers',
  '/api/vehicles',
  '/api/routes', 
  '/api/trips',
  '/api/settlements',
  '/api/import',
  '/api/export',
  '/api/audit',
  '/api/dashboard'
]

// 공개 경로들 (인증 불필요)
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/signup', 
  '/auth/error',
  '/api/auth',
  '/api/health',
  '/api/templates'
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
  
  // 정적 파일과 Next.js 내부 경로는 건너뛰기
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 공개 경로는 인증 검사 생략
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 보호된 경로인지 확인
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  )

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
     * 다음 경로들을 제외한 모든 경로에서 미들웨어 실행:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}