/**
 * Admin Dashboard Context with Real-Time Updates
 * Manages dashboard state, notifications, and real-time WebSocket updates
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import adminService from '../services/adminDashboardService';

const AdminDashboardContext = createContext();

export const AdminDashboardProvider = ({ children }) => {
  // Dashboard State
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [fines, setFines] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  // Real-time Updates State
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  /**
   * Fetch dashboard statistics
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      const stats = await adminService.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Initialize Admin Service and WebSocket
   */
  useEffect(() => {
    const initializeService = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize WebSocket
        adminService.initializeWebSocket(
          () => {
            setConnected(true);
            console.log('✅ Admin dashboard connected');
            // Register real-time listeners
            adminService.registerRealtimeListeners();
          },
          (reason) => {
            setConnected(false);
            console.warn('⚠️ Admin dashboard disconnected:', reason);
          }
        );

        // Fetch initial data
        await fetchDashboardData();

        setLoading(false);
      } catch (err) {
        console.error('Error initializing admin service:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      adminService.disconnect();
    };
  }, [fetchDashboardData]);

  /**
   * Fetch users
   */
  const fetchUsers = useCallback(async (filters = {}) => {
    try {
      const data = await adminService.getUsers(filters);
      setUsers(data.users || []);
      return data;
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Fetch books
   */
  const fetchBooks = useCallback(async (filters = {}) => {
    try {
      const data = await adminService.getBooks(filters);
      setBooks(data.books || []);
      return data;
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Fetch transactions
   */
  const fetchTransactions = useCallback(async (filters = {}) => {
    try {
      const data = await adminService.getTransactions(filters);
      setTransactions(data.transactions || []);
      return data;
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Fetch fines
   */
  const fetchFines = useCallback(async (filters = {}) => {
    try {
      const data = await adminService.getFines(filters);
      setFines(data.fines || []);
      return data;
    } catch (err) {
      console.error('Error fetching fines:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Fetch notifications
   */
  const fetchNotifications = useCallback(async (filters = {}) => {
    try {
      const data = await adminService.getNotifications(filters);
      setNotifications(data.notifications || []);
      return data;
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Fetch support tickets
   */
  const fetchTickets = useCallback(async (filters = {}) => {
    try {
      const data = await adminService.getTickets(filters);
      setTickets(data.tickets || []);
      return data;
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Add book
   */
  const addBook = useCallback(async (bookData) => {
    try {
      const result = await adminService.addBook(bookData);
      await fetchBooks();
      return result;
    } catch (err) {
      console.error('Error adding book:', err);
      setError(err.message);
      throw err;
    }
  }, [fetchBooks]);

  /**
   * Update book
   */
  const updateBook = useCallback(async (bookId, bookData) => {
    try {
      const result = await adminService.updateBook(bookId, bookData);
      await fetchBooks();
      return result;
    } catch (err) {
      console.error('Error updating book:', err);
      setError(err.message);
      throw err;
    }
  }, [fetchBooks]);

  /**
   * Send notification
   */
  const sendNotification = useCallback(
    async (userId, notificationData) => {
      try {
        const result = await adminService.sendNotification(userId, notificationData);
        // Add to live notifications
        setLiveNotifications((prev) => [
          { ...result, timestamp: new Date().toISOString() },
          ...prev.slice(0, 9),
        ]);
        return result;
      } catch (err) {
        console.error('Error sending notification:', err);
        setError(err.message);
        throw err;
      }
    },
    []
  );

  /**
   * Send bulk notification
   */
  const sendBulkNotification = useCallback(
    async (userIds, notificationData) => {
      try {
        const result = await adminService.sendBulkNotification(userIds, notificationData);
        setLiveNotifications((prev) => [
          { ...result, timestamp: new Date().toISOString() },
          ...prev.slice(0, 9),
        ]);
        return result;
      } catch (err) {
        console.error('Error sending bulk notification:', err);
        setError(err.message);
        throw err;
      }
    },
    []
  );

  /**
   * Send notification to role
   */
  const notifyRole = useCallback(
    async (role, notificationData) => {
      try {
        const result = await adminService.sendNotificationToRole(role, notificationData);
        setLiveNotifications((prev) => [
          { ...result, timestamp: new Date().toISOString() },
          ...prev.slice(0, 9),
        ]);
        return result;
      } catch (err) {
        console.error('Error notifying role:', err);
        setError(err.message);
        throw err;
      }
    },
    []
  );

  /**
   * Send automated reminders
   */
  const sendReminders = useCallback(async (reminderType) => {
    try {
      const result = await adminService.sendReminders(reminderType);
      return result;
    } catch (err) {
      console.error('Error sending reminders:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Log activity
   */
  const logActivity = useCallback((activity) => {
    setRecentActivities((prev) => [
      {
        ...activity,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9),
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value = {
    // State
    dashboardStats,
    users,
    books,
    transactions,
    fines,
    notifications,
    tickets,
    liveNotifications,
    recentActivities,

    // UI State
    loading,
    error,
    connected,

    // Fetch methods
    fetchDashboardData,
    fetchUsers,
    fetchBooks,
    fetchTransactions,
    fetchFines,
    fetchNotifications,
    fetchTickets,

    // Create/Update methods
    addBook,
    updateBook,

    // Notification methods
    sendNotification,
    sendBulkNotification,
    notifyRole,
    sendReminders,

    // Utility methods
    logActivity,
    clearError,
  };

  return (
    <AdminDashboardContext.Provider value={value}>
      {children}
    </AdminDashboardContext.Provider>
  );
};

/**
 * Hook to use Admin Dashboard Context
 */
export const useAdminDashboard = () => {
  const context = useContext(AdminDashboardContext);
  if (!context) {
    throw new Error('useAdminDashboard must be used within AdminDashboardProvider');
  }
  return context;
};

export default AdminDashboardContext;
