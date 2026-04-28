/**
 * API Service
 * Centralized API calls for all frontend screens
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// API timeout in milliseconds (default 30 seconds)
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10);

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token =
        (await AsyncStorage.getItem('userToken')) ||
        (await AsyncStorage.getItem('authToken'));
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const saveAuthTokens = async (data) => {
  try {
    if (data.token) {
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('authToken', data.token);
    }
    if (data.refreshToken) {
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
    }
  } catch (error) {
    console.error('Error saving auth tokens:', error);
  }
};

const clearAuthTokens = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('refreshToken');
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
  }
};

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Comprehensive error logging
    console.error('[API ERROR]', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      data: error.response?.data,
    });

    // Handle network errors
    if (!error.response) {
      // Network error - no response received
      const errorMsg = error.message === 'Network Error' 
        ? `Network Error - Backend unavailable (${API_BASE_URL}). Please ensure backend server is running.`
        : `Connection Error: ${error.message}`;
      console.error('[NETWORK]', errorMsg);
      return Promise.reject({
        message: errorMsg,
        isNetworkError: true,
        originalError: error,
      });
    }

    // Handle 401 - Token expired or invalid
    if (error.response?.status === 401) {
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          await saveAuthTokens(data);
          // Retry original request with new token
          return apiClient(error.config);
        }
      } catch (refreshError) {
        console.error('[AUTH] Token refresh failed:', refreshError.message);
        await clearAuthTokens();
      }
    }

    // Handle 403 - Forbidden
    if (error.response?.status === 403) {
      console.error('[AUTH] Access forbidden');
      return Promise.reject({
        message: 'Access denied: insufficient permissions',
        status: 403,
      });
    }

    // Handle 404 - Not found
    if (error.response?.status === 404) {
      console.warn('[API] Resource not found:', error.config?.url);
    }

    // Handle 500+ - Server errors
    if (error.response?.status >= 500) {
      console.error('[SERVER] Server error:', error.response?.status);
      return Promise.reject({
        message: `Server error (${error.response?.status}): ${error.response?.data?.message || 'Unknown error'}`,
        status: error.response?.status,
      });
    }

    return Promise.reject(error);
  }
);

// ============================================================
// AUTH ENDPOINTS
// ============================================================

export const authAPI = {
  /**
   * Register new user
   */
  register: async (email, password, phone, firstName, lastName) => {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      phone,
      firstName,
      lastName,
    });
    await saveAuthTokens(response.data);
    return response.data;
  },

  /**
   * Login user
   */
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    await saveAuthTokens(response.data);
    return response.data;
  },

  /**
   * Refresh authentication token
   */
  refreshToken: async (refreshToken) => {
    const token = refreshToken || (await AsyncStorage.getItem('refreshToken'));
    if (!token) {
      throw new Error('Refresh token is required');
    }
    const response = await apiClient.post('/auth/refresh', {
      refreshToken: token,
    });
    await saveAuthTokens(response.data);
    return response.data;
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data) => {
    const response = await apiClient.put('/auth/me', data);
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Logout
   */
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    await clearAuthTokens();
    return response.data;
  },

  /**
   * Forgot password
   */
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password
   */
  resetPassword: async (token, newPassword) => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
};

// ============================================================
// BOOKS ENDPOINTS
// ============================================================

export const booksAPI = {
  /**
   * Get list of books with pagination and filters
   */
  listBooks: async (filters = {}, page = 1, limit = 20) => {
    const response = await apiClient.get('/books', {
      params: {
        page,
        limit,
        ...filters,
      },
    });
    return response.data;
  },

  /**
   * Search books
   */
  searchBooks: async (query, page = 1, limit = 20, sortBy = 'relevance') => {
    const response = await apiClient.get('/books/search', {
      params: {
        q: query,
        page,
        limit,
        sortBy,
      },
    });
    return response.data;
  },

  /**
   * Get book details
   */
  getBookDetail: async (bookId) => {
    const response = await apiClient.get(`/books/${bookId}`);
    return response.data;
  },

  /**
   * Get featured books
   */
  getFeaturedBooks: async (limit = 10) => {
    const response = await apiClient.get('/books/featured', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get books by category
   */
  getByCategory: async (categoryId, page = 1, limit = 20) => {
    const response = await apiClient.get(`/books/category/${categoryId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get available copies for a book
   */
  getAvailableCopies: async (bookId) => {
    const response = await apiClient.get(`/books/${bookId}/copies`);
    return response.data;
  },
};

// ============================================================
// TRANSACTION ENDPOINTS
// ============================================================

export const transactionsAPI = {
  /**
   * Issue a book to user
   */
  issueBook: async (bookId, dueDays = 14) => {
    const response = await apiClient.post('/transactions/issue', {
      bookId,
      dueDays,
    });
    return response.data;
  },

  /**
   * Return a book
   */
  returnBook: async (transactionId, condition = 'good', notes = '') => {
    const response = await apiClient.post('/transactions/return', {
      transactionId,
      condition,
      notes,
    });
    return response.data;
  },

  /**
   * Get active issues (borrowed books)
   */
  getActiveIssues: async () => {
    const response = await apiClient.get('/transactions/active');
    return response.data;
  },

  /**
   * Get transaction history
   */
  getHistory: async (limit = 20, offset = 0) => {
    const response = await apiClient.get('/transactions/history', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Renew a book
   */
  renewBook: async (transactionId, extendDays = 14) => {
    const response = await apiClient.post('/transactions/renew', {
      transactionId,
      extendDays,
    });
    return response.data;
  },

  /**
   * Get user's fines
   */
  getUserFines: async () => {
    const response = await apiClient.get('/transactions/fines');
    return response.data;
  },
};

// ============================================================
// PAYMENTS ENDPOINTS
// ============================================================

export const paymentsAPI = {
  /**
   * Get outstanding fines
   */
  getOutstandingFines: async () => {
    const response = await apiClient.get('/payments/fines/outstanding');
    return response.data;
  },

  /**
   * Pay fines
   */
  payFines: async (amount, fineIds, paymentMethod = 'online') => {
    const response = await apiClient.post('/payments/pay-fines', {
      amount,
      fineIds,
      paymentMethod,
    });
    return response.data;
  },

  /**
   * Get payment history
   */
  getPaymentHistory: async (limit = 10, offset = 0) => {
    const response = await apiClient.get('/payments/history', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Get payment summary
   */
  getPaymentSummary: async () => {
    const response = await apiClient.get('/payments/summary');
    return response.data;
  },
};

// ============================================================
// NOTIFICATIONS ENDPOINTS
// ============================================================

export const notificationsAPI = {
  /**
   * Get user's notifications
   */
  getNotifications: async (limit = 20, offset = 0, unreadOnly = false) => {
    const response = await apiClient.get('/notifications', {
      params: { limit, offset, unreadOnly },
    });
    return response.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    const response = await apiClient.post('/notifications/mark-read', {
      notificationId,
    });
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const response = await apiClient.post('/notifications/mark-all-read');
    return response.data;
  },

  /**
   * Get notification preferences
   */
  getPreferences: async () => {
    const response = await apiClient.get('/notifications/preferences');
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (preferences) => {
    const response = await apiClient.put('/notifications/preferences', preferences);
    return response.data;
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId) => {
    const response = await apiClient.post('/notifications/delete', {
      notificationId,
    });
    return response.data;
  },
};

// ============================================================
// FILE SHARING ENDPOINTS
// ============================================================

export const filesAPI = {
  /**
   * Get shared files (files shared with user)
   */
  getSharedFiles: async () => {
    const response = await apiClient.get('/files/shared');
    return response.data;
  },

  /**
   * Get my uploaded files
   */
  getMyFiles: async (limit = 20, offset = 0) => {
    const response = await apiClient.get('/files/my-files', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Upload file
   */
  uploadFile: async (file, description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);

    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Download file
   */
  downloadFile: async (fileId) => {
    const response = await apiClient.get(`/files/download/${fileId}`);
    return response.data;
  },

  /**
   * Share file with users
   */
  shareFile: async (fileId, recipientIds) => {
    const response = await apiClient.post(`/files/${fileId}/share`, {
      recipientIds,
    });
    return response.data;
  },

  /**
   * Revoke file access
   */
  revokeAccess: async (fileId, shareId) => {
    const response = await apiClient.post('/files/revoke-access', {
      fileId,
      shareId,
    });
    return response.data;
  },

  /**
   * Delete file
   */
  deleteFile: async (fileId) => {
    const response = await apiClient.delete(`/files/${fileId}`);
    return response.data;
  },
};

// ============================================================
// PRINT ENDPOINTS
// ============================================================

export const printAPI = {
  requestPrint: async (fileId, pageCount, isColor = false, copies = 1) => {
    const response = await apiClient.post('/print/request', {
      fileId,
      pageCount,
      colorPages: isColor ? pageCount : 0,
      copies,
    });
    return response.data;
  },

  getPrintJobs: async (status, limit = 20, offset = 0) => {
    const params = { limit, offset };
    if (status !== undefined && status !== null) {
      params.status = status;
    }
    const response = await apiClient.get('/print/my-jobs', {
      params,
    });
    return response.data;
  },

  updatePrintStatus: async (jobId, status, actualPages = null, completedAt = null) => {
    const response = await apiClient.put(`/print/${jobId}/status`, {
      status,
      actualPages,
      completedAt,
    });
    return response.data;
  },
};

// ============================================================
// QR CODE ENDPOINTS
// ============================================================

export const qrAPI = {
  /**
   * Generate QR code for a book
   */
  generateBookQR: async (bookId) => {
    const response = await apiClient.get(`/qr/book/${bookId}`);
    return response.data;
  },

  /**
   * Generate QR code for user library card
   */
  generateUserQR: async () => {
    const response = await apiClient.get('/qr/user');
    return response.data;
  },

  /**
   * Scan QR code
   */
  scanQR: async (qrData) => {
    const response = await apiClient.post('/qr/scan', { qrData });
    return response.data;
  },

  /**
   * Process QR transaction (issue/return)
   */
  processTransaction: async (userQRData, bookQRData, action = 'issue') => {
    const response = await apiClient.post('/qr/transaction', {
      userQRData,
      bookQRData,
      action,
    });
    return response.data;
  },

  /**
   * Get QR history
   */
  getQRHistory: async (limit = 20, offset = 0) => {
    const response = await apiClient.get('/qr/history', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Validate QR token
   */
  validateToken: async (token) => {
    const response = await apiClient.post('/qr/validate', { token });
    return response.data;
  },
};

// ============================================================
// RFID ENDPOINTS
// ============================================================

export const rfidAPI = {
  /**
   * Register RFID card
   */
  registerCard: async (rfidTag, cardName = 'My Library Card') => {
    const response = await apiClient.post('/rfid/register', {
      rfidTag,
      cardName,
    });
    return response.data;
  },

  /**
   * Get user's RFID cards
   */
  getCards: async () => {
    const response = await apiClient.get('/rfid/cards');
    return response.data;
  },

  /**
   * Deactivate RFID card
   */
  deactivateCard: async (cardId) => {
    const response = await apiClient.post('/rfid/deactivate', { cardId });
    return response.data;
  },

  /**
   * Scan RFID card
   */
  scanCard: async (rfidTag) => {
    const response = await apiClient.post('/rfid/scan', { rfidTag });
    return response.data;
  },

  /**
   * Process RFID transaction (issue/return)
   */
  processTransaction: async (rfidTag, bookBarcode, action = 'issue') => {
    const response = await apiClient.post('/rfid/transaction', {
      rfidTag,
      bookBarcode,
      action,
    });
    return response.data;
  },

  /**
   * Get RFID transaction logs
   */
  getLogs: async (limit = 20, offset = 0) => {
    const response = await apiClient.get('/rfid/logs', {
      params: { limit, offset },
    });
    return response.data;
  },
};

// ============================================================
// CATEGORIES ENDPOINTS
// ============================================================

export const categoriesAPI = {
  /**
   * Get all categories
   */
  getAll: async () => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  /**
   * Get category details
   */
  getDetail: async (categoryId) => {
    const response = await apiClient.get(`/categories/${categoryId}`);
    return response.data;
  },
};

// ============================================================
// SEARCH ENDPOINTS
// ============================================================

export const searchAPI = {
  /**
   * Global search
   */
  search: async (query, type = 'all') => {
    const response = await apiClient.get('/search', {
      params: { q: query, type },
    });
    return response.data;
  },
};

// ============================================================
// SUPPORT ENDPOINTS
// ============================================================

export const supportAPI = {
  /**
   * Create support ticket
   */
  createTicket: async (subject, message, attachments = []) => {
    const response = await apiClient.post('/support/ticket', {
      subject,
      message,
      attachments,
    });
    return response.data;
  },

  /**
   * Get user's support tickets
   */
  getMyTickets: async (status = null, limit = 20, offset = 0) => {
    const params = { limit, offset };
    if (status) params.status = status;
    const response = await apiClient.get('/support/tickets', { params });
    return response.data;
  },

  /**
   * Get ticket details
   */
  getTicket: async (ticketId) => {
    const response = await apiClient.get(`/support/ticket/${ticketId}`);
    return response.data;
  },

  /**
   * Add reply to ticket
   */
  addReply: async (ticketId, message, attachments = []) => {
    const response = await apiClient.post(`/support/ticket/${ticketId}/reply`, {
      message,
      attachments,
    });
    return response.data;
  },

  /**
   * Get ticket replies
   */
  getReplies: async (ticketId) => {
    const response = await apiClient.get(`/support/ticket/${ticketId}/replies`);
    return response.data;
  },

  /**
   * Close ticket
   */
  closeTicket: async (ticketId, resolutionNotes = null) => {
    const response = await apiClient.post(`/support/ticket/${ticketId}/close`, {
      resolution_notes: resolutionNotes,
    });
    return response.data;
  },
};

// ============================================================
// FCM / FIREBASE NOTIFICATION ENDPOINTS
// ============================================================

export const fcmAPI = {
  /**
   * Register FCM token
   */
  registerToken: async (fcmToken, deviceInfo = null, platform = 'android') => {
    const response = await apiClient.post('/fcm/register-token', {
      fcmToken,
      deviceInfo,
      platform,
    });
    return response.data;
  },

  /**
   * Deregister FCM token
   */
  deregisterToken: async (fcmToken) => {
    const response = await apiClient.post('/fcm/deregister-token', { fcmToken });
    return response.data;
  },

  /**
   * Get my FCM tokens
   */
  getMyTokens: async () => {
    const response = await apiClient.get('/fcm/my-tokens');
    return response.data;
  },

  /**
   * Subscribe to topic
   */
  subscribeTopic: async (topic) => {
    const response = await apiClient.post('/fcm/subscribe-topic', { topic });
    return response.data;
  },

  /**
   * Unsubscribe from topic
   */
  unsubscribeTopic: async (topic) => {
    const response = await apiClient.post('/fcm/unsubscribe-topic', { topic });
    return response.data;
  },

  /**
   * Get notification preferences
   */
  getPreferences: async () => {
    const response = await apiClient.get('/fcm/preferences');
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (preferences) => {
    const response = await apiClient.put('/fcm/preferences', preferences);
    return response.data;
  },

  /**
   * Get notification history
   */
  getHistory: async (limit = 20, offset = 0) => {
    const response = await apiClient.get('/fcm/history', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * Send test notification
   */
  sendTest: async () => {
    const response = await apiClient.post('/fcm/send-test');
    return response.data;
  },
};

// ============================================================
// ADMIN ENDPOINTS
// ============================================================

export const adminAPI = {
  /**
   * Get dashboard stats
   */
  getDashboardStats: async () => {
    const response = await apiClient.get('/admin/dashboard/stats');
    return response.data;
  },

  /**
   * Get dashboard live feed
   */
  getLiveFeed: async (limit = 20) => {
    const response = await apiClient.get('/admin/dashboard/live-feed', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get dashboard analytics
   */
  getAnalytics: async (days = 30) => {
    const response = await apiClient.get('/admin/dashboard/analytics', {
      params: { days },
    });
    return response.data;
  },

  // Books management
  books: {
    list: async (page = 1, limit = 20, filters = {}) => {
      const response = await apiClient.get('/admin/books', {
        params: { page, limit, ...filters },
      });
      return response.data;
    },
    create: async (bookData) => {
      const response = await apiClient.post('/admin/books', bookData);
      return response.data;
    },
    update: async (bookId, bookData) => {
      const response = await apiClient.put(`/admin/books/${bookId}`, bookData);
      return response.data;
    },
    delete: async (bookId) => {
      const response = await apiClient.delete(`/admin/books/${bookId}`);
      return response.data;
    },
  },

  // Users management
  users: {
    list: async (page = 1, limit = 20, role = null) => {
      const params = { page, limit };
      if (role) params.role = role;
      const response = await apiClient.get('/admin/users', { params });
      return response.data;
    },
    create: async (userData) => {
      const response = await apiClient.post('/admin/users', userData);
      return response.data;
    },
    update: async (userId, userData) => {
      const response = await apiClient.put(`/admin/users/${userId}`, userData);
      return response.data;
    },
    delete: async (userId) => {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      return response.data;
    },
  },

  // Transactions management
  transactions: {
    list: async (page = 1, limit = 20) => {
      const response = await apiClient.get('/admin/transactions', {
        params: { page, limit },
      });
      return response.data;
    },
    issue: async (userId, bookId, dueDays = 14) => {
      const response = await apiClient.post('/admin/transactions/issue', {
        userId,
        bookId,
        dueDays,
      });
      return response.data;
    },
    return: async (transactionId) => {
      const response = await apiClient.post('/admin/transactions/return', {
        transactionId,
      });
      return response.data;
    },
  },

  // Payments management
  payments: {
    list: async (page = 1, limit = 20) => {
      const response = await apiClient.get('/admin/payments', {
        params: { page, limit },
      });
      return response.data;
    },
    process: async (paymentId) => {
      const response = await apiClient.put(`/admin/payments/${paymentId}/process`);
      return response.data;
    },
  },

  // Settings
  settings: {
    get: async () => {
      const response = await apiClient.get('/admin/settings');
      return response.data;
    },
    update: async (settings) => {
      const response = await apiClient.put('/admin/settings', settings);
      return response.data;
    },
  },
};

// Convenience wrappers for existing hooks
export const login = authAPI.login;
export const register = authAPI.register;
export const logout = authAPI.logout;
export const refreshToken = authAPI.refreshToken;
export const getProfile = authAPI.getProfile;
export const updateProfile = authAPI.updateProfile;
export const changePassword = authAPI.changePassword;

export const generateQR = qrAPI.generateUserQR;

export const getBooks = booksAPI.listBooks;
export const issueBook = transactionsAPI.issueBook;
export const returnBook = transactionsAPI.returnBook;
export const reserveBook = transactionsAPI.reserveBook;

export const uploadFile = filesAPI.uploadFile;
export const getSharedFiles = filesAPI.getSharedFiles;
export const deleteFile = filesAPI.deleteFile;

export const requestPrint = printAPI.requestPrint;
export const getPrintJobs = printAPI.getPrintJobs;
export const updatePrintStatus = printAPI.updatePrintStatus;

// ============================================================
// EXPORT AXIOS CLIENT
// ============================================================

export { apiClient };

// ============================================================
// EXPORT ALL APIS
// ============================================================

export default {
  auth: authAPI,
  books: booksAPI,
  transactions: transactionsAPI,
  payments: paymentsAPI,
  notifications: notificationsAPI,
  files: filesAPI,
  print: printAPI,
  qr: qrAPI,
  rfid: rfidAPI,
  categories: categoriesAPI,
  search: searchAPI,
  support: supportAPI,
  fcm: fcmAPI,
  admin: adminAPI,
};
