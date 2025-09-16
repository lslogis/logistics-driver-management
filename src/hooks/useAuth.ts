/**
 * 클라이언트 사이드 인증 및 권한 관리 훅
 * NextAuth 세션과 RBAC 시스템을 통합하여 포괄적인 권한 관리 제공
 */

import { useSession, signOut } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import { checkClientPermission } from '@/lib/auth/rbac'
import { useMemo, useCallback } from 'react'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
}

export interface UseAuthResult {
  // 사용자 정보
  user: AuthUser | null
  
  // 상태
  isLoading: boolean
  isAuthenticated: boolean
  
  // 권한 확인 함수
  hasPermission: (resource: string, action: string) => boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
  
  // 역할별 편의 함수
  isAdmin: boolean
  isDispatcher: boolean
  isAccountant: boolean
  
  // 세션 관리
  signIn: () => void
  signOut: () => Promise<void>
  
  // 레거시 호환성 (기존 코드 지원)
  role?: UserRole
  isActive?: boolean
  
  // 자주 사용되는 권한 체크 메서드들
  canManageDrivers: boolean
  canCreateDrivers: boolean
  canViewDrivers: boolean
  canDeleteDrivers: boolean
  
  canManageVehicles: boolean
  canViewVehicles: boolean
  
  canManageRoutes: boolean
  canCreateRoutes: boolean
  canViewRoutes: boolean
  
  canManageFixedRoutes: boolean
  canCreateFixedRoutes: boolean
  canViewFixedRoutes: boolean
  
  canManageFixedContracts: boolean
  canCreateFixedContracts: boolean
  canViewFixedContracts: boolean
  
  canManageLoadingPoints: boolean
  canCreateLoadingPoints: boolean
  canViewLoadingPoints: boolean
  
  canManageTrips: boolean
  canCreateTrips: boolean
  canViewTrips: boolean
  
  canManageSettlements: boolean
  canCreateSettlements: boolean
  canViewSettlements: boolean
  canConfirmSettlements: boolean
  
  canManageRates: boolean
}

/**
 * 통합된 인증 및 권한 관리 훅
 * 기존 useAuth와 usePermission을 하나로 통합
 * 
 * @example
 * ```tsx
 * const { user, hasPermission, isAdmin, canManageDrivers } = useAuth()
 * 
 * if (hasPermission('drivers', 'create')) {
 *   return <CreateDriverButton />
 * }
 * 
 * if (isAdmin) {
 *   return <AdminPanel />
 * }
 * ```
 */
export function useAuth(): UseAuthResult {
  const { data: session, status } = useSession()

  // 사용자 정보 메모이제이션
  const user: AuthUser | null = useMemo(() => {
    return session?.user ? {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      isActive: session.user.isActive
    } : null
  }, [session?.user])

  const isLoading = status === 'loading'
  const isAuthenticated = !!user && user.isActive && status === 'authenticated'

  /**
   * 특정 리소스/액션에 대한 권한 확인
   * RBAC 매트릭스를 기반으로 판단 (메모이제이션)
   */
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!user || !isAuthenticated) return false
    return checkClientPermission(user.role, resource as any, action)
  }, [user, isAuthenticated])

  /**
   * 특정 역할 소유 여부 확인
   * 단일 역할 또는 역할 배열을 받아 처리 (메모이제이션)
   */
  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user || !isAuthenticated) return false
    
    if (Array.isArray(role)) {
      return role.includes(user.role)
    }
    
    return user.role === role
  }, [user, isAuthenticated])

  // 역할별 편의 플래그 (메모이제이션)
  const isAdmin = useMemo(() => hasRole(UserRole.ADMIN), [hasRole])
  const isDispatcher = useMemo(() => hasRole(UserRole.DISPATCHER), [hasRole])
  const isAccountant = useMemo(() => hasRole(UserRole.ACCOUNTANT), [hasRole])

  // 세션 관리 함수
  const signIn = () => {
    window.location.href = '/auth/signin'
  }

  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: '/auth/signin',
      redirect: true 
    })
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    hasPermission,
    hasRole,
    isAdmin,
    isDispatcher,
    isAccountant,
    signIn,
    signOut: handleSignOut,
    
    // 레거시 호환성 (기존 코드가 계속 동작하도록)
    role: user?.role,
    isActive: user?.isActive,
    
    // 자주 사용되는 권한 체크 메서드들 (메모이제이션으로 안정화)
    canManageDrivers: useMemo(() => hasPermission('drivers', 'update'), [hasPermission]),
    canCreateDrivers: useMemo(() => hasPermission('drivers', 'create'), [hasPermission]),
    canViewDrivers: useMemo(() => hasPermission('drivers', 'read'), [hasPermission]),
    canDeleteDrivers: useMemo(() => hasPermission('drivers', 'delete'), [hasPermission]),
    
    canManageVehicles: useMemo(() => hasPermission('vehicles', 'update'), [hasPermission]),
    canViewVehicles: useMemo(() => hasPermission('vehicles', 'read'), [hasPermission]),
    
    canManageRoutes: useMemo(() => hasPermission('routes', 'update'), [hasPermission]),
    canCreateRoutes: useMemo(() => hasPermission('routes', 'create'), [hasPermission]),
    canViewRoutes: useMemo(() => hasPermission('routes', 'read'), [hasPermission]),
    
    canManageFixedRoutes: useMemo(() => hasPermission('fixed_routes', 'update'), [hasPermission]),
    canCreateFixedRoutes: useMemo(() => hasPermission('fixed_routes', 'create'), [hasPermission]),
    canViewFixedRoutes: useMemo(() => hasPermission('fixed_routes', 'read'), [hasPermission]),
    
    canManageFixedContracts: useMemo(() => hasPermission('fixed_contracts', 'update'), [hasPermission]),
    canCreateFixedContracts: useMemo(() => hasPermission('fixed_contracts', 'create'), [hasPermission]),
    canViewFixedContracts: useMemo(() => hasPermission('fixed_contracts', 'read'), [hasPermission]),
    
    canManageLoadingPoints: useMemo(() => hasPermission('loading-points', 'update'), [hasPermission]),
    canCreateLoadingPoints: useMemo(() => hasPermission('loading-points', 'create'), [hasPermission]),
    canViewLoadingPoints: useMemo(() => hasPermission('loading-points', 'read'), [hasPermission]),
    
    canManageTrips: useMemo(() => hasPermission('trips', 'update'), [hasPermission]),
    canCreateTrips: useMemo(() => hasPermission('trips', 'create'), [hasPermission]),
    canViewTrips: useMemo(() => hasPermission('trips', 'read'), [hasPermission]),
    
    canManageSettlements: useMemo(() => hasPermission('settlements', 'update'), [hasPermission]),
    canCreateSettlements: useMemo(() => hasPermission('settlements', 'create'), [hasPermission]),
    canViewSettlements: useMemo(() => hasPermission('settlements', 'read'), [hasPermission]),
    canConfirmSettlements: useMemo(() => hasPermission('settlements', 'confirm'), [hasPermission]),
    
    canManageRates: useMemo(() => hasPermission('rates', 'update'), [hasPermission]),
    canViewRates: useMemo(() => hasPermission('rates', 'read'), [hasPermission]),
    
    canImportData: useMemo(() => hasPermission('import', 'execute'), [hasPermission]),
    canExportData: useMemo(() => hasPermission('export', 'execute'), [hasPermission]),
    canViewTemplates: useMemo(() => hasPermission('templates', 'read'), [hasPermission]),
    
    canViewAudit: useMemo(() => hasPermission('audit', 'read'), [hasPermission]),
    canManageSystem: useMemo(() => hasPermission('system', 'manage'), [hasPermission]),
    canViewAdmin: useMemo(() => hasPermission('admin', 'read'), [hasPermission])
  } as any // 타입 호환성을 위해 임시로 any 사용
}

/**
 * 레거시 호환성을 위한 usePermission 함수
 * @deprecated useAuth() 훅을 직접 사용하세요
 */
export function usePermission() {
  const auth = useAuth()
  
  return {
    hasPermission: auth.hasPermission,
    isAdmin: () => auth.isAdmin,
    isDispatcher: () => auth.isDispatcher,
    isAccountant: () => auth.isAccountant,
    canManageDrivers: () => auth.canManageDrivers,
    canManageVehicles: () => auth.canManageVehicles,
    canManageRoutes: () => auth.canManageRoutes,
    canManageTrips: () => auth.canManageTrips,
    canManageSettlements: () => auth.canManageSettlements,
    canConfirmSettlements: () => auth.canConfirmSettlements,
    canViewAudit: () => auth.hasPermission('audit', 'read')
  }
}

/**
 * 권한 확인을 위한 간단한 유틸리티 훅
 * 특정 권한이 필요한 컴포넌트에서 사용
 * 
 * @example
 * ```tsx
 * const canCreateDriver = usePermissionCheck('drivers', 'create')
 * if (!canCreateDriver) return null
 * ```
 */
export function usePermissionCheck(resource: string, action: string): boolean {
  const { hasPermission } = useAuth()
  return hasPermission(resource, action)
}

/**
 * 특정 역할 확인을 위한 유틸리티 훅
 * 
 * @example
 * ```tsx
 * const isAdminUser = useRoleCheck(UserRole.ADMIN)
 * const isManagerUser = useRoleCheck([UserRole.ADMIN, UserRole.DISPATCHER])
 * ```
 */
export function useRoleCheck(role: UserRole | UserRole[]): boolean {
  const { hasRole } = useAuth()
  return hasRole(role)
}