/**
 * Jest Configuration
 * Cấu hình cho Jest testing framework
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**'
  ],


  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],

  // Setup files
  setupFiles: ['<rootDir>/tests/setup.js'],

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Module paths
  modulePaths: ['<rootDir>'],

  // Transform files
  transform: {},

  // Ignore patterns
  testPathIgnorePatterns: [
    '/tests/helpers/',
    '/node_modules/',
    '/coverage/'
  ]
};
