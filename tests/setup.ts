import '@testing-library/jest-dom'
import { beforeAll, beforeEach, afterAll, afterEach } from '@jest/globals'
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

// Increase timeout for database operations
jest.setTimeout(30000)

// Mock environment variables for testing
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/logistics_test'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Override NODE_ENV if needed for testing
if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true
  })
}

// Global test database setup
const prisma = new PrismaClient()

beforeAll(async () => {
  // Deploy database schema for testing
  try {
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
      }
    })
  } catch (error) {
    console.warn('Could not deploy migrations for testing:', error)
  }
})

beforeEach(async () => {
  // Clean up database before each test
  try {
    await prisma.settlementItem.deleteMany()
    await prisma.settlement.deleteMany()
    await prisma.trip.deleteMany()
    await prisma.fixedRoute.deleteMany()
    await prisma.loadingPoint.deleteMany()
    await prisma.routeTemplate.deleteMany()
    await prisma.vehicle.deleteMany()
    await prisma.driver.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
  } catch (error) {
    console.warn('Could not clean database:', error)
  }
})

afterEach(async () => {
  // Additional cleanup if needed
})

afterAll(async () => {
  await prisma.$disconnect()
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN'
      }
    },
    status: 'authenticated'
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Export test utilities
export const testPrisma = prisma
export const createTestUser = async () => {
  return await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
      role: 'ADMIN',
      isActive: true
    }
  })
}

export const createTestDriver = async () => {
  return await prisma.driver.create({
    data: {
      name: '테스트 기사',
      phone: '010-1234-5678',
      businessNumber: '123-45-67890',
      bankName: '테스트 은행',
      accountNumber: '123456789',
      businessName: '테스트 운송',
      representative: '홍길동',
      vehicleNumber: '12가3456',
      isActive: true
    }
  })
}