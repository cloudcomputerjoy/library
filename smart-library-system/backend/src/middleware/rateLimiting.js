/**
 * Rate Limiting Middleware
 * Protects endpoints from abuse
 */

import { RateLimitError } from '../utils/errorBoundaries.js';

// In-memory store for rate limits (use Redis in production)
const rateLimitStore = new Map();

/**
 * Clean up old entries from rate limit store
 */
const cleanupStore = () => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
};

/**
 * Generic Rate Limiting Middleware
 */
export const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return (req, res, next) => {
    // Clean up old entries occasionally
    if (Math.random() < 0.1) {
      cleanupStore();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    let userLimitData = rateLimitStore.get(key);

    // Initialize or reset if window expired
    if (!userLimitData || userLimitData.resetTime < now) {
      userLimitData = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Increment request count
    userLimitData.count += 1;
    rateLimitStore.set(key, userLimitData);

    // Calculate retry after time
    const retryAfter = Math.ceil((userLimitData.resetTime - now) / 1000);

    // Set rate limit headers
    res.set('RateLimit-Limit', maxRequests.toString());
    res.set('RateLimit-Remaining', Math.max(0, maxRequests - userLimitData.count).toString());
    res.set('RateLimit-Reset', Math.ceil(userLimitData.resetTime / 1000).toString());

    // Check if limit exceeded
    if (userLimitData.count > maxRequests) {
      throw new RateLimitError(
        'Too many requests, please try again later',
        retryAfter
      );
    }

    next();
  };
};

/**
 * Authentication Rate Limiter
 * More strict limits for auth endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Only 5 attempts
  keyGenerator: (req) => `auth-${req.body?.email || req.ip}`,
});

/**
 * API Rate Limiter
 * Standard limits for API endpoints
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  keyGenerator: (req) => `api-${req.user?.id || req.ip}`,
});

/**
 * Payment Rate Limiter
 * Strict limits for payment endpoints
 */
export const paymentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  keyGenerator: (req) => `payment-${req.user?.id || req.ip}`,
});

/**
 * Upload Rate Limiter
 * Limits for file upload endpoints
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  keyGenerator: (req) => `upload-${req.user?.id || req.ip}`,
});

/**
 * Search Rate Limiter
 * Limits for search endpoints
 */
export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  keyGenerator: (req) => `search-${req.user?.id || req.ip}`,
});

/**
 * Per-Endpoint Rate Limiter Factory
 * Create custom rate limiters for specific endpoints
 */
export const createRateLimiter = (name, options = {}) => {
  const defaults = {
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyGenerator: (req) => `${name}-${req.user?.id || req.ip}`,
  };

  return rateLimit({ ...defaults, ...options });
};

/**
 * Reset Rate Limit for User
 * Admin function to reset rate limit
 */
export const resetRateLimit = (req, res, next) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: 'Identifier is required',
    });
  }

  // Remove matching entries
  let removed = 0;
  for (const [key] of rateLimitStore.entries()) {
    if (key.includes(identifier)) {
      rateLimitStore.delete(key);
      removed += 1;
    }
  }

  res.json({
    success: true,
    message: `Reset rate limit for ${removed} entries`,
  });
};

/**
 * Get Rate Limit Status
 * View current rate limit status
 */
export const getRateLimitStatus = (req, res, next) => {
  const { identifier } = req.query;

  if (!identifier) {
    return res.status(400).json({
      success: false,
      error: 'Identifier is required',
    });
  }

  const data = [];
  const now = Date.now();

  for (const [key, value] of rateLimitStore.entries()) {
    if (key.includes(identifier)) {
      data.push({
        key,
        requests: value.count,
        resetTime: new Date(value.resetTime),
        isExpired: value.resetTime < now,
      });
    }
  }

  res.json({
    success: true,
    data,
  });
};

export default {
  rateLimit,
  authRateLimit,
  apiRateLimit,
  paymentRateLimit,
  uploadRateLimit,
  searchRateLimit,
  createRateLimiter,
  resetRateLimit,
  getRateLimitStatus,
};
