/**
 * Jest Setup File
 * Cấu hình chung cho tất cả tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'clb_vo_test';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test utilities
global.testUtils = {
  // Generate random email
  randomEmail: () => `test${Date.now()}${Math.random().toString(36).substring(7)}@example.com`,
  
  // Generate random phone
  randomPhone: () => `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
  
  // Wait helper
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Create test user data
  createTestUser: () => ({
    email: global.testUtils.randomEmail(),
    password: 'Test123456',
    full_name: 'Test User',
    phone: global.testUtils.randomPhone()
  })
};

// Cleanup after all tests
afterAll(async () => {
  // Close database connections
  const db = require('../config/db');
  if (db && db.end) {
    await db.end();
  }
});
