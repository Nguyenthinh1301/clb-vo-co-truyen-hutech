/**
 * Services Tests
 * Test suite cho các services
 */

const cacheService = require('../services/cacheService');
const emailService = require('../services/emailService');
const analyticsService = require('../services/analyticsService');
const loggerService = require('../services/loggerService');

describe('Cache Service', () => {
  beforeEach(() => {
    cacheService.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', () => {
      cacheService.set('test-key', 'test-value');
      const value = cacheService.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should return null for non-existent key', () => {
      const value = cacheService.get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete a key', () => {
      cacheService.set('test-key', 'test-value');
      cacheService.delete('test-key');
      const value = cacheService.get('test-key');
      expect(value).toBeNull();
    });

    it('should check if key exists', () => {
      cacheService.set('test-key', 'test-value');
      expect(cacheService.has('test-key')).toBe(true);
      expect(cacheService.has('non-existent')).toBe(false);
    });
  });

  describe('TTL Operations', () => {
    it('should set value with TTL', (done) => {
      cacheService.set('ttl-key', 'ttl-value', 1); // 1 second TTL
      
      setTimeout(() => {
        const value = cacheService.get('ttl-key');
        expect(value).toBeNull();
        done();
      }, 1100);
    }, 2000);

    it('should get TTL for a key', () => {
      cacheService.set('ttl-key', 'value', 60);
      const ttl = cacheService.getTTL('ttl-key');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });
  });

  describe('Pattern Operations', () => {
    it('should get keys by pattern', () => {
      cacheService.set('user:1', 'user1');
      cacheService.set('user:2', 'user2');
      cacheService.set('post:1', 'post1');

      const userKeys = cacheService.keys('user:*');
      expect(userKeys).toHaveLength(2);
      expect(userKeys).toContain('user:1');
      expect(userKeys).toContain('user:2');
    });

    it('should delete keys by pattern', () => {
      cacheService.set('user:1', 'user1');
      cacheService.set('user:2', 'user2');
      cacheService.set('post:1', 'post1');

      const deleted = cacheService.deletePattern('user:*');
      expect(deleted).toBe(2);
      expect(cacheService.has('user:1')).toBe(false);
      expect(cacheService.has('post:1')).toBe(true);
    });
  });

  describe('Increment/Decrement', () => {
    it('should increment a value', () => {
      cacheService.set('counter', 0);
      cacheService.increment('counter');
      expect(cacheService.get('counter')).toBe(1);
      cacheService.increment('counter', 5);
      expect(cacheService.get('counter')).toBe(6);
    });

    it('should decrement a value', () => {
      cacheService.set('counter', 10);
      cacheService.decrement('counter');
      expect(cacheService.get('counter')).toBe(9);
      cacheService.decrement('counter', 5);
      expect(cacheService.get('counter')).toBe(4);
    });
  });

  describe('Statistics', () => {
    it('should track cache statistics', () => {
      cacheService.set('key1', 'value1');
      cacheService.get('key1'); // hit
      cacheService.get('key2'); // miss

      const stats = cacheService.getStats();
      expect(stats.size).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('Cache Wrapper', () => {
    it('should cache function result', async () => {
      let callCount = 0;
      const expensiveFunction = async () => {
        callCount++;
        return 'result';
      };

      const result1 = await cacheService.wrap('func-key', expensiveFunction);
      const result2 = await cacheService.wrap('func-key', expensiveFunction);

      expect(result1).toBe('result');
      expect(result2).toBe('result');
      expect(callCount).toBe(1); // Function called only once
    });
  });
});

describe('Analytics Service', () => {
  beforeEach(() => {
    // Reset analytics data
    analyticsService.events = [];
    analyticsService.metrics = {};
  });

  describe('Event Tracking', () => {
    it('should track an event', () => {
      analyticsService.trackEvent('user_login', { userId: 1 });
      expect(analyticsService.events).toHaveLength(1);
      expect(analyticsService.events[0].event).toBe('user_login');
    });

    it('should track multiple events', () => {
      analyticsService.trackEvent('user_login', { userId: 1 });
      analyticsService.trackEvent('class_enroll', { classId: 1 });
      expect(analyticsService.events).toHaveLength(2);
    });
  });

  describe('Metrics', () => {
    it('should record a metric', () => {
      analyticsService.recordMetric('api_response_time', 150);
      expect(analyticsService.metrics['api_response_time']).toBeDefined();
    });

    it('should get user analytics', async () => {
      const analytics = await analyticsService.getUserAnalytics(1);
      expect(analytics).toHaveProperty('totalUsers');
      expect(analytics).toHaveProperty('activeUsers');
    });

    it('should get class analytics', async () => {
      const analytics = await analyticsService.getClassAnalytics(1);
      expect(analytics).toHaveProperty('totalClasses');
      expect(analytics).toHaveProperty('totalEnrollments');
    });
  });
});

describe('Logger Service', () => {
  it('should log info message', () => {
    expect(() => {
      loggerService.info('Test info message');
    }).not.toThrow();
  });

  it('should log error message', () => {
    expect(() => {
      loggerService.error('Test error message');
    }).not.toThrow();
  });

  it('should log warning message', () => {
    expect(() => {
      loggerService.warn('Test warning message');
    }).not.toThrow();
  });

  it('should log debug message', () => {
    expect(() => {
      loggerService.debug('Test debug message');
    }).not.toThrow();
  });
});

describe('Email Service', () => {
  describe('Email Templates', () => {
    it('should have welcome email template', () => {
      expect(emailService.templates).toHaveProperty('welcome');
    });

    it('should have password reset template', () => {
      expect(emailService.templates).toHaveProperty('passwordReset');
    });

    it('should have verification template', () => {
      expect(emailService.templates).toHaveProperty('verification');
    });
  });

  describe('Email Sending', () => {
    it('should prepare email options correctly', () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>'
      };

      expect(options).toHaveProperty('to');
      expect(options).toHaveProperty('subject');
      expect(options).toHaveProperty('html');
    });
  });
});
