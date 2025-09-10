import { PrismaClient } from '@prisma/client'

// Prisma Client 싱글톤 패턴
// 개발 환경에서 Hot Reload로 인한 다중 인스턴스 생성 방지

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Prisma Client Extensions (향후 확장 가능)
// 예: Audit Log 자동화, Soft Delete 등

export default prisma