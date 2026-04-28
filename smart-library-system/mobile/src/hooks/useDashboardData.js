/**
 * Dashboard Data Hook
 * Fetches all dashboard data from backend (user profile, books, stats, etc.)
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { issuesService } from '../services';
import { paymentsService } from '../services';
import { userService } from '../services';
import { notificationsService } from '../services';

export const useDashboardData = () => {
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    borrowedBooks: 0,
    dueBooks: 0,
    pendingFines: '$0.00',
    printJobs: 0,
    studentsInLibrary: 0,
    libraryOccupancy: [],
    recommendations: [],
    recentActivity: [],
  });

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch borrowed books
      const borrowedBooksRes = await issuesService.getBorrowedBooks({
        limit: 100,
        page: 1,
      });
      const borrowedCount = borrowedBooksRes.books?.length || 0;

      // Find due soon books
      const overdueBooksRes = await issuesService.getOverdueBooks();
      const dueSoonCount = overdueBooksRes.books?.filter(
        book => !book.isOverdue
      ).length || 0;

      // Fetch fines
      const finesRes = await paymentsService.getUserFines();
      const totalFines = finesRes.fines?.reduce((sum, fine) => sum + (fine.amount || 0), 0) || 0;
      const formattedFines = `$${totalFines.toFixed(2)}`;

      // Fetch user profile for stats
      const profileRes = await userService.getUserProfile();
      const printJobs = profileRes.user?.printJobsCount || 0;

      // Fetch recent activity/notifications
      const notificationsRes = await notificationsService.getNotifications({ limit: 5 });
      const formattedActivity = (notificationsRes.notifications || []).map(notif => ({
        id: notif.id,
        icon: getIconForNotificationType(notif.type),
        title: notif.title,
        subtitle: notif.message,
        time: formatTimeAgo(notif.createdAt),
        bgColor: getColorForNotificationType(notif.type),
        iconColor: getIconColorForNotificationType(notif.type),
      }));

      // Generate mock occupancy data (in real scenario, this comes from backend)
      const occupancyData = generateOccupancyData();

      setDashboardData({
        borrowedBooks: borrowedCount,
        dueBooks: dueSoonCount,
        pendingFines: formattedFines,
        printJobs,
        studentsInLibrary: Math.floor(Math.random() * 100) + 20, // Mock for now
        libraryOccupancy: occupancyData,
        recommendations: [], // Will fetch from recommendations API
        recentActivity: formattedActivity,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    ...dashboardData,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};

/**
 * Helper: Get icon for notification type
 */
const getIconForNotificationType = (type) => {
  const iconMap = {
    book_due: 'book',
    book_returned: 'check-circle',
    payment_due: 'payments',
    print_ready: 'print',
    reservation_ready: 'notifications',
    default: 'info',
  };
  return iconMap[type] || iconMap.default;
};

/**
 * Helper: Get color for notification type
 */
const getColorForNotificationType = (type) => {
  const COLORS = {
    primary: '#0066CC',
    secondary: '#00A86B',
    tertiary: '#FF6B35',
    error: '#D32F2F',
  };

  const colorMap = {
    book_due: COLORS.secondary,
    book_returned: COLORS.tertiary,
    payment_due: COLORS.error,
    print_ready: COLORS.tertiary,
    reservation_ready: COLORS.primary,
    default: COLORS.primary,
  };
  return colorMap[type] || colorMap.default;
};

/**
 * Helper: Get icon color for notification type
 */
const getIconColorForNotificationType = (type) => {
  const COLORS = {
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onError: '#FFFFFF',
  };

  const colorMap = {
    book_due: COLORS.onSecondary,
    book_returned: COLORS.onTertiary,
    payment_due: COLORS.onError,
    print_ready: COLORS.onTertiary,
    reservation_ready: COLORS.onPrimary,
    default: COLORS.onPrimary,
  };
  return colorMap[type] || colorMap.default;
};

/**
 * Helper: Format time ago
 */
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'NOW';
  
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'NOW';
  if (diffMins < 60) return `${diffMins}M AGO`;
  if (diffHours < 24) return `${diffHours}H AGO`;
  if (diffDays < 7) return `${diffDays}D AGO`;
  return past.toLocaleDateString();
};

/**
 * Helper: Generate occupancy data
 */
const generateOccupancyData = () => {
  const hours = ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM'];
  return hours.map(hour => ({
    hour,
    occupancy: Math.floor(Math.random() * 40) + 40, // 40-80% occupancy
  }));
};

export default useDashboardData;
