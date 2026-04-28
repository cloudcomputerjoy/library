/**
 * Admin Dashboard Integration Service
 * Connects admin dashboard with Supabase database and real-time notifications
 * Handles all admin operations: users, books, transactions, notifications, reports
 */

import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

/**
 * Initialize Admin Service with JWT Token
 */
class AdminDashboardService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_BASE_URL}/api/admin`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add JWT interceptor
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle errors
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('adminToken');
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }
    );

    this.socket = null;
    this.listeners = {};
  }

  /**
   * Initialize WebSocket for real-time updates
   */
  initializeWebSocket(onConnect, onDisconnect) {
    this.socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('adminToken') || localStorage.getItem('token'),
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.socket.emit('admin-join-room');
      onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ WebSocket disconnected:', reason);
      onDisconnect?.(reason);
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    return this.socket;
  }

  /**
   * Listen to real-time events
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.listeners[event] = callback;
    }
  }

  /**
   * Emit event to server
   */
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  /**
   * ============================================================
   * DASHBOARD STATISTICS & ANALYTICS
   * ============================================================
   */

  async getDashboardStats() {
    try {
      const response = await this.apiClient.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getDashboardMetrics(dateRange = '30days') {
    try {
      const response = await this.apiClient.get(`/dashboard/metrics`, {
        params: { range: dateRange },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  }

  /**
   * ============================================================
   * USER MANAGEMENT
   * ============================================================
   */

  // Get all users with filters
  async getUsers(filters = {}) {
    try {
      const response = await this.apiClient.get('/users', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await this.apiClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      const response = await this.apiClient.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      const response = await this.apiClient.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Bulk import users
  async bulkImportUsers(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await this.apiClient.post('/users/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Error importing users:', error);
      throw error;
    }
  }

  /**
   * ============================================================
   * BOOK MANAGEMENT
   * ============================================================
   */

  // Get all books with filters
  async getBooks(filters = {}) {
    try {
      const response = await this.apiClient.get('/books', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  }

  // Get book by ID
  async getBookById(bookId) {
    try {
      const response = await this.apiClient.get(`/books/${bookId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book:', error);
      throw error;
    }
  }

  // Add new book
  async addBook(bookData) {
    try {
      const response = await this.apiClient.post('/books', bookData);
      return response.data;
    } catch (error) {
      console.error('Error adding book:', error);
      throw error;
    }
  }

  // Update book
  async updateBook(bookId, bookData) {
    try {
      const response = await this.apiClient.put(`/books/${bookId}`, bookData);
      return response.data;
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  }

  // Delete book
  async deleteBook(bookId) {
    try {
      const response = await this.apiClient.delete(`/books/${bookId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }

  // Bulk import books
  async bulkImportBooks(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await this.apiClient.post('/books/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Error importing books:', error);
      throw error;
    }
  }

  /**
   * ============================================================
   * TRANSACTIONS (Issue/Return)
   * ============================================================
   */

  // Get transactions
  async getTransactions(filters = {}) {
    try {
      const response = await this.apiClient.get('/transactions', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  // Get transaction by ID
  async getTransactionById(transactionId) {
    try {
      const response = await this.apiClient.get(`/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  // Create transaction (manual issue)
  async createTransaction(transactionData) {
    try {
      const response = await this.apiClient.post('/transactions', transactionData);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * ============================================================
   * FINES MANAGEMENT
   * ============================================================
   */

  // Get fines
  async getFines(filters = {}) {
    try {
      const response = await this.apiClient.get('/fines', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching fines:', error);
      throw error;
    }
  }

  // Record fine payment
  async payFine(fineId, paymentData) {
    try {
      const response = await this.apiClient.post(`/fines/${fineId}/pay`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error paying fine:', error);
      throw error;
    }
  }

  // Waive fine (admin only)
  async waiveFine(fineId, reason) {
    try {
      const response = await this.apiClient.post(`/fines/${fineId}/waive`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error waiving fine:', error);
      throw error;
    }
  }

  /**
   * ============================================================
   * NOTIFICATIONS
   * ============================================================
   */

  // Get notifications
  async getNotifications(filters = {}) {
    try {
      const response = await this.apiClient.get('/notifications', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Send notification to user
  async sendNotification(userId, notificationData) {
    try {
      const response = await this.apiClient.post(`/notifications/send`, {
        userId,
        ...notificationData,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send bulk notification
  async sendBulkNotification(userIds, notificationData) {
    try {
      const response = await this.apiClient.post(`/notifications/send-bulk`, {
        userIds,
        ...notificationData,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      throw error;
    }
  }

  // Send notification to role (e.g., all students)
  async sendNotificationToRole(role, notificationData) {
    try {
      const response = await this.apiClient.post(`/notifications/send-role`, {
        role,
        ...notificationData,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending notification to role:', error);
      throw error;
    }
  }

  // Send automated reminders
  async sendReminders(reminderType) {
    try {
      const response = await this.apiClient.post(`/notifications/send-reminders`, {
        type: reminderType, // 'due-date', 'overdue', 'fine-pending'
      });
      return response.data;
    } catch (error) {
      console.error('Error sending reminders:', error);
      throw error;
    }
  }

  /**
   * ============================================================
   * ATTENDANCE TRACKING
   * ============================================================
   */

  // Get attendance records
  async getAttendance(filters = {}) {
    try {
      const response = await this.apiClient.get('/attendance', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  }

  // Record attendance
  async recordAttendance(userId, status) {
    try {
      const response = await this.apiClient.post('/attendance/record', {
        userId,
        status,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw error;
    }
  }

  /**
   * ============================================================
   * PRINT SERVICES
   * ============================================================
   */

  // Get print jobs
  async getPrintJobs(filters = {}) {
    try {
      const response = await this.apiClient.get('/print-jobs', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching print jobs:', error);
      throw error;
    }
  }

  // Update print job status
  async updatePrintJobStatus(jobId, status) {
    try {
      const response = await this.apiClient.put(`/print-jobs/${jobId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating print job:', error);
      throw error;
    }
  }

  /**
   * ============================================================
   * REPORTS & ANALYTICS
   * ============================================================
   */

  // Generate report
  async generateReport(reportType, filters = {}) {
    try {
      const response = await this.apiClient.get(`/reports/${reportType}`, {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // Export data
  async exportData(dataType, format = 'csv') {
    try {
      const response = await this.apiClient.get(`/export/${dataType}`, {
        params: { format },
        responseType: format === 'pdf' ? 'blob' : 'arraybuffer',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * ============================================================
   * SYSTEM ADMINISTRATION
   * ============================================================
   */

  // Get system settings
  async getSettings() {
    try {
      const response = await this.apiClient.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  // Update system settings
  async updateSettings(settings) {
    try {
      const response = await this.apiClient.put('/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  // Get system logs
  async getSystemLogs(filters = {}) {
    try {
      const response = await this.apiClient.get('/logs', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }

  // Get database backup
  async createBackup() {
    try {
      const response = await this.apiClient.post('/backup/create');
      return response.data;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * ============================================================
   * SUPPORT & TICKETS
   * ============================================================
   */

  // Get support tickets
  async getTickets(filters = {}) {
    try {
      const response = await this.apiClient.get('/support/tickets', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  }

  // Create response to ticket
  async respondToTicket(ticketId, response) {
    try {
      const result = await this.apiClient.post(`/support/tickets/${ticketId}/respond`, {
        message: response,
      });
      return result.data;
    } catch (error) {
      console.error('Error responding to ticket:', error);
      throw error;
    }
  }

  /**
   * ============================================================
   * REAL-TIME EVENT LISTENERS
   * ============================================================
   */

  // Listen to real-time updates
  registerRealtimeListeners() {
    if (!this.socket) {
      console.warn('WebSocket not initialized');
      return;
    }

    // New book added
    this.on('book-added', (data) => {
      console.log('📚 New book added:', data);
      this.emit('admin:refresh-books');
    });

    // Book returned
    this.on('book-returned', (data) => {
      console.log('📙 Book returned:', data);
      this.emit('admin:refresh-transactions');
    });

    // New fine created
    this.on('fine-created', (data) => {
      console.log('💰 New fine:', data);
      this.emit('admin:refresh-fines');
    });

    // User created/updated
    this.on('user-updated', (data) => {
      console.log('👤 User updated:', data);
      this.emit('admin:refresh-users');
    });

    // New support ticket
    this.on('ticket-created', (data) => {
      console.log('🎫 New support ticket:', data);
      this.emit('admin:refresh-tickets');
    });

    // Notification sent
    this.on('notification-sent', (data) => {
      console.log('🔔 Notification sent:', data);
    });
  }

  /**
   * Clean up WebSocket connection
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export as singleton
const adminDashboardServiceInstance = new AdminDashboardService();
export default adminDashboardServiceInstance;
