/**
 * 권한 기반 조건부 렌더링 컴포넌트
 * RBAC 시스템과 통합되어 권한에 따라 UI 요소를 제어
 */

import React from 'react'
import { UserRole } from '@prisma/client'
import { useAuth } from '@/hooks/useAuth'

interface PermissionGateProps {
  children: React.ReactNode
  
  // 권한 기반 제어
  resource?: string
  action?: string
  
  // 역할 기반 제어
  role?: UserRole | UserRole[]
  
  // 조합 조건 (AND/OR)
  requireAll?: boolean // true: 모든 조건 만족, false: 하나만 만족 (기본값)
  
  // 권한 없을 때 대체 콘텐츠
  fallback?: React.ReactNode
  
  // 로딩 중일 때 표시할 콘텐츠
  loading?: React.ReactNode
  
  // 추가 조건부 함수
  condition?: () => boolean
}

/**
 * 권한 기반 조건부 렌더링 컴포넌트
 * 
 * @example
 * ```tsx
 * // 기사 생성 권한이 있는 사용자만 버튼 표시
 * <PermissionGate resource="drivers" action="create">
 *   <CreateDriverButton />
 * </PermissionGate>
 * 
 * // 관리자만 접근 가능
 * <PermissionGate role={UserRole.ADMIN}>
 *   <AdminPanel />
 * </PermissionGate>
 * 
 * // 관리자 또는 디스패처만 접근 가능
 * <PermissionGate role={[UserRole.ADMIN, UserRole.DISPATCHER]}>
 *   <DriverManagement />
 * </PermissionGate>
 * 
 * // 권한 없을 때 대체 UI 표시
 * <PermissionGate 
 *   resource="settlements" 
 *   action="confirm"
 *   fallback={<div>정산 확정 권한이 없습니다.</div>}
 * >
 *   <ConfirmButton />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  children,
  resource,
  action,
  role,
  requireAll = false,
  fallback = null,
  loading = null,
  condition
}: PermissionGateProps) {
  const { hasPermission, hasRole, isLoading, isAuthenticated } = useAuth()

  // 로딩 중일 때
  if (isLoading) {
    return <>{loading}</>
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  // 조건들을 평가
  const conditions: boolean[] = []

  // 리소스/액션 권한 확인
  if (resource && action) {
    conditions.push(hasPermission(resource, action))
  }

  // 역할 확인
  if (role) {
    conditions.push(hasRole(role))
  }

  // 추가 조건 확인
  if (condition) {
    conditions.push(condition())
  }

  // 조건이 없으면 항상 허용
  if (conditions.length === 0) {
    return <>{children}</>
  }

  // 조건 평가
  const hasAccess = requireAll 
    ? conditions.every(Boolean) // 모든 조건 만족
    : conditions.some(Boolean)  // 하나 이상 조건 만족

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

/**
 * 역할 기반 조건부 렌더링을 위한 간단한 컴포넌트
 */
interface RoleGateProps {
  children: React.ReactNode
  role: UserRole | UserRole[]
  fallback?: React.ReactNode
}

export function RoleGate({ children, role, fallback = null }: RoleGateProps) {
  return (
    <PermissionGate role={role} fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

/**
 * 관리자 전용 컴포넌트
 */
interface AdminOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  return (
    <RoleGate role={UserRole.ADMIN} fallback={fallback}>
      {children}
    </RoleGate>
  )
}

/**
 * 디스패처 이상 권한 컴포넌트
 */
interface ManagerOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ManagerOnly({ children, fallback = null }: ManagerOnlyProps) {
  return (
    <RoleGate role={[UserRole.ADMIN, UserRole.DISPATCHER]} fallback={fallback}>
      {children}
    </RoleGate>
  )
}

/**
 * 인증된 사용자만 접근 가능한 컴포넌트
 */
interface AuthenticatedOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthenticatedOnly({ children, fallback = null }: AuthenticatedOnlyProps) {
  const { isAuthenticated } = useAuth()
  
  return isAuthenticated ? <>{children}</> : <>{fallback}</>
}