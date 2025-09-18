/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: [
    '**/?(*.)+(test).[tj]s?(x)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/not-found.tsx',
    '!src/app/**/error.tsx',
    '!src/middleware.ts'
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/tests/e2e/'
  ],
  verbose: true,
  bail: 1,
  maxWorkers: '50%'
}

if (!process.env.DATABASE_URL) {
  console.warn('Skipping DB integration tests (no DATABASE_URL set)')
  config.testPathIgnorePatterns = [
    ...config.testPathIgnorePatterns,
    '<rootDir>/tests/api/',
    '<rootDir>/tests/services/',
    '<rootDir>/tests/charter.test.js',
    '<rootDir>/tests/settlement.test.ts'
  ]
}

module.exports = config
