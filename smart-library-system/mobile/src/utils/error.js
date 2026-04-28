/**
 * Error Handler Utility
 * Centralized error handling and user-friendly messages
 */

import { ERROR_CODES } from '../constants';
import * as logger from './logger';

/**
 * Parse API error and return user-friendly message
 */
export const parseAPIError = (error) => {
  try {
    // Network error (no internet)
    if (!error.response) {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: 'Unable to connect to server. Please check your internet connection.',
        statusCode: null,
        details: error.message,
      };
    }

    const { status, data } = error.response;

    // 401 - Unauthorized (expired or invalid token)
    if (status === 401) {
      return {
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: 'Your session has expired. Please login again.',
        statusCode: 401,
        details: data?.message || 'Unauthorized',
      };
    }

    // 403 - Forbidden (no permission)
    if (status === 403) {
      return {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'You do not have permission to perform this action.',
        statusCode: 403,
        details: data?.message || 'Forbidden',
      };
    }

    // 404 - Not found
    if (status === 404) {
      return {
        code: ERROR_CODES.NOT_FOUND,
        message: 'The requested resource was not found.',
        statusCode: 404,
        details: data?.message || 'Not Found',
      };
    }

    // 400/422 - Validation error
    if (status === 400 || status === 422) {
      const message = data?.message || data?.error || 'Validation failed';
      return {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: typeof message === 'string' ? message : 'Please check your input and try again.',
        statusCode: status,
        details: data?.errors || message,
      };
    }

    // 5xx - Server error
    if (status >= 500) {
      return {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'A server error occurred. Please try again later.',
        statusCode: status,
        details: data?.message || 'Server Error',
      };
    }

    // Other errors
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: data?.message || 'An unexpected error occurred. Please try again.',
      statusCode: status,
      details: data || error.message,
    };
  } catch (err) {
    logger.error('Error parsing API error', err);
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: 'An unexpected error occurred. Please try again.',
      statusCode: null,
      details: error.message || 'Unknown error',
    };
  }
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  const parsedError = parseAPIError(error);
  return parsedError.message;
};

/**
 * Check if error is recoverable
 */
export const isRecoverableError = (error) => {
  const parsedError = parseAPIError(error);
  
  // Network errors are recoverable (can retry)
  if (parsedError.code === ERROR_CODES.NETWORK_ERROR) {
    return true;
  }

  // 5xx server errors are recoverable
  if (parsedError.code === ERROR_CODES.SERVER_ERROR) {
    return true;
  }

  // Token expired is recoverable (user can login again)
  if (parsedError.code === ERROR_CODES.TOKEN_EXPIRED) {
    return true;
  }

  return false;
};

/**
 * Check if error requires logout
 */
export const requiresLogout = (error) => {
  const parsedError = parseAPIError(error);
  return parsedError.code === ERROR_CODES.TOKEN_EXPIRED;
};

/**
 * Validation error extractor
 * Returns field-specific validation errors
 */
export const getValidationErrors = (error) => {
  if (!error.response || !error.response.data) {
    return {};
  }

  const { data } = error.response;

  // Handle field-specific errors
  if (data.errors && typeof data.errors === 'object') {
    return data.errors;
  }

  // Handle generic validation message
  if (data.message && typeof data.message === 'string') {
    return { general: data.message };
  }

  return {};
};

/**
 * Handle auth errors specifically
 */
export const handleAuthError = (error) => {
  const parsedError = parseAPIError(error);

  switch (parsedError.code) {
    case ERROR_CODES.TOKEN_EXPIRED:
      return {
        action: 'LOGOUT',
        message: 'Your session has expired. Please login again.',
      };
    case ERROR_CODES.UNAUTHORIZED:
      return {
        action: 'RETRY',
        message: 'Authentication failed. Please try again.',
      };
    default:
      return {
        action: 'SHOW_ERROR',
        message: parsedError.message,
      };
  }
};

/**
 * Normalize error for consistent handling
 */
export const normalizeError = (error) => {
  if (!error) {
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
      statusCode: null,
      isRecoverable: false,
      requiresLogout: false,
    };
  }

  const parsedError = parseAPIError(error);

  return {
    code: parsedError.code,
    message: parsedError.message,
    statusCode: parsedError.statusCode,
    details: parsedError.details,
    isRecoverable: isRecoverableError(error),
    requiresLogout: requiresLogout(error),
  };
};

/**
 * Handle common errors with specific actions
 */
export const handleError = (error, context = 'general') => {
  const normalizedError = normalizeError(error);

  // Log the error
  logger.error(`Error in ${context}`, error);

  // Return normalized error for UI
  return normalizedError;
};

/**
 * Error boundary error handler
 */
export const handleErrorBoundary = (error, errorInfo) => {
  logger.error('Error Boundary caught error', { error, errorInfo }, 'ERROR_BOUNDARY');

  return {
    message: 'Something went wrong. Please refresh the app and try again.',
    action: 'REFRESH',
    canRetry: true,
  };
};

/**
 * Timeout error handler
 */
export const createTimeoutError = (operation, timeout) => {
  return {
    message: `${operation} took too long. Please check your connection and try again.`,
    code: ERROR_CODES.NETWORK_ERROR,
    isRecoverable: true,
  };
};

/**
 * Retry handler with exponential backoff
 */
export const createRetryHandler = (fn, maxRetries = 3, baseDelay = 1000) => {
  return async (...args) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (err) {
        lastError = err;
        
        const isRecoverable = isRecoverableError(err);
        if (!isRecoverable || attempt === maxRetries) {
          throw err;
        }

        // Exponential backoff: 1s, 2s, 4s...
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`Attempt ${attempt} failed. Retrying in ${delay}ms...`, null, 'RETRY');
        
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  };
};

/**
 * Safe async function wrapper
 */
export const safeAsync = async (fn, onError = null) => {
  try {
    return await fn();
  } catch (error) {
    if (onError) {
      onError(normalizeError(error));
    }
    throw error;
  }
};

/**
 * Form validation error handler
 */
export const handleFormValidationError = (error) => {
  const validationErrors = getValidationErrors(error);
  
  return {
    isValidationError: Object.keys(validationErrors).length > 0,
    errors: validationErrors,
    message: parseAPIError(error).message,
  };
};

export default {
  parseAPIError,
  getErrorMessage,
  isRecoverableError,
  requiresLogout,
  getValidationErrors,
  handleAuthError,
  normalizeError,
  handleError,
  handleErrorBoundary,
  createTimeoutError,
  createRetryHandler,
  safeAsync,
  handleFormValidationError,
};
