/**
 * Express Error Handler Middleware
 * Centralized error handling for all API responses
 */

/**
 * API Error class for consistent error responses
 */
class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Validation Error Helper
 */
class ValidationError extends APIError {
  constructor(message, fields = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.fields = fields;
  }
}

/**
 * Not Found Error Helper
 */
class NotFoundError extends APIError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Unauthorized Error Helper
 */
class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error Helper
 */
class ForbiddenError extends APIError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Conflict Error Helper
 */
class ConflictError extends APIError {
  constructor(message, code = 'CONFLICT') {
    super(message, 409, code);
  }
}

/**
 * Main error handler middleware
 * Must be the last middleware in Express
 */
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let response = {
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  };

  // Add validation error fields if present
  if (err instanceof ValidationError && err.fields) {
    response.fields = err.fields;
  }

  // Add request ID for tracking if available
  if (req.id) {
    response.requestId = req.id;
  }

  // Supabase error handling
  if (err.message && err.message.includes('duplicate')) {
    statusCode = 409;
    response.code = 'DUPLICATE_ENTRY';
    response.error = 'This record already exists';
  }

  // PostgreSQL error handling
  if (err.code === '23505') {
    statusCode = 409;
    response.code = 'UNIQUE_VIOLATION';
    response.error = 'This value already exists';
  }

  // Foreign key constraint error
  if (err.code === '23503') {
    statusCode = 400;
    response.code = 'FOREIGN_KEY_VIOLATION';
    response.error = 'Invalid reference to another record';
  }

  // File size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    response.code = 'FILE_TOO_LARGE';
    response.error = `File size exceeds limit: ${err.limit} bytes`;
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      response.code = 'FILE_TOO_LARGE';
      response.error = 'File size exceeds maximum limit';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      statusCode = 400;
      response.code = 'TOO_MANY_FILES';
      response.error = 'Too many files uploaded';
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    response.code = 'INVALID_TOKEN';
    response.error = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    response.code = 'TOKEN_EXPIRED';
    response.error = 'Authentication token has expired';
  }

  // Development-only error details
  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      originalError: err.message,
      stack: err.stack,
    };
  }

  res.status(statusCode).json(response);
};

/**
 * Async route wrapper to catch errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle 404 - Not Found
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method,
  });
};

module.exports = {
  APIError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
};
