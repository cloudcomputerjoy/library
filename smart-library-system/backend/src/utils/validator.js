/**
 * Input Validation Utilities
 * Helper functions for validating common input patterns
 */

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (international format)
 */
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate student ID format
 */
const validateStudentId = (studentId) => {
  // Format: YYYY-0001 (batch year + sequence)
  const studentIdRegex = /^\d{4}-\d{4}$/;
  return studentIdRegex.test(studentId);
};

/**
 * Validate library card ID
 */
const validateLibraryCardId = (cardId) => {
  // Alphanumeric, 10-20 characters
  return cardId && cardId.length >= 10 && cardId.length <= 20;
};

/**
 * Validate ISBN format
 */
const validateISBN = (isbn) => {
  // Remove hyphens and spaces
  const clean = isbn.replace(/[-\s]/g, '');
  
  // Check if ISBN-10 or ISBN-13
  if (clean.length === 10 || clean.length === 13) {
    return /^\d+$/.test(clean);
  }
  return false;
};

/**
 * Validate date format (YYYY-MM-DD)
 */
const validateDate = (dateString) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validate required field
 */
const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      valid: false,
      error: `${fieldName} is required`,
    };
  }
  return { valid: true };
};

/**
 * Validate field length
 */
const validateLength = (value, fieldName, minLength, maxLength) => {
  if (value.length < minLength || value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be between ${minLength} and ${maxLength} characters`,
    };
  }
  return { valid: true };
};

/**
 * Batch validate multiple fields
 */
const validateFields = (data, rules) => {
  const errors = {};

  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const result = validator(data[field], field);
      if (!result.valid) {
        errors[field] = result.error;
        break;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitize string input (remove special characters)
 */
const sanitizeString = (str) => {
  return str
    .replace(/[<>\"']/g, '')
    .trim();
};

/**
 * Validate file type
 */
const validateFileType = (mimeType, allowedTypes) => {
  return allowedTypes.includes(mimeType);
};

/**
 * Validate file size (in bytes)
 */
const validateFileSize = (fileSize, maxSize) => {
  return fileSize <= maxSize;
};

module.exports = {
  validateEmail,
  validatePhoneNumber,
  validateStudentId,
  validateLibraryCardId,
  validateISBN,
  validateDate,
  validateRequired,
  validateLength,
  validateFields,
  sanitizeString,
  validateFileType,
  validateFileSize,
};
