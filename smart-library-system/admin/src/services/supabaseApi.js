// Frontend API Service Layer - Complete Integration
// All endpoints integrated with Supabase backend

import axios from 'axios';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// DASHBOARD APIs
// ============================================

export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getLiveFeed: (limit = 20) => apiClient.get('/dashboard/live-feed', { params: { limit } }),
  getAnalytics: (startDate, endDate) =>
    apiClient.get('/dashboard/analytics', { params: { startDate, endDate } }),
};

// ============================================
// USER MANAGEMENT APIs
// ============================================

export const usersAPI = {
  // List users
  getUsers: (page = 1, limit = 20, filters = {}) =>
    apiClient.get('/users', { params: { page, limit, ...filters } }),

  // Get single user
  getUser: (userId) => apiClient.get(`/users/${userId}`),

  // Create user
  createUser: (userData) => apiClient.post('/users', userData),

  // Update user
  updateUser: (userId, userData) => apiClient.put(`/users/${userId}`, userData),

  // Delete user
  deleteUser: (userId) => apiClient.delete(`/users/${userId}`),

  // Bulk import users
  bulkImportUsers: (users) => apiClient.post('/users/bulk-import', { users }),

  // Get user with transaction history
  getUserHistory: (userId) => apiClient.get(`/users/${userId}/history`),
};

// ============================================
// BOOK MANAGEMENT APIs
// ============================================

export const booksAPI = {
  // List books
  getBooks: (page = 1, limit = 20, filters = {}) =>
    apiClient.get('/books', { params: { page, limit, ...filters } }),

  // Get single book with copies
  getBook: (bookId) => apiClient.get(`/books/${bookId}`),

  // Create book
  createBook: (bookData) => apiClient.post('/books', bookData),

  // Update book
  updateBook: (bookId, bookData) => apiClient.put(`/books/${bookId}`, bookData),

  // Delete book
  deleteBook: (bookId) => apiClient.delete(`/books/${bookId}`),

  // Search books
  searchBooks: (query, limit = 50) =>
    apiClient.get('/books/search', { params: { q: query, limit } }),

  // BOOK COPIES
  getBookCopies: (bookId, status = null) =>
    apiClient.get(`/books/${bookId}/copies`, { params: { status } }),

  addBookCopies: (bookId, count, shelfLocation = 'A-1-1-1') =>
    apiClient.post(`/books/${bookId}/copies`, { count, shelf_location: shelfLocation }),

  updateBookCopy: (bookId, copyId, updates) =>
    apiClient.put(`/books/${bookId}/copies/${copyId}`, updates),

  deleteBookCopy: (bookId, copyId) =>
    apiClient.delete(`/books/${bookId}/copies/${copyId}`),
};

// ============================================
// TRANSACTION APIs
// ============================================

export const transactionsAPI = {
  // List transactions
  getTransactions: (page = 1, limit = 20, filters = {}) =>
    apiClient.get('/transactions', { params: { page, limit, ...filters } }),

  // Get single transaction
  getTransaction: (transactionId) => apiClient.get(`/transactions/${transactionId}`),

  // Issue book
  issueBook: (userId, bookId, copyId, dueDate = null, remarks = null) =>
    apiClient.post('/transactions/issue', {
      user_id: userId,
      book_id: bookId,
      copy_id: copyId,
      due_date: dueDate,
      remarks,
    }),

  // Return book
  returnBook: (transactionId, condition = 'good', remarks = null) =>
    apiClient.post('/transactions/return', {
      transaction_id: transactionId,
      condition_on_return: condition,
      remarks,
    }),
};

// ============================================
// FINE MANAGEMENT APIs
// ============================================

export const finesAPI = {
  // List fines
  getFines: (page = 1, limit = 20, filters = {}) =>
    apiClient.get('/fines', { params: { page, limit, ...filters } }),

  // Pay fine
  payFine: (fineId, paymentMethod = 'cash') =>
    apiClient.post(`/fines/${fineId}/pay`, { payment_method: paymentMethod }),

  // Get user fines
  getUserFines: (userId) => apiClient.get('/fines', { params: { user_id: userId } }),
};

// ============================================
// ATTENDANCE APIs
// ============================================

export const attendanceAPI = {
  // Get attendance records
  getAttendance: (filters = {}) =>
    apiClient.get('/attendance', { params: filters }),

  // Get user attendance
  getUserAttendance: (userId) =>
    apiClient.get(`/attendance/${userId}`),

  // Get attendance report
  getAttendanceReport: (startDate, endDate) =>
    apiClient.post('/attendance/report', { startDate, endDate }),
};

// ============================================
// PRINT JOBS APIs
// ============================================

export const printJobsAPI = {
  // List print jobs
  getPrintJobs: (page = 1, limit = 20, filters = {}) =>
    apiClient.get('/print-jobs', { params: { page, limit, ...filters } }),

  // Get single print job
  getPrintJob: (jobId) => apiClient.get(`/print-jobs/${jobId}`),

  // Approve print job
  approvePrintJob: (jobId) =>
    apiClient.put(`/print-jobs/${jobId}/approve`),

  // Reject print job
  rejectPrintJob: (jobId, reason = '') =>
    apiClient.put(`/print-jobs/${jobId}/reject`, { rejection_reason: reason }),

  // Mark printing
  markPrinting: (jobId) =>
    apiClient.put(`/print-jobs/${jobId}/mark-printing`),

  // Mark ready
  markReady: (jobId) =>
    apiClient.put(`/print-jobs/${jobId}/mark-ready`),

  // Mark collected
  markCollected: (jobId) =>
    apiClient.put(`/print-jobs/${jobId}/mark-collected`),

  // Delete print job
  deletePrintJob: (jobId) =>
    apiClient.delete(`/print-jobs/${jobId}`),

  // Get print stats
  getPrintStats: () => apiClient.get('/print-stats'),
};

// ============================================
// SUPPORT TICKETS APIs
// ============================================

export const supportAPI = {
  // List tickets
  getTickets: (page = 1, limit = 20, filters = {}) =>
    apiClient.get('/support/tickets', { params: { page, limit, ...filters } }),

  // Get single ticket
  getTicket: (ticketId) =>
    apiClient.get(`/support/tickets/${ticketId}`),

  // Assign ticket
  assignTicket: (ticketId, assignedTo) =>
    apiClient.put(`/support/tickets/${ticketId}/assign`, { assigned_to: assignedTo }),

  // Resolve ticket
  resolveTicket: (ticketId, resolutionNotes) =>
    apiClient.put(`/support/tickets/${ticketId}/resolve`, { resolution_notes: resolutionNotes }),

  // Close ticket
  closeTicket: (ticketId) =>
    apiClient.put(`/support/tickets/${ticketId}/close`),

  // Reopen ticket
  reopenTicket: (ticketId) =>
    apiClient.put(`/support/tickets/${ticketId}/reopen`),

  // Update priority
  updatePriority: (ticketId, priority) =>
    apiClient.put(`/support/tickets/${ticketId}/priority`, { priority }),

  // Get support stats
  getSupportStats: () => apiClient.get('/support/stats'),
};

// ============================================
// SETTINGS APIs
// ============================================

export const settingsAPI = {
  // Get all settings
  getAllSettings: () => apiClient.get('/settings'),

  // Get specific setting
  getSetting: (key) => apiClient.get(`/settings/${key}`),

  // Update setting
  updateSetting: (key, value) =>
    apiClient.put(`/settings/${key}`, { value }),

  // Batch update settings
  updateBatchSettings: (settings) =>
    apiClient.post('/settings/batch', { settings }),

  // Get fine rules
  getFineRules: () => apiClient.get('/settings/fine-rules'),

  // Update fine rules
  updateFineRules: (rules) =>
    apiClient.put('/settings/fine-rules', rules),

  // Get library info
  getLibraryInfo: () => apiClient.get('/settings/library-info'),
};

// ============================================
// REPORTS APIs
// ============================================

export const reportsAPI = {
  // Books issued report
  getBooksIssuedReport: (startDate, endDate) =>
    apiClient.get('/reports/books-issued', { params: { startDate, endDate } }),

  // Attendance report
  getAttendanceReport: (startDate, endDate) =>
    apiClient.get('/reports/attendance', { params: { startDate, endDate } }),

  // Fines report
  getFinesReport: (startDate, endDate) =>
    apiClient.get('/reports/fines', { params: { startDate, endDate } }),

  // Print jobs report
  getPrintJobsReport: (startDate, endDate) =>
    apiClient.get('/reports/print-jobs', { params: { startDate, endDate } }),

  // Users report
  getUsersReport: () => apiClient.get('/reports/users'),

  // Custom report
  getCustomReport: (type, filters = {}) =>
    apiClient.get('/reports/custom', { params: { type, ...filters } }),
};

// ============================================
// ANALYTICS/AI INSIGHTS APIs
// ============================================

export const analyticsAPI = {
  // Get trending/popular books
  getTrendingBooks: (limit = 10) =>
    apiClient.get('/analytics/trending-books', { params: { limit } }),

  // Get predictions
  getPredictions: () => apiClient.get('/analytics/predictions'),

  // Get recommendations
  getRecommendations: () => apiClient.get('/analytics/recommendations'),

  // Get user statistics
  getUserStatistics: () => apiClient.get('/analytics/user-statistics'),

  // Get book statistics
  getBookStatistics: () => apiClient.get('/analytics/book-statistics'),
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const apiUtils = {
  // Format error message
  getErrorMessage: (error) => {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.status === 401) {
      return 'Unauthorized. Please login again.';
    }
    if (error.response?.status === 403) {
      return 'Forbidden. You do not have permission.';
    }
    if (error.response?.status === 404) {
      return 'Resource not found.';
    }
    if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    return error.message || 'An error occurred';
  },

  // Set auth token
  setAuthToken: (token) => {
    localStorage.setItem('adminToken', token);
  },

  // Clear auth token
  clearAuthToken: () => {
    localStorage.removeItem('adminToken');
  },

  // Get auth token
  getAuthToken: () => {
    return localStorage.getItem('adminToken');
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('adminToken');
  },
};

export default {
  dashboardAPI,
  usersAPI,
  booksAPI,
  transactionsAPI,
  finesAPI,
  attendanceAPI,
  printJobsAPI,
  supportAPI,
  settingsAPI,
  reportsAPI,
  analyticsAPI,
  apiUtils,
};
