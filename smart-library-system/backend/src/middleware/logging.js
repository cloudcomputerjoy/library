/**
 * Request Logging Middleware
 * Logs all incoming requests and responses
 */

import { formatDate } from '../utils/helpers.js';

/**
 * Logger configuration
 */
const logConfig = {
  includeRequestBody: process.env.LOG_REQUEST_BODY === 'true',
  includeResponseBody: process.env.LOG_RESPONSE_BODY === 'true',
  excludePaths: ['/health', '/ping', '/metrics'], // Paths to exclude from logging
  excludeStatusCodes: [], // Status codes to exclude
};

/**
 * Format request data for logging
 */
const formatRequest = (req) => {
  return {
    method: req.method,
    path: req.path,
    query: req.query,
    headers: {
      'content-type': req.get('content-type'),
      'user-agent': req.get('user-agent'),
      authorization: req.get('authorization') ? 'Bearer [...]' : undefined,
    },
    ...(logConfig.includeRequestBody && req.body && { body: req.body }),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id,
    timestamp: formatDate(new Date()),
  };
};

/**
 * Format response data for logging
 */
const formatResponse = (statusCode, responseTime) => {
  return {
    statusCode,
    responseTime: `${responseTime}ms`,
    timestamp: formatDate(new Date()),
  };
};

/**
 * Main logging middleware
 */
export const requestLogger = (req, res, next) => {
  // Skip logging for excluded paths
  if (logConfig.excludePaths.includes(req.path)) {
    return next();
  }

  const startTime = Date.now();

  // Log incoming request
  console.log('→ INCOMING REQUEST', {
    ...formatRequest(req),
  });

  // Capture original response methods
  const originalJson = res.json;
  const originalSend = res.send;

  // Override json response method
  res.json = function (data) {
    const responseTime = Date.now() - startTime;

    // Skip logging for excluded status codes
    if (!logConfig.excludeStatusCodes.includes(res.statusCode)) {
      console.log('← OUTGOING RESPONSE', {
        ...formatResponse(res.statusCode, responseTime),
        ...(logConfig.includeResponseBody && { body: data }),
      });
    }

    return originalJson.call(this, data);
  };

  // Override send response method
  res.send = function (data) {
    const responseTime = Date.now() - startTime;

    // Skip logging for excluded status codes
    if (!logConfig.excludeStatusCodes.includes(res.statusCode)) {
      console.log('← OUTGOING RESPONSE', {
        ...formatResponse(res.statusCode, responseTime),
        ...(logConfig.includeResponseBody && data && { body: data.toString() }),
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Request/Response timing middleware
 */
export const requestTimer = (req, res, next) => {
  req.startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - req.startTime;

    // Log slow requests
    if (duration > 1000) {
      console.warn('⏱️ SLOW REQUEST DETECTED', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    }
  });

  next();
};

/**
 * Error logging middleware
 */
export const errorLogger = (err, req, res, next) => {
  console.error('❌ ERROR', {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode || 500,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    timestamp: formatDate(new Date()),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });

  next(err);
};

/**
 * Access log format options
 * Can be used with express-morgan if desired
 */
export const logFormats = {
  dev: ':method :url :status :response-time ms',
  combined: ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
  tiny: ':method :url :status :res[content-length] - :response-time ms',
};

/**
 * Request correlation ID middleware
 * Adds correlation ID for tracking requests across services
 */
export const correlationId = (req, res, next) => {
  const id = req.headers['x-correlation-id'] || generateCorrelationId();
  req.correlationId = id;
  res.set('X-Correlation-ID', id);
  next();
};

/**
 * Generate correlation ID
 */
function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Structured logging utility
 */
export const log = {
  info: (message, data = {}) => {
    console.log(`ℹ️ INFO: ${message}`, data);
  },

  warn: (message, data = {}) => {
    console.warn(`⚠️ WARN: ${message}`, data);
  },

  error: (message, data = {}) => {
    console.error(`❌ ERROR: ${message}`, data);
  },

  debug: (message, data = {}) => {
    if (process.env.DEBUG === 'true') {
      console.log(`🐛 DEBUG: ${message}`, data);
    }
  },

  trace: (message, data = {}) => {
    if (process.env.TRACE === 'true') {
      console.log(`🔍 TRACE: ${message}`, data);
    }
  },
};

/**
 * API call logger
 * Logs external API calls
 */
export const logApiCall = (service, method, endpoint, statusCode, duration) => {
  const status =
    statusCode >= 200 && statusCode < 300
      ? '✅'
      : statusCode >= 400 && statusCode < 500
        ? '⚠️'
        : '❌';

  console.log(`${status} API CALL: ${service} ${method} ${endpoint}`, {
    statusCode,
    duration: `${duration}ms`,
    timestamp: formatDate(new Date()),
  });
};

/**
 * Database query logger
 * Logs database queries
 */
export const logDatabaseQuery = (table, operation, duration, success = true) => {
  const status = success ? '✅' : '❌';

  console.log(`${status} DATABASE: ${operation} on ${table}`, {
    duration: `${duration}ms`,
    timestamp: formatDate(new Date()),
  });
};

export default {
  requestLogger,
  requestTimer,
  errorLogger,
  correlationId,
  logApiCall,
  logDatabaseQuery,
  log,
};
