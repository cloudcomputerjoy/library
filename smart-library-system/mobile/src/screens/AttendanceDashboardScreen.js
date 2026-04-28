import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { ScreenWrapper } from '../components/UI';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const AttendanceDashboardScreen = () => {
  const weeklyData = [40, 65, 85, 50, 75, 20, 10];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const recentActivity = [
    {
      type: 'entry',
      location: 'Main Gate',
      date: 'Oct 24, 2023',
      time: '08:45 AM',
      icon: 'login',
      bgColor: COLORS.primaryContainer,
      textColor: COLORS.primary,
    },
    {
      type: 'exit',
      location: 'South Wing',
      date: 'Oct 23, 2023',
      time: '06:12 PM',
      icon: 'logout',
      bgColor: COLORS.secondaryContainer,
      textColor: COLORS.secondary,
    },
    {
      type: 'entry',
      location: 'Main Gate',
      date: 'Oct 23, 2023',
      time: '09:00 AM',
      icon: 'login',
      bgColor: COLORS.primaryContainer,
      textColor: COLORS.primary,
    },
  ];

  return (
    <ScreenWrapper style={styles.container}>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Summary Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Daily Attendance</Text>
              <Text style={styles.heroSubtitle}>Your scholarly journey, tracked in real-time.</Text>
            </View>
            <View style={styles.timeSummary}>
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Total time this week</Text>
                <Text style={styles.timeValue}>12.5 hrs</Text>
              </View>
              <View style={styles.timeIconContainer}>
                <MaterialIcons name="schedule" size={20} color={COLORS.primary} />
              </View>
            </View>
          </View>
          <View style={styles.heroDecoration} />
        </View>

        {/* Bento Grid */}
        <View style={styles.bentoGrid}>
          {/* Usage Trends */}
          <View style={styles.trendsCard}>
            <View style={styles.trendsHeader}>
              <Text style={styles.trendsTitle}>Usage Trends</Text>
              <View style={styles.viewBadge}>
                <Text style={styles.viewBadgeText}>Weekly View</Text>
              </View>
            </View>
            <View style={styles.chartContainer}>
              {weeklyData.map((height, index) => (
                <View key={index} style={styles.chartBar}>
                  <View
                    style={[
                      styles.bar,
                      { height: `${height}%` },
                      index === 2 && styles.barActive
                    ]}
                  />
                  <Text style={[styles.barLabel, index === 2 && styles.barLabelActive]}>
                    {days[index]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* AI Insight */}
          <View style={styles.insightCard}>
            <View style={styles.insightBadge}>
              <MaterialIcons name="auto_awesome" size={20} color={COLORS.tertiary} style={styles.insightBadgeIcon} />
              <Text style={styles.insightBadgeText}>AI INSIGHT</Text>
            </View>
            <Text style={styles.insightTitle}>Prime Time Spotted</Text>
            <Text style={styles.insightText}>
              You're most productive on <Text style={styles.insightHighlight}>Wednesdays</Text>.
              Consider booking the quiet zone in the South Wing.
            </Text>
            <View style={styles.libraryStatus}>
              <View style={styles.statusHeader}>
                <Text style={styles.statusLabel}>Library Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>AVAILABLE</Text>
                </View>
              </View>
              <View style={styles.statusBar}>
                <View style={styles.statusProgress} />
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            <Pressable>
              <Text style={styles.downloadText}>Download PDF</Text>
            </Pressable>
          </View>
          <View style={styles.activityList}>
            {recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIconContainer, { backgroundColor: activity.bgColor }]}>
                    <MaterialIcons name={activity.icon} size={20} color={activity.textColor} style={styles.activityIcon} />
                  </View>
                  <View>
                    <Text style={styles.activityType}>
                      {activity.type === 'entry' ? 'Entry' : 'Exit'} - {activity.location}
                    </Text>
                    <Text style={styles.activityDate}>{activity.date}</Text>
                  </View>
                </View>
                <View style={styles.activityRight}>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                  <Text style={styles.activityVerified}>Verified</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  brandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  notificationButton: {
    padding: 8,
  },
  notificationIcon: {
    fontSize: 24,
    color: COLORS.onSurface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  heroSection: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.onPrimary,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.onPrimary,
    opacity: 0.9,
  },
  timeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginLeft: 16,
  },
  timeInfo: {
    marginRight: 12,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.onSurface,
    opacity: 0.7,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.onSurface,
  },
  timeIconContainer: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 8,
    padding: 8,
  },
  timeIcon: {
    fontSize: 20,
    color: COLORS.primary,
  },
  heroDecoration: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 100,
    height: 100,
    backgroundColor: COLORS.onPrimary,
    opacity: 0.1,
    borderRadius: 50,
  },
  bentoGrid: {
    marginBottom: 24,
  },
  trendsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  trendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  trendsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.onSurface,
  },
  viewBadge: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    marginTop: 20,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 24,
    backgroundColor: COLORS.outline,
    borderRadius: 4,
    marginBottom: 8,
  },
  barActive: {
    backgroundColor: COLORS.primary,
  },
  barLabel: {
    fontSize: 12,
    color: COLORS.onSurface,
    opacity: 0.7,
  },
  barLabelActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  insightCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryContainer,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  insightBadgeIcon: {
    fontSize: 16,
    color: COLORS.secondary,
    marginRight: 6,
  },
  insightBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.onSurface,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 20,
  },
  insightHighlight: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  libraryStatus: {
    marginTop: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.onSurface,
  },
  statusBadge: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.onSuccess,
  },
  statusBar: {
    height: 6,
    backgroundColor: COLORS.outline,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statusProgress: {
    height: '100%',
    width: '75%',
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },
  activitySection: {
    marginBottom: 24,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.onSurface,
  },
  downloadText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.onSurface,
  },
  activityDate: {
    fontSize: 12,
    color: COLORS.onSurface,
    opacity: 0.7,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.onSurface,
  },
  activityVerified: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: 'bold',
  },
});

export default AttendanceDashboardScreen;
