import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenWrapper, PrimaryButton } from '../components/UI';
import { COLORS } from '../constants';

const ContactSupportScreen = () => {
  return (
    <ScreenWrapper>
      <Text style={styles.heroTitle}>
        How can we <Text style={styles.heroAccent}>assist you</Text> today?
      </Text>

      <View style={styles.supportCards}>
        <View style={styles.liveChatCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="chat_bubble" size={24} color={COLORS.onPrimaryContainer} />
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>Live Chat</Text>
          <Text style={styles.cardText}>Connect with an AI curator instantly for quick questions about the campus system.</Text>
          <PrimaryButton label="Start Chat" onPress={() => {}} style={styles.chatButton} />
        </View>

        <Pressable style={styles.supportCard}>
          <View style={styles.cardRow}>
            <View style={styles.iconCircleSecondary}>
              <MaterialIcons name="phone" size={20} color={COLORS.onPrimaryContainer} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitleSecondary}>Call Support</Text>
              <Text style={styles.cardTextSecondary}>Available 24/7 for urgent campus issues.</Text>
            </View>
          </View>
        </Pressable>

        <Pressable style={styles.supportCard}>
          <View style={styles.cardRow}>
            <View style={styles.iconCircleTertiary}>
              <MaterialIcons name="email" size={20} color={COLORS.onPrimaryContainer} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitleSecondary}>Email Us</Text>
              <Text style={styles.cardTextSecondary}>Typical response within 2 hours.</Text>
            </View>
          </View>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: '90%',
  },
  heroAccent: {
    color: COLORS.secondary,
  },
  supportCards: {
    gap: 16,
  },
  liveChatCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 28,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    alignSelf: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tertiaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.tertiary,
    marginRight: 6,
  },
  liveText: {
    color: COLORS.onTertiaryContainer,
    fontWeight: '700',
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 8,
  },
  cardText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  chatButton: {
    width: 'auto',
    paddingHorizontal: 24,
  },
  supportCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 28,
    padding: 20,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircleSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconSecondary: {
    marginRight: 0,
  },
  iconCircleTertiary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconTertiary: {
    marginRight: 0,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleSecondary: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  cardTextSecondary: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
});

export default ContactSupportScreen;

