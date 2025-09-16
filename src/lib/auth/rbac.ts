import { UserRole } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// 역할별 권한 매트릭스 (SPEC.md Section 7.1 기준)
export const permissions = {
  // 기사 관리
  drivers: {
    create: [UserRole.ADMIN, UserRole.DISPATCHER],
    read: [UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT],
    update: [UserRole.ADMIN, UserRole.DISPATCHER],
    delete: [UserRole.ADMIN]
  },
  
  // 차량 관리
  vehicles: {
    create: [UserRole.ADMIN],
    read: [UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT],
    update: [UserRole.ADMIN],
    delete: [UserRole.ADMIN]
  },
  
  // 노선 템플릿
  routes: {
    create: [UserRole.ADMIN, UserRole.DISPATCHER],
    read: [UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT],
    update: [UserRole.ADMIN, UserRole.DISPATCHER],
    delete: [UserRole.ADMIN]
  },

  // 고정노선 관리
  fixed_routes: {
    create: [UserRole.ADMIN, UserRole.DISPATCHER],
    read: [UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT],
    update: [UserRole.ADMIN, UserRole.DISPATCHER],
    delete: [UserRole.ADMIN]
  },

  // 고정계약 관리
  fixed_contracts: {
    create: [UserRole.ADMIN, UserRole.DISPATCHER],
    read: [UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT],
    update: [UserRole.ADMIN, UserRole.DISPATCHER],
    delete: [UserRole.ADMIN]
  },

  // 상차지 관리
  'loading-points': {
    create: [UserRole.ADMIN, UserRole.DISPATCHER],
    read: [UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT],
    update: [UserRole.ADMIN, UserRole.DISPATCHER],
    delete: [UserRole.ADMIN]
  },
  
  // 운행 관리 (Deprecated - replaced with charters)
  trips: {
    create: [UserRole.ADMIN, UserRole.DISPATCHER],
    read: [UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT],
    update: [UserRole.ADMIN, UserRole.DISPATCHER],
    delete: [UserRole.ADMIN, UserRole.DISPATCHER]
  },

  // 용차 관리 (Charter Management)
  charters: {
    create: [UserRole.ADMIN, UserRole.DISPATCHER],
    read: [UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT],
    update: [UserRole.ADMIN, UserRole.DISPATCHER],
    delete: [UserRole.ADMIN, UserRole.DISPATCHER]
  },
  
  // 정산 관리
  settlements: {
    create: [UserRole.ADMIN, UserRole.ACCOUNTANT],
    read: [UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT],
    update: [UserRole.ADMIN, UserRole.ACCOUNTANT], // DRAFT 상태만
    confirm: [UserRole.ADMIN, UserRole.ACCOUNTANT],
    delete: [UserRole.ADMIN]
  },

  // 요금 관리
  rates: {
    create: [UserRole.ADMIN, UserRole.DISPATCHER],
    read: [UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT],
    update: [UserRole.ADMIN, UserRole.DISPATCHER],
    delete: [UserRole.ADMIN]
  },

  // 센터 요율 관리 (Center Fares)
  centerFares: {
    create: [UserRole.ADMIN],
    read: [UserRole.ADMIN, UserRole.ACCOUNTANT],
    update: [UserRole.ADMIN],
    delete: [UserRole.ADMIN]
  },
  
  // 임포트/익스포트
  import: {
    execute: [UserRole.ADMIN, UserRole.ACCOUNTANT]
  },
  
  export: {
    execute: [UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT]
  },
  
  // 템플릿 다운로드
  templates: {
    read: [UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT]
  },
  
  // 감사 로그
  audit: {
    read: [UserRole.ADMIN]
  },
  
  // 시스템 설정
  system: {
    manage: [UserRole.ADMIN]
  },

  // 관리자 대시보드
  admin: {
    read: [UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT]
  }
} as const

// 권한 확인 함수
export function hasPermission(
  userRole: UserRole,
  resource: keyof typeof permissions,
  action: string
): boolean {
  const resourcePermissions = permissions[resource]
  if (!resourcePermissions) {
    return false
  }
  
  const actionPermissions = resourcePermissions[action as keyof typeof resourcePermissions]
  if (!actionPermissions) {
    return false
  }
  
  return (actionPermissions as UserRole[]).includes(userRole)
}

// API 라우트 권한 검사 미들웨어
export function withAuth(
  handler: (req: NextRequest, context: { params?: any }) => Promise<Response>,
  options: {
    resource: keyof typeof permissions
    action: string
    requireActive?: boolean
  }
) {
  return async (req: NextRequest, context: { params?: any } = {}) => {
    try {

      // JWT 토큰에서 사용자 정보 추출
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET 
      })

      // 로그인 확인
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized', message: '로그인이 필요합니다.' },
          { status: 401 }
        )
      }

      // 계정 활성 상태 확인
      if (options.requireActive !== false && !token.isActive) {
        return NextResponse.json(
          { error: 'Account Inactive', message: '비활성화된 계정입니다.' },
          { status: 403 }
        )
      }

      // 권한 확인
      const userRole = token.role as UserRole
      if (!hasPermission(userRole, options.resource, options.action)) {
        return NextResponse.json(
          { error: 'Forbidden', message: '해당 작업을 수행할 권한이 없습니다.' },
          { status: 403 }
        )
      }

      // 요청 객체에 사용자 정보 추가 (다음 핸들러에서 사용 가능)
      ;(req as any).user = {
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
        isActive: token.isActive
      }

      return handler(req, context)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal Server Error', message: '인증 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  }
}

// 클라이언트 사이드 권한 확인 hook용 유틸
export function checkClientPermission(
  userRole: UserRole | undefined,
  resource: keyof typeof permissions,
  action: string
): boolean {
  if (!userRole) return false
  return hasPermission(userRole, resource, action)
}

// 에러 응답 생성 유틸
export const authErrors = {
  unauthorized: () => NextResponse.json(
    { error: 'Unauthorized', message: '로그인이 필요합니다.' },
    { status: 401 }
  ),
  
  forbidden: (message: string = '권한이 없습니다.') => NextResponse.json(
    { error: 'Forbidden', message },
    { status: 403 }
  ),
  
  inactive: () => NextResponse.json(
    { error: 'Account Inactive', message: '비활성화된 계정입니다.' },
    { status: 403 }
  )
}