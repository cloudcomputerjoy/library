/**
 * Password & Security Utilities
 * Handles password hashing, comparison, and security checks
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Hash password with bcrypt (10 salt rounds)
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare plain password with hashed password
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    return false;
  }
};

/**
 * Generate secure random token (for password reset, etc.)
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain a special character (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Generate API Key
 * 32-character random hex string
 */
const generateApiKey = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Hash API Key for storage
 */
const hashApiKey = (apiKey) => {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
};

module.exports = {
  hashPassword,
  comparePassword,
  generateSecureToken,
  validatePasswordStrength,
  generateApiKey,
  hashApiKey,
};
