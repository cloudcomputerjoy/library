/**
 * Data Validators and Sanitizers
 * Input validation and sanitization utilities
 */

/**
 * Email Validator
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Phone Number Validator (Bangladesh format)
 */
export const validatePhoneNumber = (phone) => {
  // Accept +8801XXXXXXXXX or 01XXXXXXXXX formats
  const phoneRegex = /^(\+88)?01[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * URL Validator
 */
export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Amount Validator (for payments)
 */
export const validateAmount = (amount, min = 1, max = 1000000) => {
  const num = Number(amount);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Date Validator (ISO format)
 */
export const validateDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

/**
 * UUID Validator
 */
export const validateUUID = (uuid) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * ISBN Validator (13-digit)
 */
export const validateISBN = (isbn) => {
  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  if (cleanIsbn.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(cleanIsbn[i]);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }

  const checksum = (10 - (sum % 10)) % 10;
  return checksum === parseInt(cleanIsbn[12]);
};

/**
 * Text Sanitizer - Remove XSS vulnerabilities
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';

  const xssPatterns = {
    script: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    onEvent: /\s*on\w+\s*=\s*["'][^"']*["']/gi,
    html: /<[^>]*>/g,
  };

  let sanitized = text;
  for (const pattern of Object.values(xssPatterns)) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized.trim();
};

/**
 * Trim String
 */
export const trimString = (str, maxLength = null) => {
  let result = str.trim();
  if (maxLength && result.length > maxLength) {
    result = result.substring(0, maxLength);
  }
  return result;
};

/**
 * Validate Object Against Schema
 */
export const validateSchema = (obj, schema) => {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = obj[field];

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Type validation
    if (rules.type && value != null) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
      }
    }

    // Pattern validation (regex)
    if (rules.pattern && value) {
      if (!rules.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
    }

    // Min length validation
    if (rules.minLength && value && value.length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    }

    // Max length validation
    if (rules.maxLength && value && value.length > rules.maxLength) {
      errors.push(`${field} must not exceed ${rules.maxLength} characters`);
    }

    // Min value validation
    if (rules.min != null && value != null && value < rules.min) {
      errors.push(`${field} must be at least ${rules.min}`);
    }

    // Max value validation
    if (rules.max != null && value != null && value > rules.max) {
      errors.push(`${field} must not exceed ${rules.max}`);
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }

    // Custom validation function
    if (rules.custom && !rules.custom(value)) {
      errors.push(rules.customMessage || `${field} validation failed`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Payment Validation Schema
 */
export const paymentSchema = {
  amount: {
    required: true,
    type: 'number',
    min: 1,
    max: 1000000,
  },
  orderId: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 50,
  },
  description: {
    type: 'string',
    maxLength: 500,
  },
  phoneNumber: {
    required: true,
    type: 'string',
    custom: (val) => validatePhoneNumber(val),
    customMessage: 'Invalid phone number format',
  },
};

/**
 * User Validation Schema
 */
export const userSchema = {
  email: {
    required: true,
    type: 'string',
    custom: (val) => validateEmail(val),
    customMessage: 'Invalid email format',
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 128,
  },
  firstName: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 50,
  },
  lastName: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 50,
  },
  phoneNumber: {
    type: 'string',
    custom: (val) => val ? validatePhoneNumber(val) : true,
    customMessage: 'Invalid phone number format',
  },
};

/**
 * Book Validation Schema
 */
export const bookSchema = {
  title: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 200,
  },
  isbn: {
    required: true,
    type: 'string',
    custom: (val) => validateISBN(val),
    customMessage: 'Invalid ISBN format',
  },
  author: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },
  quantity: {
    required: true,
    type: 'number',
    min: 0,
    max: 10000,
  },
  price: {
    required: true,
    type: 'number',
    min: 0,
    max: 1000000,
  },
  category: {
    required: true,
    type: 'string',
    enum: ['fiction', 'non-fiction', 'reference', 'academic', 'other'],
  },
};

/**
 * Sanitize Object - Remove dangerous content from all string fields
 */
export const sanitizeObject = (obj) => {
  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeText(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Validate and Sanitize Request Payload
 */
export const validateAndSanitize = (payload, schema) => {
  // Sanitize first
  const sanitized = sanitizeObject(payload);

  // Then validate
  const validation = validateSchema(sanitized, schema);

  return {
    valid: validation.valid,
    errors: validation.errors,
    data: sanitized,
  };
};

export default {
  // Validators
  validateEmail,
  validatePhoneNumber,
  validateURL,
  validateAmount,
  validateDate,
  validateUUID,
  validateISBN,

  // Sanitizers
  sanitizeText,
  trimString,
  sanitizeObject,

  // Schema Validation
  validateSchema,
  validateAndSanitize,

  // Predefined Schemas
  paymentSchema,
  userSchema,
  bookSchema,
};
