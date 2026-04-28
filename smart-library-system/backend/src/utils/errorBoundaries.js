/**
 * Error Boundaries and Custom Error Classes
 * Centralized error handling for the application
 */

/**
 * Base Application Error Class
 */
export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode || 500;
    this.code = code || 'INTERNAL_SERVER_ERROR';
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

/**
 * Authentication Error - 401
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization Error - 403
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not Found Error - 404
 */
export class NotFoundError extends AppError {
  constructor(message, resource = 'Resource') {
    super(message || `${resource} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

/**
 * Conflict Error - 409
 */
export class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 409, 'CONFLICT');
    this.details = details;
  }
}

/**
 * Rate Limit Error - 429
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

/**
 * Service Integration Error - 503
 */
export class IntegrationError extends AppError {
  constructor(service, message, originalError = null) {
    super(message || `${service} integration failed`, 503, 'INTEGRATION_ERROR');
    this.service = service;
    this.originalError = originalError;
  }
}

/**
 * Database Error - 500
 */
export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message || 'Database operation failed', 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

/**
 * Payment Error - 402
 */
export class PaymentError extends AppError {
  constructor(message, paymentMethod, transactionId = null) {
    super(message, 402, 'PAYMENT_ERROR');
    this.paymentMethod = paymentMethod;
    this.transactionId = transactionId;
  }
}

/**
 * File Operation Error
 */
export class FileOperationError extends AppError {
  constructor(message, operation, filename = null) {
    super(message, 500, 'FILE_OPERATION_ERROR');
    this.operation = operation;
    this.filename = filename;
  }
}

/**
 * Global Error Handler Middleware
 * Should be the last middleware in the chain
 */
export const errorHandler = (err, req, res, next) => {
  // Set defaults
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_SERVER_ERROR',
    statusCode: err.statusCode || 500,
  };

  // Add additional error details based on environment
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    error.originalError = err.originalError;
  }

  // Log error
  console.error('Error:', {
    message: err.message,
    code: error.code,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });

  // Add database error details if available
  if (err instanceof DatabaseError && err.originalError) {
    error.dbCode = err.originalError.code;
  }

  // Add validation error details
  if (err instanceof ValidationError && err.details) {
    error.details = err.details;
  }

  // Add rate limit retry information
  if (err instanceof RateLimitError && err.retryAfter) {
    res.set('Retry-After', error.retryAfter);
  }

  // Send response
  res.status(error.statusCode).json(error);
};

/**
 * Async Error Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Error Logger
 * Logs errors with context
 */
export const logError = (error, context = {}) => {
  const errorLog = {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
    context,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      originalError: error.originalError,
    }),
  };

  console.error('ERROR LOG:', errorLog);

  // Here you could integrate with external logging service
  // e.g., Sentry, LogRocket, etc.
};

/**
 * Error Formatter
 * Formats errors for API responses
 */
export const formatError = (error) => {
  if (error instanceof AppError) {
    return {
      success: false,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      ...(error.details && { details: error.details }),
    };
  }

  // Handle unknown errors
  return {
    success: false,
    message: 'An unexpected error occurred',
    code: 'INTERNAL_SERVER_ERROR',
    statusCode: 500,
  };
};

/**
 * Error Recovery Helper
 * Attempts to recover from specific error types
 */
export const tryRecovery = async (operation, maxRetries = 3) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Only retry on specific error types
      if (
        error instanceof DatabaseError ||
        error instanceof IntegrationError ||
        (error.code && ['ECONNREFUSED', 'ETIMEDOUT'].includes(error.code))
      ) {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
        continue;
      }

      throw error;
    }
  }

  throw lastError;
};

export default {
  // Error Classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  IntegrationError,
  DatabaseError,
  PaymentError,
  FileOperationError,

  // Middleware
  errorHandler,
  asyncHandler,

  // Utilities
  logError,
  formatError,
  tryRecovery,
};
