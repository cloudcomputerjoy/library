/**
 * Logger Utility
 * Centralized logging with levels and formatting
 */

import { getConfigValue } from '../config/env';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
};

/**
 * Get current log level from config
 */
const getCurrentLogLevel = () => {
  const levelName = getConfigValue('logLevel', 'debug').toUpperCase();
  return LOG_LEVELS[levelName] || LOG_LEVELS.DEBUG;
};

/**
 * Format log message with timestamp
 */
const formatLogMessage = (level, tag, message, data) => {
  const timestamp = new Date().toISOString();
  const levelName = LOG_LEVEL_NAMES[level];
  const formattedTag = tag ? `[${tag}]` : '';
  
  let output = `${timestamp} ${levelName} ${formattedTag} ${message}`;
  
  if (data) {
    output += '\n' + JSON.stringify(data, null, 2);
  }
  
  return output;
};

/**
 * Debug level logging
 */
export const debug = (message, data = null, tag = 'DEBUG') => {
  if (getCurrentLogLevel() <= LOG_LEVELS.DEBUG) {
    const formattedMessage = formatLogMessage(LOG_LEVELS.DEBUG, tag, message, data);
    console.log(formattedMessage);
  }
};

/**
 * Info level logging
 */
export const info = (message, data = null, tag = 'INFO') => {
  if (getCurrentLogLevel() <= LOG_LEVELS.INFO) {
    const formattedMessage = formatLogMessage(LOG_LEVELS.INFO, tag, message, data);
    console.log(formattedMessage);
  }
};

/**
 * Warning level logging
 */
export const warn = (message, data = null, tag = 'WARN') => {
  if (getCurrentLogLevel() <= LOG_LEVELS.WARN) {
    const formattedMessage = formatLogMessage(LOG_LEVELS.WARN, tag, message, data);
    console.warn(formattedMessage);
  }
};

/**
 * Error level logging
 */
export const error = (message, errorObj = null, tag = 'ERROR') => {
  if (getCurrentLogLevel() <= LOG_LEVELS.ERROR) {
    const errorData = errorObj instanceof Error 
      ? { message: errorObj.message, stack: errorObj.stack }
      : errorObj;
    
    const formattedMessage = formatLogMessage(LOG_LEVELS.ERROR, tag, message, errorData);
    console.error(formattedMessage);
  }
};

/**
 * Log API request
 */
export const logRequest = (method, url, data = null) => {
  if (getConfigValue('enableNetworkLogging', false)) {
    debug(`${method} ${url}`, data, 'API_REQUEST');
  }
};

/**
 * Log API response
 */
export const logResponse = (method, url, status, data = null) => {
  if (getConfigValue('enableNetworkLogging', false)) {
    const statusColor = status >= 200 && status < 300 ? '✓' : '✗';
    debug(`${statusColor} ${method} ${url} (${status})`, data, 'API_RESPONSE');
  }
};

/**
 * Log API error
 */
export const logRequestError = (method, url, errorObj) => {
  if (getConfigValue('enableNetworkLogging', false)) {
    const errorData = {
      message: errorObj?.message,
      status: errorObj?.response?.status,
      data: errorObj?.response?.data,
    };
    error(`${method} ${url} failed`, errorData, 'API_ERROR');
  }
};

/**
 * Log storage operations
 */
export const logStorage = (operation, key, value = null) => {
  if (getConfigValue('enableStorageLogging', false)) {
    debug(`Storage.${operation}('${key}')`, value, 'STORAGE');
  }
};

/**
 * Log navigation events
 */
export const logNavigation = (action, route) => {
  debug(`Navigation ${action} → ${route}`, null, 'NAVIGATION');
};

/**
 * Log socket events
 */
export const logSocket = (event, data = null) => {
  debug(`Socket.io event: ${event}`, data, 'SOCKET');
};

/**
 * Log state changes
 */
export const logStateChange = (storeName, action, oldValue, newValue) => {
  debug(`${storeName}.${action}()`, { old: oldValue, new: newValue }, 'STATE');
};

/**
 * Group logs (collapsible groups in DevTools)
 */
export const groupStart = (groupName) => {
  if (getCurrentLogLevel() <= LOG_LEVELS.DEBUG) {
    console.group(groupName);
  }
};

export const groupEnd = () => {
  if (getCurrentLogLevel() <= LOG_LEVELS.DEBUG) {
    console.groupEnd();
  }
};

/**
 * Log performance timing
 */
export const logPerformance = (label, duration) => {
  if (getCurrentLogLevel() <= LOG_LEVELS.DEBUG) {
    debug(`${label}: ${duration}ms`, null, 'PERFORMANCE');
  }
};

/**
 * Create performance timer
 */
export const startTimer = (label) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    logPerformance(label, duration);
  };
};

export default {
  debug,
  info,
  warn,
  error,
  logRequest,
  logResponse,
  logRequestError,
  logStorage,
  logNavigation,
  logSocket,
  logStateChange,
  groupStart,
  groupEnd,
  logPerformance,
  startTimer,
};
