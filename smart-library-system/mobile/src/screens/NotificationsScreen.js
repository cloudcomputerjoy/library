import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper, PrimaryButton, SecondaryButton } from '../components/UI';
import { COLORS } from '../constants';

const urgentNotifications = [
  {
    id: '1',
    title: 'Overdue Notice',
    detail: '"The Great Gatsby" was due yesterday. Please return it to the central library to avoid further fines.',
    time: 'Now',
    type: 'urgent',
    actions: ['Pay Fine', 'View Details'],
  },
];

const recentNotifications = [
  {
    id: '2',
    title: 'Book Successfully Returned',
    detail: 'Your return of "Design Systems for Scale" has been processed successfully.',
    time: '2h ago',
    type: 'success',
    icon: 'undo',
  },
  {
    id: '3',
    title: 'Reservation Available',
    detail: '"The Age of AI" is now available for pickup at the front desk. Reserved until Oct 24.',
    time: '5h ago',
    type: 'info',
    icon: 'local-library',
  },
  {
    id: '4',
    title: 'Payment Confirmed',
    detail: 'Your monthly subscription to Digital Archives has been renewed for $12.99.',
    time: 'Yesterday',
    type: 'success',
    icon: 'credit-card',
  },
  {
    id: '5',
    title: 'Library Holiday Hours',
    detail: 'The main campus library will be closed this Friday for maintenance. Study pods remain open 24/7.',
    time: '2d ago',
    type: 'info',
    icon: 'event',
  },
];

const NotificationsScreen = () => {
  const renderUrgentItem = ({ item }) => (
    <View style={styles.urgentCard}>
      <View style={styles.urgentHeader}>
        <View style={styles.urgentIcon}>
          <MaterialIcons name="warning" size={24} color={COLORS.error} style={styles.urgentIconText} />
        </View>
        <View style={styles.urgentContent}>
          <View style={styles.urgentTitleRow}>
            <Text style={styles.urgentTitle}>{item.title}</Text>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>{item.time}</Text>
            </View>
          </View>
          <Text style={styles.urgentDetail}>{item.detail}</Text>
          <View style={styles.urgentActions}>
            <PrimaryButton label={item.actions[0]} onPress={() => {}} style={styles.urgentButton} />
            <SecondaryButton label={item.actions[1]} onPress={() => {}} style={styles.urgentButton} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderRecentItem = ({ item }) => (
    <Pressable style={styles.recentCard}>
      <View style={styles.recentIcon}>
        <MaterialIcons name={item.icon} size={24} color={COLORS.primary} style={styles.recentIconText} />
      </View>
      <View style={styles.recentContent}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>{item.title}</Text>
          <Text style={styles.recentTime}>{item.time}</Text>
        </View>
        <Text style={styles.recentDetail}>{item.detail}</Text>
      </View>
    </Pressable>
  );

  return (
    <ScreenWrapper>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Stay updated with your academic journey and library activity.</Text>

      <Text style={styles.sectionTitle}>Urgent Attention</Text>
      <FlatList
        data={urgentNotifications}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={renderUrgentItem}
        contentContainerStyle={styles.urgentList}
      />

      <Text style={styles.sectionTitle}>Recent Updates</Text>
      <FlatList
        data={recentNotifications}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        renderItem={renderRecentItem}
        contentContainerStyle={styles.recentList}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  urgentList: {
    marginBottom: 16,
  },
  urgentCard: {
    backgroundColor: COLORS.errorContainer,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  urgentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  urgentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.onErrorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  urgentIconText: {
    fontSize: 20,
  },
  urgentContent: {
    flex: 1,
  },
  urgentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  urgentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onErrorContainer,
    flex: 1,
  },
  urgentBadge: {
    backgroundColor: COLORS.errorContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  urgentBadgeText: {
    color: COLORS.onErrorContainer,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  urgentDetail: {
    color: COLORS.onErrorContainer,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  urgentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  urgentButton: {
    flex: 1,
    paddingVertical: 10,
  },
  recentList: {
    paddingBottom: 20,
  },
  recentCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  recentIconText: {
    fontSize: 20,
  },
  recentContent: {
    flex: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    flex: 1,
  },
  recentTime: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
  },
  recentDetail: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default NotificationsScreen;

