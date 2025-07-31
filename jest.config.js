module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/convex'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'convex/**/*.ts',
    '!convex/**/*.test.ts',
    '!convex/_generated/**',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};