import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Prisma, UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
}

/**
 * API 라우트에서 현재 사용자 정보 가져오기
 */
export async function getCurrentUser(req: NextRequest): Promise<AuthUser | null> {
  try {

    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token) {
      console.log('No token found')
      return null
    }

    console.log('Token data:', {
      id: token.id,
      email: token.email,
      name: token.name,
      role: token.role,
      isActive: token.isActive
    })

    // 데이터베이스에서 사용자 확인
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    console.log('DB user found:', dbUser)

    if (!dbUser) {
      console.error('User not found in database:', token.id)
      return null
    }

    return {
      id: token.id as string,
      email: token.email as string,
      name: token.name as string,
      role: token.role as UserRole,
      isActive: token.isActive as boolean
    }
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}


/**
 * 사용자 권한 확인 - 더 강화된 검증
 */
export async function verifyUserPermission(
  userId: string,
  requiredRole?: UserRole | UserRole[]
): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    if (!user || !user.isActive) {
      return null
    }

    // 특정 역할 요구사항 확인
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      if (!roles.includes(user.role)) {
        return null
      }
    }

    return user as AuthUser
  } catch (error) {
    console.error('Failed to verify user permission:', error)
    return null
  }
}

/**
 * 관리자 권한 확인
 */
export async function requireAdmin(req: NextRequest): Promise<AuthUser | null> {
  const user = await getCurrentUser(req)
  if (!user || user.role !== UserRole.ADMIN) {
    return null
  }
  return user
}

/**
 * 정산 권한 확인 (관리자 또는 정산담당자)
 */
export async function requireSettlementPermission(req: NextRequest): Promise<AuthUser | null> {
  const user = await getCurrentUser(req)
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.ACCOUNTANT)) {
    return null
  }
  return user
}

/**
 * 배차 권한 확인 (관리자 또는 배차담당자)
 */
export async function requireDispatchPermission(req: NextRequest): Promise<AuthUser | null> {
  const user = await getCurrentUser(req)
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.DISPATCHER)) {
    return null
  }
  return user
}

/**
 * 감사 로그 기록 유틸리티
 */
export async function createAuditLog(
  user: AuthUser | null,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'EXPORT' | 'CONFIRM' | 'ACTIVATE' | 'DEACTIVATE',
  entityType: string,
  entityId: string,
  changes?: any,
  metadata?: any
) {
  const baseLogData = {
    userId: user?.id ?? null,
    userName: user?.name ?? 'System',
    action,
    entityType,
    entityId,
    changes,
    metadata
  }

  try {
    await prisma.auditLog.create({ data: baseLogData })
  } catch (error) {
    if (baseLogData.userId && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      try {
        await prisma.auditLog.create({
          data: {
            ...baseLogData,
            userId: null,
            metadata: {
              ...(baseLogData.metadata ?? {}),
              auditFallback: true,
              originalUserId: baseLogData.userId,
            }
          }
        })
        return
      } catch (retryError) {
        console.error('Failed to create audit log after FK fallback:', retryError)
      }
    } else {
      console.error('Failed to create audit log:', error)
    }
    // 감사 로그 실패가 주요 작업을 방해하지 않도록 에러를 throw하지 않음
  }
}

/**
 * API 응답 유틸리티
 */
export const apiResponse = {
  success: (data: any, status = 200) => {
    return new Response(JSON.stringify({ success: true, data }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  },

  error: (message: string, status = 400, error?: string) => {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error || 'Bad Request',
      message 
    }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  },

  unauthorized: (message = '로그인이 필요합니다.') => {
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Unauthorized',
      message 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  },

  forbidden: (message = '권한이 없습니다.') => {
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Forbidden',
      message 
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}