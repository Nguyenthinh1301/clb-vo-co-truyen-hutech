/**
 * Advanced Security Middleware
 * Additional security features: 2FA, IP whitelist, rate limiting
 */

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const logger = require('../services/loggerService');
const cacheService = require('../services/cacheService');

/**
 * IP Whitelist Middleware
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Skip if no whitelist configured
    if (!allowedIPs || allowedIPs.length === 0) {
      return next();
    }

    // Check if IP is whitelisted
    if (allowedIPs.includes(clientIP)) {
      return next();
    }

    logger.warn(`Blocked request from non-whitelisted IP: ${clientIP}`);
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied: IP not whitelisted',
        code: 'IP_NOT_WHITELISTED'
      }
    });
  };
};

/**
 * Request Signature Verification
 */
const verifySignature = (req, res, next) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const apiKey = req.headers['x-api-key'];

  if (!signature || !timestamp || !apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Missing security headers',
        code: 'MISSING_SECURITY_HEADERS'
      }
    });
  }

  // Check timestamp (prevent replay attacks)
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  const timeDiff = Math.abs(now - requestTime);

  if (timeDiff > 300000) { // 5 minutes
    return res.status(401).json({
      success: false,
      error: {
        message: 'Request expired',
        code: 'REQUEST_EXPIRED'
      }
    });
  }

  // Verify signature
  const payload = JSON.stringify(req.body) + timestamp;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.API_SECRET || 'default-secret')
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    logger.warn('Invalid request signature');
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid signature',
        code: 'INVALID_SIGNATURE'
      }
    });
  }

  next();
};

/**
 * Two-Factor Authentication (2FA) Service
 */
class TwoFactorAuth {
  /**
   * Generate 2FA secret for user
   */
  static generateSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: `CLB Võ Cổ Truyền HUTECH (${userEmail})`,
      issuer: 'CLB Võ Cổ Truyền HUTECH'
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url
    };
  }

  /**
   * Generate QR code for 2FA setup
   */
  static async generateQRCode(otpauthUrl) {
    try {
      const qrCode = await QRCode.toDataURL(otpauthUrl);
      return qrCode;
    } catch (error) {
      logger.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA token
   */
  static verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after
    });
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}

/**
 * 2FA Verification Middleware
 */
const require2FA = async (req, res, next) => {
  const user = req.user;

  // Skip if 2FA not enabled for user
  if (!user.two_factor_enabled) {
    return next();
  }

  const token = req.headers['x-2fa-token'] || req.body.twoFactorToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: '2FA token required',
        code: '2FA_REQUIRED'
      }
    });
  }

  // Verify token
  const isValid = TwoFactorAuth.verifyToken(user.two_factor_secret, token);

  if (!isValid) {
    logger.warn(`Invalid 2FA token for user ${user.id}`);
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid 2FA token',
        code: 'INVALID_2FA_TOKEN'
      }
    });
  }

  next();
};

/**
 * Advanced Rate Limiting with Redis-like cache
 */
class AdvancedRateLimiter {
  /**
   * Create rate limiter
   */
  static create(options = {}) {
    const {
      windowMs = 60000, // 1 minute
      maxRequests = 100,
      keyGenerator = (req) => req.ip,
      skipSuccessfulRequests = false,
      skipFailedRequests = false
    } = options;

    return async (req, res, next) => {
      const key = `ratelimit:${keyGenerator(req)}`;
      
      // Get current count
      let count = cacheService.get(key) || 0;
      
      // Increment count
      count++;
      cacheService.set(key, count, Math.ceil(windowMs / 1000));

      // Set headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));
      res.setHeader('X-RateLimit-Reset', Date.now() + windowMs);

      // Check if limit exceeded
      if (count > maxRequests) {
        logger.warn(`Rate limit exceeded for ${keyGenerator(req)}`);
        return res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(windowMs / 1000)
          }
        });
      }

      // Handle response
      const originalSend = res.send;
      res.send = function(data) {
        // Decrement on successful request if configured
        if (skipSuccessfulRequests && res.statusCode < 400) {
          cacheService.decrement(key);
        }
        
        // Decrement on failed request if configured
        if (skipFailedRequests && res.statusCode >= 400) {
          cacheService.decrement(key);
        }

        originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Create sliding window rate limiter
   */
  static createSlidingWindow(options = {}) {
    const {
      windowMs = 60000,
      maxRequests = 100,
      keyGenerator = (req) => req.ip
    } = options;

    return async (req, res, next) => {
      const key = `ratelimit:sliding:${keyGenerator(req)}`;
      const now = Date.now();
      
      // Get request timestamps
      let timestamps = cacheService.get(key) || [];
      
      // Remove old timestamps
      timestamps = timestamps.filter(ts => now - ts < windowMs);
      
      // Add current timestamp
      timestamps.push(now);
      
      // Save timestamps
      cacheService.set(key, timestamps, Math.ceil(windowMs / 1000));

      // Set headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - timestamps.length));

      // Check if limit exceeded
      if (timestamps.length > maxRequests) {
        logger.warn(`Sliding window rate limit exceeded for ${keyGenerator(req)}`);
        return res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED'
          }
        });
      }

      next();
    };
  }
}

/**
 * CSRF Protection
 */
const csrfProtection = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    logger.warn('CSRF token validation failed');
    return res.status(403).json({
      success: false,
      error: {
        message: 'Invalid CSRF token',
        code: 'INVALID_CSRF_TOKEN'
      }
    });
  }

  next();
};

/**
 * Generate CSRF token
 */
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Security Audit Logger
 */
class SecurityAudit {
  static log(event, details, req) {
    const auditLog = {
      event,
      details,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      path: req.path,
      method: req.method
    };

    logger.info('Security Audit:', auditLog);
    
    // Store in cache for recent audits
    const key = `audit:${Date.now()}`;
    cacheService.set(key, auditLog, 86400); // 24 hours
  }

  static async getRecentAudits(limit = 100) {
    const keys = cacheService.keys('audit:*');
    const audits = keys
      .slice(-limit)
      .map(key => cacheService.get(key))
      .filter(Boolean);
    
    return audits;
  }
}

module.exports = {
  ipWhitelist,
  verifySignature,
  TwoFactorAuth,
  require2FA,
  AdvancedRateLimiter,
  csrfProtection,
  generateCSRFToken,
  SecurityAudit
};
