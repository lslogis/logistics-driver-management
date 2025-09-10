import { useSession } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import { checkClientPermission } from '@/lib/auth/rbac'

export function useAuth() {
  const { data: session, status } = useSession()

  const user = session?.user
  const isLoading = status === 'loading'
  const isAuthenticated = !!user && status === 'authenticated'

  return {
    user,
    isLoading,
    isAuthenticated,
    role: user?.role,
    isActive: user?.isActive
  }
}

export function usePermission() {
  const { user } = useAuth()
  
  const hasPermission = (resource: string, action: string) => {
    if (!user?.role) return false
    return checkClientPermission(user.role, resource as any, action)
  }

  const isAdmin = () => user?.role === UserRole.ADMIN
  const isDispatcher = () => user?.role === UserRole.DISPATCHER
  const isAccountant = () => user?.role === UserRole.ACCOUNTANT

  const canManageDrivers = () => hasPermission('drivers', 'update')
  const canManageVehicles = () => hasPermission('vehicles', 'update')  
  const canManageRoutes = () => hasPermission('routes', 'update')
  const canManageTrips = () => hasPermission('trips', 'update')
  const canManageSettlements = () => hasPermission('settlements', 'update')
  const canConfirmSettlements = () => hasPermission('settlements', 'confirm')
  const canViewAudit = () => hasPermission('audit', 'read')

  return {
    hasPermission,
    isAdmin,
    isDispatcher, 
    isAccountant,
    canManageDrivers,
    canManageVehicles,
    canManageRoutes,
    canManageTrips,
    canManageSettlements,
    canConfirmSettlements,
    canViewAudit
  }
}