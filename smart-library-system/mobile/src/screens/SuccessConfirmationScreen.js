import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/UI';
import { COLORS, SCREEN_NAMES } from '../constants';

const SuccessConfirmationScreen = ({ navigation }) => {
  return (
    <ScreenWrapper style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          <Pressable style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={COLORS.onSurfaceVariant} />
          </Pressable>
          <Text style={styles.topBarTitle}>Success</Text>
        </View>
        <Text style={styles.brandText}>ATHENEUM</Text>
      </View>

      <View style={styles.mainContent}>
        {/* Success Animation */}
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <View style={styles.confetti1} />
            <View style={styles.confetti2} />
            <View style={styles.confetti3} />
            <MaterialIcons name="check_circle" size={64} color="#22c55e" />
          </View>
        </View>

        {/* Headline & Subtext */}
        <View style={styles.textSection}>
          <Text style={styles.title}>Books Returned Successfully</Text>
          <Text style={styles.subtitle}>You have returned 3 books. Total fine: ৳80</Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.glassAccent} />
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Books processed</Text>
              <Text style={styles.summaryValue}>3</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount paid</Text>
              <Text style={styles.summaryValue}>৳80</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>Oct 25, 2023</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>View Receipt</Text>
          </Pressable>
        </View>

        {/* Recommendation */}
        <View style={styles.recommendationCard}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDDRwd8SDa2QRyeDrETaH9FomZ7sfkdlxDowX_j2mH6sDLyFNetnD4K85EqHUvohRCFFmvfTA7Oe2gveiA0WxKPf_BDDdFZGgYvvn2Ibq5vT7SjCEmendmhUGYPpHCoEashYcNiHkDP-n6scWceabAiw5antYSk-Rd7iM0Xy_2seOPzL-5qdEpQJUYfO31433lpgnwREWsi-dP46ynrNd50hOdN74owfHkUmI8TZWImUGYD-iRIFwhTqPjrqemPcHt465ZJZqBic0' }}
            style={styles.recommendationCover}
          />
          <View style={styles.recommendationInfo}>
            <Text style={styles.recommendationBadge}>Recommended for you</Text>
            <Text style={styles.recommendationTitle}>The Art of Innovation</Text>
            <Text style={styles.recommendationLocation}>Available at Wing C, Floor 2</Text>
          </View>
          <MaterialIcons name="arrow_forward_ios" size={20} color={COLORS.primary} style={styles.arrowIcon} />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  topBar: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: COLORS.onSurfaceVariant,
  },
  topBarTitle: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
  },
  brandText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  successContainer: {
    marginBottom: 40,
  },
  successCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  confetti1: {
    position: 'absolute',
    top: 16,
    left: 32,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    opacity: 0.4,
  },
  confetti2: {
    position: 'absolute',
    bottom: 24,
    right: 40,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#60a5fa',
    opacity: 0.3,
  },
  confetti3: {
    position: 'absolute',
    top: 40,
    right: 16,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a855f7',
    opacity: 0.4,
  },
  successIcon: {
    fontSize: 64,
    color: '#22c55e',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Manrope-Bold',
    fontSize: 28,
    color: COLORS.onSurface,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    padding: 32,
    marginBottom: 40,
    overflow: 'hidden',
  },
  glassAccent: {
    position: 'absolute',
    right: -32,
    top: -32,
    width: 96,
    height: 96,
    backgroundColor: COLORS.primaryContainer,
    opacity: 0.05,
    borderRadius: 48,
  },
  summaryContent: {
    gap: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
  },
  actionsSection: {
    width: '100%',
    gap: 16,
    marginBottom: 48,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    color: COLORS.onPrimary,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  recommendationCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recommendationCover: {
    width: 64,
    height: 80,
    borderRadius: 12,
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationBadge: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  recommendationTitle: {
    fontSize: 18,
    color: COLORS.onSurface,
    fontWeight: '700',
    marginBottom: 4,
  },
  recommendationLocation: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  arrowIcon: {
    fontSize: 20,
    color: COLORS.primary,
  },
});

export default SuccessConfirmationScreen;
