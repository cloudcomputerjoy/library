/**
 * Helper Utilities
 * Common utility functions for the application
 */

/**
 * Generate UUID v4
 */
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Generate Random String
 */
export const generateRandomString = (length = 32) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate Random Number
 */
export const generateRandomNumber = (min = 0, max = 100) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate OTP (One-Time Password)
 */
export const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

/**
 * Hash Password (simplified - use bcrypt in production)
 */
export const hashPassword = async (password) => {
  try {
    // This is a placeholder. Use bcrypt or similar in production
    // Example: const bcrypt = require('bcrypt');
    // return await bcrypt.hash(password, 10);
    return password; // For testing only
  } catch (error) {
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare Passwords (simplified - use bcrypt in production)
 */
export const comparePasswords = async (password, hash) => {
  try {
    // This is a placeholder. Use bcrypt or similar in production
    // Example: const bcrypt = require('bcrypt');
    // return await bcrypt.compare(password, hash);
    return password === hash; // For testing only
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Format Currency
 */
export const formatCurrency = (amount, currency = 'BDT') => {
  const formatter = new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
};

/**
 * Format Date
 */
export const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * Get Date Difference in Days
 */
export const getDateDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Convert Bytes to Human Readable Format
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Delay Promise (async wait)
 */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry with Exponential Backoff
 */
export const retryWithBackoff = async (
  fn,
  maxRetries = 3,
  backoffFactor = 2
) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const backoffTime = Math.pow(backoffFactor, i) * 1000;
        await delay(backoffTime);
      }
    }
  }

  throw lastError;
};

/**
 * Chunk Array
 */
export const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Flatten Array
 */
export const flattenArray = (array) => {
  return array.flat(Infinity);
};

/**
 * Remove Duplicates from Array
 */
export const removeDuplicates = (array, key = null) => {
  if (key) {
    return Array.from(
      new Map(array.map((item) => [item[key], item])).values()
    );
  }
  return [...new Set(array)];
};

/**
 * Sort Array of Objects
 */
export const sortByKey = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    let comparison = 0;

    if (a[key] < b[key]) {
      comparison = -1;
    } else if (a[key] > b[key]) {
      comparison = 1;
    }

    return direction === 'desc' ? comparison * -1 : comparison;
  });
};

/**
 * Group Array by Key
 */
export const groupByKey = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Merge Objects (Deep)
 */
export const mergeObjects = (...objects) => {
  return objects.reduce((result, obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (
          typeof obj[key] === 'object' &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          result[key] = mergeObjects(result[key] || {}, obj[key]);
        } else {
          result[key] = obj[key];
        }
      }
    }
    return result;
  }, {});
};

/**
 * Deep Clone Object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item));
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

/**
 * Check if Object is Empty
 */
export const isEmpty = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return true;
  }
  return Object.keys(obj).length === 0;
};

/**
 * Pick Specific Keys from Object
 */
export const pickKeys = (obj, keys) => {
  const result = {};
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Omit Specific Keys from Object
 */
export const omitKeys = (obj, keys) => {
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !keys.includes(key)) {
      result[key] = obj[key];
    }
  }
  return result;
};

/**
 * Truncate String
 */
export const truncateString = (str, length = 100, suffix = '...') => {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};

/**
 * Capitalize String
 */
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert to Title Case
 */
export const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
};

/**
 * Convert to Slug
 */
export const toSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Debounce Function
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle Function
 */
export const throttle = (fn, limit = 300) => {
  let inThrottle;

  return function (...args) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export default {
  // UUID and Random
  generateUUID,
  generateRandomString,
  generateRandomNumber,
  generateOTP,

  // Password
  hashPassword,
  comparePasswords,

  // Formatting
  formatCurrency,
  formatDate,
  formatBytes,

  // Date
  getDateDifference,

  // Async
  delay,
  retryWithBackoff,

  // Array
  chunkArray,
  flattenArray,
  removeDuplicates,
  sortByKey,
  groupByKey,

  // Object
  mergeObjects,
  deepClone,
  isEmpty,
  pickKeys,
  omitKeys,

  // String
  truncateString,
  capitalize,
  toTitleCase,
  toSlug,

  // Function
  debounce,
  throttle,
};
