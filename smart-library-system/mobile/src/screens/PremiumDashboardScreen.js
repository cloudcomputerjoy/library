import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/UI';
import { COLORS } from '../constants';
import { useDashboardData } from '../hooks/useDashboardData';

const { width: screenWidth } = Dimensions.get('window');

const PremiumDashboardScreen = () => {
  const {
    borrowedBooks,
    dueBooks,
    pendingFines,
    printJobs,
    studentsInLibrary,
    libraryOccupancy,
    recommendations,
    recentActivity,
    loading,
    error,
    refetch,
  } = useDashboardData();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // ========== QUICK STATS FROM BACKEND ==========
  const quickStats = [
    {
      icon: 'book',
      value: borrowedBooks.toString(),
      label: 'Books Issued',
      bgColor: COLORS.primaryFixed,
      iconColor: COLORS.primary,
    },
    {
      icon: 'schedule',
      value: dueBooks.toString(),
      label: 'Due Soon',
      unit: 'days',
      bgColor: COLORS.secondaryFixed,
      iconColor: COLORS.secondary,
      hasBorder: true,
    },
    {
      icon: 'payments',
      value: pendingFines,
      label: 'Pending Fines',
      bgColor: COLORS.errorContainer,
      iconColor: COLORS.error,
    },
    {
      icon: 'print',
      value: printJobs.toString(),
      label: 'Print Jobs',
      bgColor: COLORS.primaryFixedDim,
      iconColor: COLORS.onPrimaryFixedVariant,
    },
  ];

  // ========== RECOMMENDATIONS - FALLBACK TO DEFAULTS ==========
  const bookRecommendations = recommendations.length > 0 ? recommendations : [
    {
      title: 'Ethics in AI',
      author: 'Julian Thorne',
      cover: 'https://picsum.photos/id/20/140/200',
    },
    {
      title: 'Digital Soul',
      author: 'Elena Vance',
      cover: 'https://picsum.photos/id/21/140/200',
    },
    {
      title: 'Quiet Leadership',
      author: 'Marcus Chen',
      cover: 'https://picsum.photos/id/22/140/200',
    },
  ];

  // ========== OCCUPANCY DATA FROM BACKEND ==========
  const occupancyData = libraryOccupancy.length > 0 ? libraryOccupancy : [
    { hour: '8 AM', occupancy: 40 },
    { hour: '10 AM', occupancy: 55 },
    { hour: '12 PM', occupancy: 70 },
    { hour: '2 PM', occupancy: 90 },
    { hour: '4 PM', occupancy: 80 },
    { hour: '6 PM', occupancy: 60 },
    { hour: '8 PM', occupancy: 45 },
  ];

  // ========== RECENT ACTIVITY FROM BACKEND ==========
  const activityList = recentActivity.length > 0 ? recentActivity : [
    {
      icon: 'book',
      title: 'Book due in 2 days',
      subtitle: 'The Intelligent Investor',
      time: '2H AGO',
      bgColor: COLORS.secondaryFixed,
      iconColor: COLORS.secondary,
    },
    {
      icon: 'check-circle',
      title: 'Print job completed',
      subtitle: 'Thesis_Final_Draft.pdf',
      time: '5H AGO',
      bgColor: COLORS.tertiaryFixed,
      iconColor: COLORS.tertiary,
    },
  ];

  const peakOccupancyIndex = occupancyData.reduce((maxIdx, item, idx) => 
    item.occupancy > occupancyData[maxIdx].occupancy ? idx : maxIdx, 0
  );
  const currentHourIndex = Math.floor((new Date().getHours() - 8) / 2) % occupancyData.length;

  return (
    <ScreenWrapper style={styles.container} contentStyle={styles.content}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        )}

        {!loading && (
          <>

        {/* Live Status Card */}
        <View style={styles.liveStatusCard}>
          <View style={styles.liveStatusHeader}>
            <View style={styles.liveStatusInfo}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveIndicatorText}>LIVE</Text>
              </View>
              <Text style={styles.liveStatusTitle}>Inside Library</Text>
              <View style={styles.statusDetails}>
                <Text style={styles.entryTime}>Entered at 10:05 AM</Text>
                <Text style={styles.duration}>Duration: 2h 45m</Text>
              </View>
              <View style={styles.studentCount}>
                <MaterialIcons name="group" size={14} color={COLORS.tertiary} />
                <Text style={styles.studentText}>{studentsInLibrary} students currently inside</Text>
              </View>
            </View>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>Active</Text>
            </View>
          </View>
          <MaterialIcons name="local-library" size={96} color={COLORS.onSurface} style={styles.libraryIcon} />
        </View>

        {/* Quick Stats */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsScrollContent}
        >
          {quickStats.map((stat, index) => (
            <View key={index} style={[styles.statCard, stat.hasBorder && styles.statCardBorder]}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                <MaterialIcons name={stat.icon} size={24} color={stat.iconColor} />
              </View>
              <Text style={styles.statValue}>
                {stat.value} {stat.unit && <Text style={styles.statUnit}>{stat.unit}</Text>}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </ScrollView>

            {/* Library Status */}
            <View style={styles.libraryStatusCard}>
              <View style={styles.libraryStatusHeader}>
                <Text style={styles.libraryStatusTitle}>Library Occupancy</Text>
                <Text style={styles.studentCountText}>{studentsInLibrary} students inside</Text>
              </View>
          <View style={styles.occupancyGraph}>
            {occupancyData.map((item, index) => (
              <View key={index} style={styles.occupancyBarContainer}>
                <View 
                  style={[
                    styles.occupancyBar, 
                    { height: `${item.occupancy}%` },
                    index === currentHourIndex && styles.occupancyBarCurrent,
                    index === peakOccupancyIndex && styles.occupancyBarPeak
                  ]} 
                />
              </View>
            ))}
          </View>
          <View style={styles.timeLabels}>
            {occupancyData.map((item, index) => (
              <Text key={index} style={styles.timeLabel}>{item.hour}</Text>
            ))}
          </View>
              <Text style={styles.occupancyNote}>Peak occupancy at {occupancyData[peakOccupancyIndex]?.hour || '2 PM'}</Text>
            </View>

            {/* AI Recommendations */}
            <View style={styles.recommendationsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommended for You</Text>
                <Pressable>
                  <Text style={styles.viewAllText}>View all</Text>
                </Pressable>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.recommendationsScroll}
                contentContainerStyle={styles.recommendationsScrollContent}
              >
                {bookRecommendations.map((book, index) => (
                  <Pressable key={index} style={styles.bookCard}>
                    <Image source={{ uri: book.cover }} style={styles.bookCover} />
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    <Text style={styles.bookAuthor}>{book.author}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Recent Activity */}
            <View style={styles.activitySection}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={styles.activityCard}>
                {activityList.map((activity, index) => (
                  <View key={index} style={[styles.activityItem, index !== activityList.length - 1 && styles.activityItemBorder]}>
                    <View style={[styles.activityIconContainer, { backgroundColor: activity.bgColor }]}>
                      <MaterialIcons name={activity.icon} size={20} color={activity.iconColor} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                    </View>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  // ========== CONTAINER STYLES ==========
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  scrollContent: {
    paddingBottom: 320,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },

  // ========== LIVE STATUS CARD STYLES ==========
  liveStatusCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: COLORS.outlineVariant,
  },
  liveStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  liveStatusInfo: {
    flex: 1,
    zIndex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.tertiary,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.tertiary,
    letterSpacing: 0.5,
  },
  liveStatusTitle: {
    fontWeight: '800',
    fontSize: 24,
    color: COLORS.onSurface,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  statusDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  entryTime: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  duration: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  studentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  studentText: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontWeight: '600',
  },
  liveBadge: {
    backgroundColor: COLORS.primaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: COLORS.primaryFixedDim,
  },
  liveBadgeText: {
    color: COLORS.onPrimaryFixed,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  libraryIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.08,
    transform: [{ rotate: '-10deg' }],
  },

  // ========== STATS SECTION STYLES ==========
  statsScroll: {
    marginTop: 16,
    marginBottom: 8,
  },
  statsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: screenWidth * 0.55,
    maxWidth: 220,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.outlineVariant,
    marginRight: 12,
  },
  statCardBorder: {
    borderColor: COLORS.secondary,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontWeight: '800',
    fontSize: 26,
    color: COLORS.onSurface,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ========== LIBRARY STATUS CARD STYLES ==========
  libraryStatusCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
    marginTop: 24,
    marginHorizontal: 16,
    borderWidth: 0.5,
    borderColor: COLORS.outlineVariant,
  },
  libraryStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  libraryStatusTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: COLORS.onSurface,
    letterSpacing: -0.3,
  },
  studentCountText: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontWeight: '600',
  },

  // ========== OCCUPANCY GRAPH STYLES ==========
  occupancyGraph: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
  },
  occupancyBarContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  occupancyBar: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainerHigh,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 4,
  },
  occupancyBarCurrent: {
    backgroundColor: COLORS.primary,
    opacity: 0.8,
  },
  occupancyBarPeak: {
    backgroundColor: COLORS.primary,
    opacity: 1,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  occupancyNote: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },

  // ========== RECOMMENDATIONS SECTION STYLES ==========
  recommendationsSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: COLORS.onSurface,
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  recommendationsScroll: {
    marginHorizontal: 0,
  },
  recommendationsScrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  bookCard: {
    width: 120,
    alignItems: 'center',
    marginRight: 8,
  },
  bookCover: {
    width: 120,
    height: 170,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  bookTitle: {
    fontWeight: '700',
    fontSize: 13,
    color: COLORS.onSurface,
    textAlign: 'center',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ========== ACTIVITY SECTION STYLES ==========
  activitySection: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  activityCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    paddingVertical: 4,
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: COLORS.outlineVariant,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  activityItemBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.outlineVariant,
  },
  activityIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: '700',
    marginBottom: 3,
  },
  activitySubtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default PremiumDashboardScreen;