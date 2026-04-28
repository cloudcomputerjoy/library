/**
 * User Profile API Service
 * User data, settings, and profile management
 */

import { apiClient } from './api';

// ============================================================
// PROFILE & USER DATA
// ============================================================

/**
 * Get current user profile
 * @returns {Promise<{user, stats, preferences}>}
 */
export const getUserProfile = async () => {
  try {
    const response = await apiClient.get('/users/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} profileData - Profile fields to update
 * @returns {Promise<{user}>}
 */
export const updateUserProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Update user avatar
 * @param {string} imageUri - Image URI from device
 * @returns {Promise<{imageUrl}>}
 */
export const uploadProfilePicture = async (imageUri) => {
  try {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    });

    const response = await apiClient.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

/**
 * Get user statistics
 * @returns {Promise<{totalBorrowed, currentBorrowed, overdueCount, totalFine, trustScore}>}
 */
export const getUserStats = async () => {
  try {
    const response = await apiClient.get('/users/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

// ============================================================
// ACCOUNT SETTINGS
// ============================================================

/**
 * Get user preferences/settings
 * @returns {Promise<{preferences}>}
 */
export const getUserPreferences = async () => {
  try {
    const response = await apiClient.get('/users/preferences');
    return response.data;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    throw error;
  }
};

/**
 * Update user preferences
 * @param {Object} preferences - Preferences to update
 * @returns {Promise<{preferences}>}
 */
export const updateUserPreferences = async (preferences) => {
  try {
    const response = await apiClient.put('/users/preferences', preferences);
    return response.data;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};

/**
 * Get notification settings
 * @returns {Promise<{notifications}>}
 */
export const getNotificationSettings = async () => {
  try {
    const response = await apiClient.get('/users/notifications-settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    throw error;
  }
};

/**
 * Update notification settings
 * @param {Object} settings - Notification settings
 * @returns {Promise<{settings}>}
 */
export const updateNotificationSettings = async (settings) => {
  try {
    const response = await apiClient.put('/users/notifications-settings', settings);
    return response.data;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
};

// ============================================================
// CONTACT & SUPPORT
// ============================================================

/**
 * Get saved contacts/contacts
 * @returns {Promise<Contact[]>}
 */
export const getContacts = async () => {
  try {
    const response = await apiClient.get('/users/contacts');
    return response.data.contacts || [];
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};

/**
 * Add emergency contact
 * @param {Object} contactData - Contact information
 * @returns {Promise<{contact}>}
 */
export const addEmergencyContact = async (contactData) => {
  try {
    const response = await apiClient.post('/users/emergency-contact', contactData);
    return response.data;
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    throw error;
  }
};

/**
 * Submit support ticket
 * @param {Object} ticketData - Ticket information
 * @returns {Promise<{ticket, ticketId}>}
 */
export const submitSupportTicket = async (ticketData) => {
  try {
    const response = await apiClient.post('/support/tickets', ticketData);
    return response.data;
  } catch (error) {
    console.error('Error submitting support ticket:', error);
    throw error;
  }
};

/**
 * Get support tickets
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<{tickets, totalCount}>}
 */
export const getSupportTickets = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/support/tickets', {
      params: { page, limit },
    });
    return {
      tickets: response.data.tickets || [],
      totalCount: response.data.totalCount || 0,
    };
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    throw error;
  }
};

// ============================================================
// ACHIEVEMENTS & GAMIFICATION
// ============================================================

/**
 * Get user achievements/badges
 * @returns {Promise<Badge[]>}
 */
export const getAchievements = async () => {
  try {
    const response = await apiClient.get('/users/achievements');
    return response.data.achievements || [];
  } catch (error) {
    console.error('Error fetching achievements:', error);
    throw error;
  }
};

/**
 * Get trust/reliability score
 * @returns {Promise<{score, level, details}>}
 */
export const getTrustScore = async () => {
  try {
    const response = await apiClient.get('/users/trust-score');
    return response.data;
  } catch (error) {
    console.error('Error fetching trust score:', error);
    throw error;
  }
};

// ============================================================
// DEVICE & SESSION MANAGEMENT
// ============================================================

/**
 * Register device for push notifications
 * @param {string} deviceToken - FCM or APNs token
 * @param {string} platform - Platform: 'android' or 'ios'
 * @returns {Promise<{registration}>}
 */
export const registerDeviceForNotifications = async (deviceToken, platform) => {
  try {
    const response = await apiClient.post('/users/devices', {
      deviceToken,
      platform,
    });
    return response.data;
  } catch (error) {
    console.error('Error registering device:', error);
    throw error;
  }
};

/**
 * Get active sessions
 * @returns {Promise<Session[]>}
 */
export const getActiveSessions = async () => {
  try {
    const response = await apiClient.get('/users/sessions');
    return response.data.sessions || [];
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
};

/**
 * Logout from specific session
 * @param {string} sessionId - Session ID
 * @returns {Promise<{success}>}
 */
export const logoutSession = async (sessionId) => {
  try {
    await apiClient.post(`/users/sessions/${sessionId}/logout`);
    return { success: true };
  } catch (error) {
    console.error('Error logging out session:', error);
    throw error;
  }
};

/**
 * Logout from all sessions
 * @returns {Promise<{success}>}
 */
export const logoutAllSessions = async () => {
  try {
    await apiClient.post('/users/sessions/logout-all');
    return { success: true };
  } catch (error) {
    console.error('Error logging out all sessions:', error);
    throw error;
  }
};

// ============================================================
// ACCOUNT DELETION & PRIVACY
// ============================================================

/**
 * Request account deletion
 * @param {string} reason - Reason for deletion (optional)
 * @returns {Promise<{status, deletionDate}>}
 */
export const requestAccountDeletion = async (reason = '') => {
  try {
    const response = await apiClient.post('/users/delete-request', { reason });
    return response.data;
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    throw error;
  }
};

/**
 * Download user data (GDPR)
 * @returns {Promise<Blob>}
 */
export const downloadUserData = async () => {
  try {
    const response = await apiClient.get('/users/data-export', {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading user data:', error);
    throw error;
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  getUserStats,
  getUserPreferences,
  updateUserPreferences,
  getNotificationSettings,
  updateNotificationSettings,
  getContacts,
  addEmergencyContact,
  submitSupportTicket,
  getSupportTickets,
  getAchievements,
  getTrustScore,
  registerDeviceForNotifications,
  getActiveSessions,
  logoutSession,
  logoutAllSessions,
  requestAccountDeletion,
  downloadUserData,
};
