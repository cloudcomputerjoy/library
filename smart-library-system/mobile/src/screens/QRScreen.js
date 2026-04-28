import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Image } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenWrapper } from '../components/UI';
import { COLORS, SCREEN_NAMES } from '../constants';

const infoItems = [
  { id: '1', label: 'Access Level', value: 'Level 4 Scholar' },
  { id: '2', label: 'Terminal ID', value: 'ATH-092-B' },
];

const QRScreen = ({ navigation }) => {
  return (
    <ScreenWrapper>

      <View style={styles.qrContainer}>
        <View style={styles.qrGraphic}>
          <MaterialIcons name="qr_code" size={120} color={COLORS.primary} style={styles.qrEmoji} />
        </View>
        <View style={styles.countdownBadge}>
          <Text style={styles.countdownText}>Refreshes in 12s</Text>
        </View>
      </View>

      <View style={styles.userCard}>
        <View style={styles.userIcon}>
          <MaterialIcons name="person" size={24} color={COLORS.white} style={styles.userIconText} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Julian Sterling</Text>
          <Text style={styles.userRole}>Postgraduate Fellow Â· Research Wing</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        {infoItems.map((item) => (
          <View key={item.id} style={styles.infoBox}>
            <Text style={styles.infoTitle}>{item.label}</Text>
            <Text style={styles.infoValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.actionButton} onPress={() => {}}>
          <Text style={styles.actionText}>Copy ID</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => {}}>
          <Text style={styles.actionText}>Share Access</Text>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  appSubtitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrGraphic: {
    width: 300,
    height: 300,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrEmoji: {
    marginBottom: 0,
  },
  countdownBadge: {
    marginTop: -24,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerLow,
  },
  countdownText: {
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  userIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  userIconText: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    color: COLORS.onSurface,
  },
  userRole: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  infoBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
  },
  infoTitle: {
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'center',
  },
  actionText: {
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  alertCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  alertText: {
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
});

export default QRScreen;
