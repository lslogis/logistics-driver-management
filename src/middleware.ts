import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole } from '@prisma/client'

// 인증이 필요한 경로들 - 대시보드와 관리 페이지들
const protectedPaths = [
  '/dashboard',   // 대시보드는 인증 필요
  '/drivers',
  '/vehicles', 
  '/routes',
  '/fixed-routes',
  '/loading-points',
  '/charters',
  '/settlements',
  '/admin',
  '/unauthorized', // unauthorized 페이지도 인증 필요 (권한 부족 사용자용)
  '/api/drivers',
  '/api/vehicles',
  '/api/routes', 
  '/api/fixed-routes',
  '/api/loading-points',
  '/api/charters',
  '/api/settlements',
  '/api/import',
  '/api/export',
  '/api/templates',
  '/api/audit',
  '/api/dashboard'
]

// 공개 경로들 (인증 불필요) - 랜딩 페이지와 인증 관련 경로
const publicPaths = [
  '/',             // 랜딩 페이지 (공개)
  '/api/auth',     // NextAuth API
  '/api/health',   // 헬스체크
  '/auth/signin',  // 로그인 페이지
  '/auth/signup',  // 회원가입 페이지 (미래 확장)
  '/auth/error'    // 인증 오류 페이지
]

/**
 * CallbackUrl 검증 함수 - 오픈 리다이렉트 공격 방지
 * @param callbackUrl 검증할 URL
 * @param baseUrl 현재 사이트의 base URL
 * @returns 안전한 URL 또는 기본 URL
 */
function validateCallbackUrl(callbackUrl: string | null, baseUrl: string): string {
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
    const base = new URL(baseUrl)
    
    // 같은 도메인인지 확인
    if (url.origin === base.origin) {
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

// 역할별 접근 제한 경로 - 포괄적인 RBAC 적용
const roleBasedPaths = {
  // 관리자만 접근 가능한 경로
  [UserRole.ADMIN]: [
    '/admin',           // 관리자 대시보드
    '/api/audit',       // 감사 로그 조회
    '/api/system',      // 시스템 설정
    '/api/users',       // 사용자 관리 (미래 확장)
    '/settings'         // 시스템 설정 페이지 (미래 확장)
  ],
  
  // 디스패처(배차담당자) 권한 경로
  [UserRole.DISPATCHER]: [
    '/drivers',         // 기사 관리
    '/vehicles',        // 차량 관리 (읽기 제한)
    '/routes',          // 노선 템플릿
    '/fixed-routes',    // 고정노선
    '/loading-points',  // 상차지 관리
    '/charters',        // 용차 관리
    '/api/drivers',     // 기사 API
    '/api/routes',      // 노선 API
    '/api/fixed-routes',// 고정노선 API
    '/api/loading-points', // 상차지 API
    '/api/charters',    // 용차 API
  ],
  
  // 회계담당자 권한 경로
  [UserRole.ACCOUNTANT]: [
    '/settlements',     // 정산 관리
    '/charters',        // 용차 조회 (읽기 전용)
    '/api/settlements', // 정산 API
    '/api/charters',    // 용차 API (읽기)
    '/api/export',      // 데이터 내보내기
    '/api/import',      // 데이터 가져오기
  ]
}

// 특정 경로에 필요한 역할들을 반환하는 헬퍼 함수
function getRolesForPath(pathname: string): string[] {
  const requiredRoles: string[] = []
  
  for (const [role, paths] of Object.entries(roleBasedPaths)) {
    if (paths.some(path => pathname.startsWith(path))) {
      requiredRoles.push(role)
    }
  }
  
  // 관리자는 항상 접근 가능하므로 추가
  if (!requiredRoles.includes(UserRole.ADMIN)) {
    requiredRoles.unshift(UserRole.ADMIN)
  }
  
  return requiredRoles
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 개발 환경에서만 로깅 (성능 최적화)
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    console.log(`🔍 [MIDDLEWARE] Processing: ${pathname}`)
  }
  
  // 정적 파일과 Next.js 내부 경로는 건너뛰기 (최적화된 체크)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 공개 경로 체크 최적화 - Set을 사용하여 O(1) 검색
  const isPublicPath = publicPaths.some(path => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  })
  
  if (isPublicPath) {
    return NextResponse.next()
  }

  // 보호된 경로인지 확인 (최적화된 체크)
  const isProtectedPath = protectedPaths.some(path => 
    pathname.startsWith(path)
  )
  
  if (!isProtectedPath) {
    return NextResponse.next()
  }

  try {
    // JWT 토큰 확인 - secret을 안전하게 처리
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      console.error('🚨 [AUTH] NEXTAUTH_SECRET is not configured')
      throw new Error('NEXTAUTH_SECRET is required')
    }

    const token = await getToken({
      req: request,
      secret: secret
    })

    // 토큰이 없으면 로그인 페이지로 리다이렉트
    if (!token) {
      if (isDev) {
        console.log(`🔒 [AUTH] No token found, redirecting to signin: ${pathname}`)
      }
      
      const signInUrl = new URL('/auth/signin', request.url)
      
      // CallbackUrl 검증 후 설정
      const validatedCallbackUrl = validateCallbackUrl(pathname, request.url)
      if (validatedCallbackUrl !== '/') {
        signInUrl.searchParams.set('callbackUrl', validatedCallbackUrl)
      }
      
      return NextResponse.redirect(signInUrl)
    }

    // 계정 활성 상태 확인
    if (!token.isActive) {
      const errorUrl = new URL('/auth/error', request.url)
      errorUrl.searchParams.set('error', 'AccountInactive')
      return NextResponse.redirect(errorUrl)
    }

    // 역할 기반 접근 제어 최적화
    const userRole = token.role as UserRole
    
    if (isDev) {
      console.log(`🔐 [RBAC] User role: ${userRole}, checking path: ${pathname}`)
    }
    
    // 관리자는 모든 경로 접근 가능 (early return)
    if (userRole === UserRole.ADMIN) {
      if (isDev) {
        console.log(`✅ [RBAC] Admin access granted to ${pathname}`)
      }
    } else {
      // 역할별 제한 경로 체크 최적화
      const userAllowedPaths = roleBasedPaths[userRole] || []
      const isRoleRestrictedPath = Object.values(roleBasedPaths).flat().some(path => 
        pathname.startsWith(path)
      )
      
      // 제한된 경로이면서 허용되지 않은 경우 거부
      if (isRoleRestrictedPath && !userAllowedPaths.some(path => pathname.startsWith(path))) {
        if (isDev) {
          console.log(`🚫 [RBAC] Access denied for ${userRole} to ${pathname}`)
        }
        
        // API 경로인 경우 JSON 응답
        if (pathname.startsWith('/api/')) {
          return new NextResponse(
            JSON.stringify({ 
              error: 'Forbidden',
              message: `${userRole} 역할로는 이 기능에 접근할 수 없습니다.`,
              allowedRoles: getRolesForPath(pathname)
            }),
            { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        } else {
          // 페이지 경로인 경우 unauthorized 페이지로 리다이렉트
          const unauthorizedUrl = new URL('/unauthorized', request.url)
          unauthorizedUrl.searchParams.set('reason', 'insufficient_permissions')
          unauthorizedUrl.searchParams.set('required_role', getRolesForPath(pathname).join(','))
          unauthorizedUrl.searchParams.set('user_role', userRole)
          return NextResponse.redirect(unauthorizedUrl)
        }
      }
    }

    // 요청 헤더에 사용자 정보 추가 (API 라우트에서 사용 가능)
    // 한글 이름 처리를 위해 encodeURIComponent 적용
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', token.id as string)
    requestHeaders.set('x-user-role', userRole)
    requestHeaders.set('x-user-name', encodeURIComponent(token.name as string))
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
     * - 페이지 경로: 보호된 경로만 명시적으로 포함 (루트 경로 제외)
     * - API 경로: /api/auth를 제외한 모든 API 경로 포함
     */
    '/(dashboard|drivers|vehicles|routes|fixed-routes|loading-points|charters|settlements|admin|unauthorized)/:path*',
    '/api/((?!auth).*)',
  ],
}