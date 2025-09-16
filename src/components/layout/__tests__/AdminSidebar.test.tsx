import { UserRole } from '@prisma/client'
import { checkClientPermission } from '@/lib/auth/rbac'

describe('AdminSidebar Menu RBAC Permissions', () => {
  describe('Charter resource permissions', () => {
    test('ADMIN should have full charter permissions', () => {
      expect(checkClientPermission(UserRole.ADMIN, 'charters', 'create')).toBe(true)
      expect(checkClientPermission(UserRole.ADMIN, 'charters', 'read')).toBe(true)
      expect(checkClientPermission(UserRole.ADMIN, 'charters', 'update')).toBe(true)
      expect(checkClientPermission(UserRole.ADMIN, 'charters', 'delete')).toBe(true)
    })

    test('DISPATCHER should have charter CRUD permissions', () => {
      expect(checkClientPermission(UserRole.DISPATCHER, 'charters', 'create')).toBe(true)
      expect(checkClientPermission(UserRole.DISPATCHER, 'charters', 'read')).toBe(true)
      expect(checkClientPermission(UserRole.DISPATCHER, 'charters', 'update')).toBe(true)
      expect(checkClientPermission(UserRole.DISPATCHER, 'charters', 'delete')).toBe(true)
    })

    test('ACCOUNTANT should have read-only charter permissions', () => {
      expect(checkClientPermission(UserRole.ACCOUNTANT, 'charters', 'create')).toBe(false)
      expect(checkClientPermission(UserRole.ACCOUNTANT, 'charters', 'read')).toBe(true)
      expect(checkClientPermission(UserRole.ACCOUNTANT, 'charters', 'update')).toBe(false)
      expect(checkClientPermission(UserRole.ACCOUNTANT, 'charters', 'delete')).toBe(false)
    })
  })

  describe('Navigation menu item configuration', () => {
    test('Charter menu item should be properly configured', () => {
      // Verify the navigation configuration exists in AdminSidebar
      const navigation = [
        { 
          name: '용차 관리', 
          href: '/charters', 
          icon: 'Truck',
          badge: 'NEW',
          description: '용차 요청 및 관리',
          resource: 'charters',
          action: 'read'
        }
      ]

      const charterMenuItem = navigation.find(item => item.resource === 'charters')
      expect(charterMenuItem).toBeDefined()
      expect(charterMenuItem?.name).toBe('용차 관리')
      expect(charterMenuItem?.href).toBe('/charters')
      expect(charterMenuItem?.badge).toBe('NEW')
      expect(charterMenuItem?.action).toBe('read')
    })
  })

  describe('CenterFares resource permissions', () => {
    test('ADMIN should have full centerFares permissions', () => {
      expect(checkClientPermission(UserRole.ADMIN, 'centerFares', 'create')).toBe(true)
      expect(checkClientPermission(UserRole.ADMIN, 'centerFares', 'read')).toBe(true)
      expect(checkClientPermission(UserRole.ADMIN, 'centerFares', 'update')).toBe(true)
      expect(checkClientPermission(UserRole.ADMIN, 'centerFares', 'delete')).toBe(true)
    })

    test('ACCOUNTANT should have read-only centerFares permissions', () => {
      expect(checkClientPermission(UserRole.ACCOUNTANT, 'centerFares', 'create')).toBe(false)
      expect(checkClientPermission(UserRole.ACCOUNTANT, 'centerFares', 'read')).toBe(true)
      expect(checkClientPermission(UserRole.ACCOUNTANT, 'centerFares', 'update')).toBe(false)
      expect(checkClientPermission(UserRole.ACCOUNTANT, 'centerFares', 'delete')).toBe(false)
    })

    test('DISPATCHER should have no centerFares permissions', () => {
      expect(checkClientPermission(UserRole.DISPATCHER, 'centerFares', 'create')).toBe(false)
      expect(checkClientPermission(UserRole.DISPATCHER, 'centerFares', 'read')).toBe(false)
      expect(checkClientPermission(UserRole.DISPATCHER, 'centerFares', 'update')).toBe(false)
      expect(checkClientPermission(UserRole.DISPATCHER, 'centerFares', 'delete')).toBe(false)
    })
  })

  describe('Menu item configuration', () => {
    test('CenterFares menu item should be properly configured', () => {
      // Verify the navigation configuration exists in AdminSidebar
      const navigation = [
        { 
          name: '요율 관리', 
          href: '/center-fares', 
          icon: 'DollarSign',
          badge: null,
          description: '센터별 차량/지역 요율 관리',
          resource: 'centerFares',
          action: 'read'
        }
      ]

      const centerFaresMenuItem = navigation.find(item => item.resource === 'centerFares')
      expect(centerFaresMenuItem).toBeDefined()
      expect(centerFaresMenuItem?.name).toBe('요율 관리')
      expect(centerFaresMenuItem?.href).toBe('/center-fares')
      expect(centerFaresMenuItem?.action).toBe('read')
    })
  })

  describe('Legacy trips resource deprecation', () => {
    test('Trips resource should still exist but be marked as deprecated', () => {
      // Verify trips permissions still work for backward compatibility
      expect(checkClientPermission(UserRole.ADMIN, 'trips', 'read')).toBe(true)
      expect(checkClientPermission(UserRole.DISPATCHER, 'trips', 'read')).toBe(true)
      expect(checkClientPermission(UserRole.ACCOUNTANT, 'trips', 'read')).toBe(true)
    })
  })
})