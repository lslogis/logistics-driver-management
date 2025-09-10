import '@testing-library/jest-dom'

// Increase timeout for database operations
jest.setTimeout(30000)

// Mock environment variables for testing
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/logistics_test'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'

// Override NODE_ENV if needed for testing
if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true
  })
}