/**
 * Date and Time Utilities
 * Format dates, calculate durations, handle timezones
 */

/**
 * Format date to readable string
 * Example: "Jan 15, 2024"
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Format date with time
 * Example: "Jan 15, 2024 2:30 PM"
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Format time only
 * Example: "2:30 PM"
 */
export const formatTime = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  const options = { hour: '2-digit', minute: '2-digit' };
  return dateObj.toLocaleTimeString('en-US', options);
};

/**
 * Calculate days until a date
 * Returns negative if date is in the past
 */
export const daysUntil = (date) => {
  if (!date) return null;
  
  const dateObj = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  
  const diffTime = dateObj - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if date is overdue
 */
export const isOverdue = (dueDate) => {
  return daysUntil(dueDate) < 0;
};

/**
 * Format relative time
 * Example: "2 hours ago", "in 3 days"
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  const now = new Date();
  const diffSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffSeconds < 60) return 'Just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
  
  return formatDate(date);
};

/**
 * Get due status with color coding
 */
export const getDueStatus = (dueDate) => {
  const days = daysUntil(dueDate);
  
  if (days < 0) {
    return {
      status: 'Overdue',
      color: '#d32f2f',
      daysText: `${Math.abs(days)} days overdue`,
    };
  }
  
  if (days === 0) {
    return {
      status: 'Due Today',
      color: '#f57c00',
      daysText: 'Due today',
    };
  }
  
  if (days <= 3) {
    return {
      status: 'Due Soon',
      color: '#fbc02d',
      daysText: `${days} days left`,
    };
  }
  
  return {
    status: 'Good',
    color: '#388e3c',
    daysText: `${days} days left`,
  };
};

/**
 * Format time remaining for auto-delete
 * Example: "29 min 45 sec remaining"
 */
export const formatTimeRemaining = (expiresAt) => {
  if (!expiresAt) return 'N/A';
  
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const remainingMs = expiryTime - now;
  
  if (remainingMs <= 0) return 'Expired';
  
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}m ${seconds}s`;
};

/**
 * Check if auto-delete is imminent (< 5 minutes)
 */
export const isAutoDeleteImminent = (expiresAt) => {
  if (!expiresAt) return false;
  
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const remainingMs = expiryTime - now;
  const remainingMinutes = remainingMs / (1000 * 60);
  
  return remainingMinutes < 5;
};

/**
 * Get hour of day for greeting
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Create a readable duration string
 * Example: "2 hours 30 minutes"
 */
export const formatDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 'N/A';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  if (minutes === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

export default {
  formatDate,
  formatDateTime,
  formatTime,
  daysUntil,
  isOverdue,
  formatRelativeTime,
  getDueStatus,
  formatTimeRemaining,
  isAutoDeleteImminent,
  getGreeting,
  formatDuration,
};
