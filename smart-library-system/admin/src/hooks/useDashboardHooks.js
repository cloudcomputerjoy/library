/**
 * Real-Time Hooks for Admin Dashboard
 * Provides hooks for real-time data updates, notifications, and WebSocket events
 */

import { useEffect, useCallback, useState } from 'react';
import { useAdminDashboard } from '../contexts/AdminDashboardContext';
import adminService from '../services/adminDashboardService';

/**
 * Hook: Auto-refresh data at intervals
 */
export const useAutoRefresh = (fetchFunction, interval = 30000, enabled = true) => {
  useEffect(() => {
    if (!enabled || !fetchFunction) return;

    // Initial fetch
    fetchFunction();

    // Set up interval
    const timer = setInterval(fetchFunction, interval);

    return () => clearInterval(timer);
  }, [fetchFunction, interval, enabled]);
};

/**
 * Hook: Listen to real-time events
 */
export const useRealtimeEvent = (eventName, callback) => {
  useEffect(() => {
    if (!adminService.socket) {
      console.warn('WebSocket not initialized');
      return;
    }

    adminService.on(eventName, callback);

    return () => {
      // Note: SocketIO doesn't have a direct off method in all versions
      // This is a limitation to be aware of
    };
  }, [eventName, callback]);
};

/**
 * Hook: Real-time notifications
 */
export const useRealtimeNotifications = () => {
  const { liveNotifications } = useAdminDashboard();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = liveNotifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [liveNotifications]);

  return { notifications: liveNotifications, unreadCount };
};

/**
 * Hook: Recent activities
 */
export const useRecentActivities = () => {
  const { recentActivities, logActivity } = useAdminDashboard();

  return { activities: recentActivities, logActivity };
};

/**
 * Hook: Dashboard metrics with real-time updates
 */
export const useDashboardMetrics = (dateRange = '30days', autoRefresh = true) => {
  const { dashboardStats, connected } = useAdminDashboard();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        const stats = await adminService.getDashboardMetrics(dateRange);
        setMetrics(stats);
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (connected) {
      loadMetrics();
      if (autoRefresh) {
        const interval = setInterval(loadMetrics, 60000); // Update every minute
        return () => clearInterval(interval);
      }
    }
  }, [dateRange, connected, autoRefresh]);

  return { metrics, dashboardStats, loading };
};

/**
 * Hook: Users with real-time updates
 */
export const useUsers = (filters = {}, autoRefresh = true) => {
  const { users, fetchUsers, connected } = useAdminDashboard();

  useAutoRefresh(
    () => fetchUsers(filters),
    60000, // 1 minute
    autoRefresh && connected
  );

  return { users, refetch: fetchUsers };
};

/**
 * Hook: Books with real-time updates
 */
export const useBooks = (filters = {}, autoRefresh = true) => {
  const { books, fetchBooks, connected } = useAdminDashboard();

  useAutoRefresh(
    () => fetchBooks(filters),
    60000,
    autoRefresh && connected
  );

  return { books, refetch: fetchBooks };
};

/**
 * Hook: Transactions with real-time updates
 */
export const useTransactions = (filters = {}, autoRefresh = true) => {
  const { transactions, fetchTransactions, connected } = useAdminDashboard();

  useAutoRefresh(
    () => fetchTransactions(filters),
    30000, // 30 seconds - more frequent for transactions
    autoRefresh && connected
  );

  return { transactions, refetch: fetchTransactions };
};

/**
 * Hook: Fines with real-time updates
 */
export const useFines = (filters = {}, autoRefresh = true) => {
  const { fines, fetchFines, connected } = useAdminDashboard();

  useAutoRefresh(
    () => fetchFines(filters),
    60000,
    autoRefresh && connected
  );

  return { fines, refetch: fetchFines };
};

/**
 * Hook: Notifications with real-time updates
 */
export const useNotifications = (filters = {}, autoRefresh = true) => {
  const { notifications, fetchNotifications, connected } = useAdminDashboard();

  useAutoRefresh(
    () => fetchNotifications(filters),
    30000,
    autoRefresh && connected
  );

  return { notifications, refetch: fetchNotifications };
};

/**
 * Hook: Support tickets with real-time updates
 */
export const useTickets = (filters = {}, autoRefresh = true) => {
  const { tickets, fetchTickets, connected } = useAdminDashboard();

  useAutoRefresh(
    () => fetchTickets(filters),
    30000,
    autoRefresh && connected
  );

  return { tickets, refetch: fetchTickets };
};

/**
 * Hook: Send notifications with tracking
 */
export const useSendNotification = () => {
  const { sendNotification, sendBulkNotification, notifyRole, logActivity } =
    useAdminDashboard();
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const send = useCallback(
    async (type, recipients, message, options = {}) => {
      try {
        setSending(true);
        let result;

        if (type === 'single') {
          result = await sendNotification(recipients, {
            title: options.title || 'Notification',
            message,
            type: options.notificationType || 'info',
          });
        } else if (type === 'bulk') {
          result = await sendBulkNotification(recipients, {
            title: options.title || 'Notification',
            message,
            type: options.notificationType || 'info',
          });
        } else if (type === 'role') {
          result = await notifyRole(recipients, {
            title: options.title || 'Notification',
            message,
            type: options.notificationType || 'info',
          });
        }

        setSentCount((prev) => prev + 1);
        logActivity({
          type: 'notification_sent',
          description: `Sent ${type} notification: ${message}`,
        });

        return result;
      } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
      } finally {
        setSending(false);
      }
    },
    [sendNotification, sendBulkNotification, notifyRole, logActivity]
  );

  return { send, sending, sentCount };
};

/**
 * Hook: System status monitoring
 */
export const useSystemStatus = () => {
  const { connected, error, loading } = useAdminDashboard();
  const [systemHealth, setSystemHealth] = useState('healthy');

  useEffect(() => {
    if (!connected) {
      setSystemHealth('disconnected');
    } else if (error) {
      setSystemHealth('warning');
    } else if (loading) {
      setSystemHealth('loading');
    } else {
      setSystemHealth('healthy');
    }
  }, [connected, error, loading]);

  return {
    status: systemHealth,
    connected,
    hasError: !!error,
    isLoading: loading,
    errorMessage: error,
  };
};

/**
 * Hook: Pending actions (books to issue, returns, etc.)
 */
export const usePendingActions = () => {
  const { transactions, fines, tickets } = useAdminDashboard();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let count = 0;

    // Count pending transactions (not completed)
    count += transactions.filter((t) => t.status === 'pending').length;

    // Count pending fines (unpaid)
    count += fines.filter((f) => f.status === 'pending').length;

    // Count open tickets
    count += tickets.filter((t) => t.status === 'open').length;

    setPendingCount(count);
  }, [transactions, fines, tickets]);

  return { pendingCount, hasActions: pendingCount > 0 };
};

/**
 * Hook: Alert manager
 */
export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = useCallback((alert) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAlert = {
      id,
      ...alert,
      timestamp: new Date().toISOString(),
    };

    setAlerts((prev) => [newAlert, ...prev.slice(0, 9)]);

    // Auto-remove after 5 seconds
    if (alert.autoClose !== false) {
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }, 5000);
    }

    return id;
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return { alerts, addAlert, removeAlert, clearAlerts };
};

const dashboardHooksExports = {
  useAutoRefresh,
  useRealtimeEvent,
  useRealtimeNotifications,
  useRecentActivities,
  useDashboardMetrics,
  useUsers,
  useBooks,
  useTransactions,
  useFines,
  useNotifications,
  useTickets,
  useSendNotification,
  useSystemStatus,
  usePendingActions,
  useAlerts,
};

export default dashboardHooksExports;
