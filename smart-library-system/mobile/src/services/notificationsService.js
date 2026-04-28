/**
 * Notifications API Service
 * Fetch, manage, and interact with notifications
 */

import { apiClient } from './api';

// ============================================================
// FETCH NOTIFICATIONS
// ============================================================

/**
 * Get notifications with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {boolean} unreadOnly - Filter unread only
 * @returns {Promise<{notifications, totalCount, unreadCount}>}
 */
export const getNotifications = async (page = 1, limit = 15, unreadOnly = false) => {
  try {
    const response = await apiClient.get('/notifications', {
      params: {
        page,
        limit,
        unreadOnly,
      },
    });

    return {
      notifications: response.data.notifications || [],
      totalCount: response.data.totalCount || 0,
      unreadCount: response.data.unreadCount || 0,
      hasMore: page < Math.ceil((response.data.totalCount || 0) / limit),
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get urgent notifications (high priority)
 * @returns {Promise<Notification[]>}
 */
export const getUrgentNotifications = async () => {
  try {
    const response = await apiClient.get('/notifications/urgent');
    return response.data.notifications || [];
  } catch (error) {
    console.error('Error fetching urgent notifications:', error);
    throw error;
  }
};

/**
 * Get notification by ID
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Notification>}
 */
export const getNotificationDetail = async (notificationId) => {
  try {
    const response = await apiClient.get(`/notifications/${notificationId}`);
    return response.data.notification;
  } catch (error) {
    console.error('Error fetching notification detail:', error);
    throw error;
  }
};

// ============================================================
// MARK AS READ/UNREAD
// ============================================================

/**
 * Mark single notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success}>}
 */
export const markAsRead = async (notificationId) => {
  try {
    await apiClient.put(`/notifications/${notificationId}/read`);
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<{success}>}
 */
export const markAllAsRead = async () => {
  try {
    await apiClient.put('/notifications/read-all');
    return { success: true };
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};

/**
 * Mark single notification as unread
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success}>}
 */
export const markAsUnread = async (notificationId) => {
  try {
    await apiClient.put(`/notifications/${notificationId}/unread`);
    return { success: true };
  } catch (error) {
    console.error('Error marking as unread:', error);
    throw error;
  }
};

// ============================================================
// DELETE NOTIFICATIONS
// ============================================================

/**
 * Delete single notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success}>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    await apiClient.delete(`/notifications/${notificationId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Delete all notifications
 * @returns {Promise<{success}>}
 */
export const deleteAllNotifications = async () => {
  try {
    await apiClient.delete('/notifications/delete-all');
    return { success: true };
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

/**
 * Clear old notifications (older than N days)
 * @param {number} days - Number of days to keep
 * @returns {Promise<{deletedCount}>}
 */
export const clearOldNotifications = async (days = 30) => {
  try {
    const response = await apiClient.delete('/notifications/clear-old', {
      params: { days },
    });
    return response.data;
  } catch (error) {
    console.error('Error clearing old notifications:', error);
    throw error;
  }
};

// ============================================================
// NOTIFICATION TYPES & FILTERS
// ============================================================

/**
 * Get notifications by type
 * @param {string} type - Notification type (overdue, fine, return, new-book, system, etc.)
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<{notifications, totalCount}>}
 */
export const getNotificationsByType = async (type, page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/notifications', {
      params: {
        type,
        page,
        limit,
      },
    });

    return {
      notifications: response.data.notifications || [],
      totalCount: response.data.totalCount || 0,
    };
  } catch (error) {
    console.error('Error fetching notifications by type:', error);
    throw error;
  }
};

/**
 * Get notification statistics
 * @returns {Promise<{unreadCount, totalCount, byType}>}
 */
export const getNotificationStats = async () => {
  try {
    const response = await apiClient.get('/notifications/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }
};

// ============================================================
// NOTIFICATION ACTIONS
// ============================================================

/**
 * Take action on notification (open, resolve, etc.)
 * @param {string} notificationId - Notification ID
 * @param {string} action - Action to take (view_details, pay_fine, renew_book, etc.)
 * @returns {Promise<{result}>}
 */
export const performNotificationAction = async (notificationId, action) => {
  try {
    const response = await apiClient.post(`/notifications/${notificationId}/action`, {
      action,
    });
    return response.data;
  } catch (error) {
    console.error('Error performing notification action:', error);
    throw error;
  }
};

/**
 * Archive notification (hide but don't delete)
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success}>}
 */
export const archiveNotification = async (notificationId) => {
  try {
    await apiClient.put(`/notifications/${notificationId}/archive`);
    return { success: true };
  } catch (error) {
    console.error('Error archiving notification:', error);
    throw error;
  }
};

/**
 * Snooze notification for future
 * @param {string} notificationId - Notification ID
 * @param {number} hours - Hours to snooze (1, 4, 24, etc.)
 * @returns {Promise<{success, snoozeUntil}>}
 */
export const snoozeNotification = async (notificationId, hours = 4) => {
  try {
    const response = await apiClient.put(`/notifications/${notificationId}/snooze`, {
      hours,
    });
    return response.data;
  } catch (error) {
    console.error('Error snoozing notification:', error);
    throw error;
  }
};

// ============================================================
// REAL-TIME NOTIFICATIONS (WebSocket)
// ============================================================

/**
 * Subscribe to real-time notifications (returns observable)
 * Use with your WebSocket implementation
 * @returns {Observable<Notification>}
 */
export const subscribeToNotifications = async () => {
  // This would typically use a WebSocket library like Socket.io
  // Example:
  // import io from 'socket.io-client';
  // const socket = io(API_BASE_URL);
  // socket.on('notification', (data) => { /* handle */ });
  // return socket;
};

/**
 * Send test notification (admin/dev only)
 * @param {Object} notificationData - Notification to send
 * @returns {Promise<{notification}>}
 */
export const sendTestNotification = async (notificationData) => {
  try {
    const response = await apiClient.post('/notifications/test', notificationData);
    return response.data;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};

export default {
  getNotifications,
  getUrgentNotifications,
  getNotificationDetail,
  markAsRead,
  markAllAsRead,
  markAsUnread,
  deleteNotification,
  deleteAllNotifications,
  clearOldNotifications,
  getNotificationsByType,
  getNotificationStats,
  performNotificationAction,
  archiveNotification,
  snoozeNotification,
  subscribeToNotifications,
  sendTestNotification,
};
