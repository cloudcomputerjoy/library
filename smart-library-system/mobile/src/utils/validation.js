/**
 * Input Validation Utilities
 * Validate email, phone, password, form inputs
 */

/**
 * Email validation
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email is required' };
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
};

/**
 * Phone number validation
 * Supports Indian phone numbers (10 digits)
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Phone number is required' };
  }
  
  const cleaned = phone.replace(/\D/g, '');
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: 'Phone number must be 10 digits' };
  }
  
  return { valid: true };
};

/**
 * Password validation
 * Minimum 8 characters, at least one uppercase, one lowercase, one number
 */
export const validatePassword = (password, minLength = 8) => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < minLength) {
    return {
      valid: false,
      error: `Password must be at least ${minLength} characters`,
    };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain a number' };
  }
  
  return { valid: true };
};

/**
 * Name validation
 */
export const validateName = (name) => {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Name is required' };
  }
  
  if (name.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (name.length > 50) {
    return { valid: false, error: 'Name must not exceed 50 characters' };
  }
  
  return { valid: true };
};

/**
 * Text field validation
 */
export const validateText = (text, minLength = 1, maxLength = 500) => {
  if (minLength > 0 && (!text || text.trim() === '')) {
    return { valid: false, error: 'This field is required' };
  }
  
  if (text && text.length < minLength) {
    return {
      valid: false,
      error: `Must be at least ${minLength} characters`,
    };
  }
  
  if (text && text.length > maxLength) {
    return {
      valid: false,
      error: `Must not exceed ${maxLength} characters`,
    };
  }
  
  return { valid: true };
};

/**
 * ISBN validation
 * Accepts ISBN-10 or ISBN-13
 */
export const validateISBN = (isbn) => {
  if (!isbn) {
    return { valid: false, error: 'ISBN is required' };
  }
  
  const cleaned = isbn.replace(/[-\s]/g, '');
  
  // ISBN-10: 10 digits
  if (cleaned.length === 10) {
    if (!/^\d{10}$/.test(cleaned)) {
      return { valid: false, error: 'Invalid ISBN-10 format' };
    }
    return { valid: true };
  }
  
  // ISBN-13: 13 digits starting with 978 or 979
  if (cleaned.length === 13) {
    if (!/^\d{13}$/.test(cleaned)) {
      return { valid: false, error: 'Invalid ISBN-13 format' };
    }
    if (!/^(978|979)/.test(cleaned)) {
      return { valid: false, error: 'ISBN-13 must start with 978 or 979' };
    }
    return { valid: true };
  }
  
  return {
    valid: false,
    error: 'ISBN must be 10 or 13 digits',
  };
};

/**
 * OTP validation
 * 6-digit numeric code
 */
export const validateOTP = (otp) => {
  if (!otp || otp.trim() === '') {
    return { valid: false, error: 'OTP is required' };
  }
  
  if (!/^\d{6}$/.test(otp.trim())) {
    return { valid: false, error: 'OTP must be 6 digits' };
  }
  
  return { valid: true };
};

/**
 * Student ID validation
 * Format: YYYY-XXXXX (year-5digit number)
 */
export const validateStudentID = (studentID) => {
  if (!studentID || studentID.trim() === '') {
    return { valid: false, error: 'Student ID is required' };
  }
  
  if (!/^\d{4}-\d{5}$/.test(studentID.trim())) {
    return {
      valid: false,
      error: 'Invalid Student ID format (should be YYYY-XXXXX)',
    };
  }
  
  return { valid: true };
};

/**
 * Validate entire login form
 */
export const validateLoginForm = (email, password) => {
  const errors = {};
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }
  
  if (!password || password.trim() === '') {
    errors.password = 'Password is required';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate entire signup form
 */
export const validateSignupForm = (name, email, phone, password, confirmPassword) => {
  const errors = {};
  
  const nameValidation = validateName(name);
  if (!nameValidation.valid) {
    errors.name = nameValidation.error;
  }
  
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }
  
  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.error;
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error;
  }
  
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Get password strength indicator
 * Returns: weak, fair, good, strong
 */
export const getPasswordStrength = (password) => {
  if (!password) return 'weak';
  
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*]/.test(password)) strength++;
  
  if (strength < 2) return 'weak';
  if (strength < 4) return 'fair';
  if (strength < 5) return 'good';
  return 'strong';
};

/**
 * Get password strength color
 */
export const getPasswordStrengthColor = (password) => {
  const strength = getPasswordStrength(password);
  
  const colorMap = {
    weak: '#d32f2f',
    fair: '#f57c00',
    good: '#fbc02d',
    strong: '#388e3c',
  };
  
  return colorMap[strength];
};

/**
 * Sanitize string input (remove special characters)
 */
export const sanitizeInput = (input) => {
  if (!input) return '';
  return input.replace(/[<>\"']/g, '');
};

/**
 * Format phone number for display
 * Example: "9876543210" → "98765 43210"
 */
export const formatPhoneDisplay = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.replace(/(\d{5})(\d{5})/, '$1 $2');
};

export default {
  validateEmail,
  validatePhone,
  validatePassword,
  validateName,
  validateText,
  validateISBN,
  validateOTP,
  validateStudentID,
  validateLoginForm,
  validateSignupForm,
  getPasswordStrength,
  getPasswordStrengthColor,
  sanitizeInput,
  formatPhoneDisplay,
};
