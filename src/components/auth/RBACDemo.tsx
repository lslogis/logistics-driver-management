/**
 * RBAC 시스템 데모 및 테스트 컴포넌트
 * 권한별로 다른 UI 요소가 표시되는지 확인하는 용도
 */

'use client'

import React from 'react'
import { UserRole } from '@prisma/client'
import { useAuth } from '@/hooks/useAuth'
import { PermissionGate, AdminOnly, ManagerOnly } from '@/components/auth/PermissionGate'
import { 
  Shield, 
  Users, 
  Truck, 
  Calculator, 
  Eye,
  Edit,
  Trash2,
  Plus,
  Settings,
  Upload,
  Download,
  Lock,
  Unlock
} from 'lucide-react'

export function RBACDemo() {
  const { 
    user, 
    isLoading, 
    isAuthenticated,
    hasPermission,
    hasRole,
    isAdmin,
    isDispatcher,
    isAccountant 
  } = useAuth()

  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-neutral-200 dark:bg-neutral-700 h-12 w-12"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="text-center">
          <Lock className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            로그인이 필요합니다
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400">
            RBAC 기능을 테스트하려면 로그인하세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 사용자 정보 */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              RBAC 시스템 테스트
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                <Users className="w-4 h-4 mr-2" />
                <span>{user?.name} ({user?.email})</span>
              </div>
              <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                <Shield className="w-4 h-4 mr-2" />
                <span>역할: {user?.role === UserRole.ADMIN && '관리자'}
                  {user?.role === UserRole.DISPATCHER && '배차담당자'}
                  {user?.role === UserRole.ACCOUNTANT && '회계담당자'}</span>
              </div>
              <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                {user?.isActive ? <Unlock className="w-4 h-4 mr-2 text-success-500" /> : <Lock className="w-4 h-4 mr-2 text-danger-500" />}
                <span>상태: {user?.isActive ? '활성' : '비활성'}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              isAdmin ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              isDispatcher ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              isAccountant ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* 기사 관리 권한 테스트 */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          기사 관리 권한
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PermissionGate 
            resource="drivers" 
            action="read"
            fallback={<DisabledButton icon={Eye} label="조회" />}
          >
            <EnabledButton icon={Eye} label="조회" />
          </PermissionGate>
          
          <PermissionGate 
            resource="drivers" 
            action="create"
            fallback={<DisabledButton icon={Plus} label="생성" />}
          >
            <EnabledButton icon={Plus} label="생성" />
          </PermissionGate>
          
          <PermissionGate 
            resource="drivers" 
            action="update"
            fallback={<DisabledButton icon={Edit} label="수정" />}
          >
            <EnabledButton icon={Edit} label="수정" />
          </PermissionGate>
          
          <PermissionGate 
            resource="drivers" 
            action="delete"
            fallback={<DisabledButton icon={Trash2} label="삭제" />}
          >
            <EnabledButton icon={Trash2} label="삭제" />
          </PermissionGate>
        </div>
      </div>

      {/* 정산 관리 권한 테스트 */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          정산 관리 권한
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PermissionGate 
            resource="settlements" 
            action="read"
            fallback={<DisabledButton icon={Eye} label="조회" />}
          >
            <EnabledButton icon={Eye} label="조회" />
          </PermissionGate>
          
          <PermissionGate 
            resource="settlements" 
            action="create"
            fallback={<DisabledButton icon={Plus} label="생성" />}
          >
            <EnabledButton icon={Plus} label="생성" />
          </PermissionGate>
          
          <PermissionGate 
            resource="settlements" 
            action="update"
            fallback={<DisabledButton icon={Edit} label="수정" />}
          >
            <EnabledButton icon={Edit} label="수정" />
          </PermissionGate>
          
          <PermissionGate 
            resource="settlements" 
            action="confirm"
            fallback={<DisabledButton icon={Shield} label="확정" />}
          >
            <EnabledButton icon={Shield} label="확정" />
          </PermissionGate>
        </div>
      </div>

      {/* 역할별 전용 기능 */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          역할별 전용 기능
        </h3>
        
        <div className="space-y-4">
          <AdminOnly fallback={
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600">
              <div className="flex items-center text-neutral-500 dark:text-neutral-400">
                <Settings className="w-5 h-5 mr-2" />
                <span>관리자 전용 - 시스템 설정</span>
                <Lock className="w-4 h-4 ml-2" />
              </div>
            </div>
          }>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center text-red-700 dark:text-red-300">
                <Settings className="w-5 h-5 mr-2" />
                <span className="font-semibold">관리자 전용 - 시스템 설정</span>
                <Unlock className="w-4 h-4 ml-2" />
              </div>
            </div>
          </AdminOnly>

          <ManagerOnly fallback={
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600">
              <div className="flex items-center text-neutral-500 dark:text-neutral-400">
                <Truck className="w-5 h-5 mr-2" />
                <span>관리자/배차담당자 전용 - 운행 관리</span>
                <Lock className="w-4 h-4 ml-2" />
              </div>
            </div>
          }>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center text-blue-700 dark:text-blue-300">
                <Truck className="w-5 h-5 mr-2" />
                <span className="font-semibold">관리자/배차담당자 전용 - 운행 관리</span>
                <Unlock className="w-4 h-4 ml-2" />
              </div>
            </div>
          </ManagerOnly>
        </div>
      </div>

      {/* 권한 매트릭스 */}
      <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          현재 사용자 권한 매트릭스
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left py-2 px-3 font-semibold text-neutral-700 dark:text-neutral-300">리소스</th>
                <th className="text-center py-2 px-3 font-semibold text-neutral-700 dark:text-neutral-300">조회</th>
                <th className="text-center py-2 px-3 font-semibold text-neutral-700 dark:text-neutral-300">생성</th>
                <th className="text-center py-2 px-3 font-semibold text-neutral-700 dark:text-neutral-300">수정</th>
                <th className="text-center py-2 px-3 font-semibold text-neutral-700 dark:text-neutral-300">삭제</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: '기사', resource: 'drivers' },
                { name: '차량', resource: 'vehicles' },
                { name: '노선', resource: 'routes' },
                { name: '운행', resource: 'trips' },
                { name: '정산', resource: 'settlements' },
                { name: '임포트', resource: 'import' },
                { name: '시스템', resource: 'system' }
              ].map((item) => (
                <tr key={item.resource} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-2 px-3 font-medium text-neutral-700 dark:text-neutral-300">{item.name}</td>
                  <td className="text-center py-2 px-3">
                    {hasPermission(item.resource, 'read') ? (
                      <span className="text-success-500">✓</span>
                    ) : (
                      <span className="text-danger-500">✗</span>
                    )}
                  </td>
                  <td className="text-center py-2 px-3">
                    {hasPermission(item.resource, 'create') ? (
                      <span className="text-success-500">✓</span>
                    ) : (
                      <span className="text-danger-500">✗</span>
                    )}
                  </td>
                  <td className="text-center py-2 px-3">
                    {hasPermission(item.resource, 'update') ? (
                      <span className="text-success-500">✓</span>
                    ) : (
                      <span className="text-danger-500">✗</span>
                    )}
                  </td>
                  <td className="text-center py-2 px-3">
                    {hasPermission(item.resource, 'delete') ? (
                      <span className="text-success-500">✓</span>
                    ) : (
                      <span className="text-danger-500">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface ButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
}

function EnabledButton({ icon: Icon, label }: ButtonProps) {
  return (
    <button className="flex flex-col items-center p-3 bg-success-50 hover:bg-success-100 dark:bg-success-900/20 dark:hover:bg-success-900/30 border border-success-200 dark:border-success-800 rounded-lg transition-colors">
      <Icon className="w-5 h-5 text-success-600 dark:text-success-400 mb-1" />
      <span className="text-xs font-medium text-success-700 dark:text-success-300">{label}</span>
    </button>
  )
}

function DisabledButton({ icon: Icon, label }: ButtonProps) {
  return (
    <button disabled className="flex flex-col items-center p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg opacity-50 cursor-not-allowed">
      <Icon className="w-5 h-5 text-neutral-400 mb-1" />
      <span className="text-xs font-medium text-neutral-500">{label}</span>
    </button>
  )
}