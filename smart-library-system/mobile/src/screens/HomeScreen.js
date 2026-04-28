/**
 * Home Screen
 * Main dashboard screen for the Smart Library app
 * Displays user stats, borrowed books, and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { booksService } from '../services/booksService';
import { issuesService } from '../services/issuesService';
import { paymentsService } from '../services/paymentsService';
import { apiClient } from '../services/apiClient';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 48) / 2;

const HomeScreen = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState({
    borrowedBooks: [],
    fines: 0,
    attendancePercentage: 0,
    printJobs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authentication before loading data
    if (isAuthenticated) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [booksResult, finesResult, attendanceResult, printResult] =
        await Promise.all([
          issuesService.getBorrowedBooks().catch(() => []),
          paymentsService.getUserFines().catch(() => ({ totalFines: 0 })),
          apiClient.get('/qr/attendance-logs').catch(() => ({ attendance: 0 })),
          apiClient.get('/print/my-jobs').catch(() => ({ jobs: [] })),
        ]);

      setData({
        borrowedBooks: booksResult || [],
        fines: finesResult?.totalFines || 0,
        attendancePercentage: attendanceResult?.attendance || 0,
        printJobs: (printResult?.jobs || []).filter(
          (j) => j.status === 'pending' || j.status === 'printing',
        ).length,
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ icon, label, value, color, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name={icon} size={28} color="#fff" />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </TouchableOpacity>
  );

  const QuickActionButton = ({ icon, label, onPress, color = '#007AFF' }) => (
    <TouchableOpacity
      style={[styles.quickActionBtn, { borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={[styles.quickActionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header - Only show when authenticated */}
      {isAuthenticated && (
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('NotificationsTab')}
            style={styles.notificationIcon}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#007AFF" />
            {data.borrowedBooks.some((b) => b.isOverdue) && (
              <View style={styles.notificationBadge} />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadDashboardData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="book"
          label="Borrowed"
          value={data.borrowedBooks.length}
          color="#007AFF"
          onPress={() => navigation.navigate('ReturnBooksDetail')}
        />
        <StatCard
          icon="cash"
          label="Fines"
          value={`₹${data.fines}`}
          color={data.fines > 0 ? '#FF3B30' : '#34C759'}
          onPress={() => navigation.navigate('PaymentTab')}
        />
        <StatCard
          icon="calendar-check"
          label="Attendance"
          value={`${data.attendancePercentage}%`}
          color={
            data.attendancePercentage >= 75
              ? '#34C759'
              : data.attendancePercentage >= 60
              ? '#FF9500'
              : '#FF3B30'
          }
          onPress={() => navigation.navigate('AttendanceTab')}
        />
        <StatCard
          icon="printer"
          label="Print Jobs"
          value={data.printJobs}
          color="#5856D6"
          onPress={() => navigation.navigate('PrintTab')}
        />
      </View>

      {/* Borrowed Books Section */}
      {data.borrowedBooks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Borrowed Books</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ReturnBooksDetail')}
            >
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {data.borrowedBooks.slice(0, 3).map((book) => {
            const daysLeft = Math.ceil(
              (new Date(book.dueDate) - new Date()) / (1000 * 60 * 60 * 24),
            );
            const isOverdue = daysLeft < 0;

            return (
              <TouchableOpacity
                key={book.id}
                style={styles.bookCard}
                onPress={() => navigation.navigate('BookDetailTab', { bookId: book.id })}
                activeOpacity={0.7}
              >
                <View style={styles.bookIconContainer}>
                  <MaterialCommunityIcons name="book" size={32} color="#007AFF" />
                </View>
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle} numberOfLines={1}>
                    {book.title}
                  </Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>
                    {book.author}
                  </Text>
                  <View style={styles.dueDateContainer}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={14}
                      color={isOverdue ? '#FF3B30' : '#34C759'}
                    />
                    <Text
                      style={[
                        styles.dueDate,
                        { color: isOverdue ? '#FF3B30' : '#34C759' },
                      ]}
                    >
                      {isOverdue
                        ? `${Math.abs(daysLeft)} days overdue`
                        : `${daysLeft} days left`}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionButton
            icon="plus-circle"
            label="Issue Book"
            color="#007AFF"
            onPress={() => navigation.navigate('IssueBooksDetail')}
          />
          <QuickActionButton
            icon="qrcode-scan"
            label="Scan QR"
            color="#34C759"
            onPress={() => navigation.navigate('QRScannerTab')}
          />
          <QuickActionButton
            icon="magnify"
            label="Search"
            color="#FF9500"
            onPress={() => navigation.navigate('SearchTab')}
          />
          <QuickActionButton
            icon="cog"
            label="Settings"
            color="#5856D6"
            onPress={() => navigation.navigate('SettingsTab')}
          />
        </View>
      </View>

      {/* Empty State */}
      {data.borrowedBooks.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="book-open" size={48} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Borrowed Books</Text>
          <Text style={styles.emptyStateSubtitle}>
            Browse our library and borrow some books
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('SearchTab')}
          >
            <Text style={styles.browseButtonText}>Browse Library</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    color: '#FF3B30',
    fontSize: 13,
  },
  retryButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: CARD_WIDTH,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 8,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  viewAll: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  bookIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionBtn: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  quickActionLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default HomeScreen;
