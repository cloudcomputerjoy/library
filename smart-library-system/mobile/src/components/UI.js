import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';

export const ScreenWrapper = ({ children, style, contentStyle }) => (
  <SafeAreaView style={[styles.wrapper, style]}>
    <ScrollView contentContainerStyle={[styles.content, contentStyle]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  </SafeAreaView>
);

export const SectionCard = ({ title, description, children, onPress }) => (
  <View style={styles.sectionCard}>
    {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
    {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
    {children}
    {onPress ? (
      <Pressable style={styles.linkButton} onPress={onPress}>
        <Text style={styles.linkText}>View details</Text>
      </Pressable>
    ) : null}
  </View>
);

export const PrimaryButton = ({ label, onPress, style }) => (
  <Pressable style={({ pressed }) => [styles.primaryButton, style, pressed && styles.primaryButtonPressed]} onPress={onPress}>
    <Text style={styles.primaryButtonText}>{label}</Text>
  </Pressable>
);

export const SecondaryButton = ({ label, onPress, style }) => (
  <Pressable style={({ pressed }) => [styles.secondaryButton, style, pressed && styles.secondaryButtonPressed]} onPress={onPress}>
    <Text style={styles.secondaryButtonText}>{label}</Text>
  </Pressable>
);

export const InputField = ({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType }) => (
  <View style={styles.inputGroup}>
    {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.gray}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
    />
  </View>
);

export const MiniBadge = ({ label }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{label}</Text>
  </View>
);

export const LargeBanner = ({ title, subtitle, icon }) => (
  <View style={styles.banner}> 
    {icon ? <Text style={styles.bannerIcon}>{icon}</Text> : null}
    <Text style={styles.bannerTitle}>{title}</Text>
    <Text style={styles.bannerSubtitle}>{subtitle}</Text>
  </View>
);

export const PremiumHeader = ({ greeting, subGreeting, avatarUri, onNotificationPress, notificationBadge }) => (
  <View style={styles.premiumHeader}>
    <View style={styles.headerLeft}>
      <Image
        source={{ uri: avatarUri || 'https://randomuser.me/api/portraits/women/68.jpg' }}
        style={styles.headerAvatar}
      />
      <View>
        <Text style={styles.headerGreeting}>{greeting || 'Hi, Joy'}</Text>
        <Text style={styles.headerSubGreeting}>{subGreeting || 'Welcome back to your library'}</Text>
      </View>
    </View>
    <Pressable style={styles.headerNotificationButton} onPress={onNotificationPress}>
      <MaterialIcons name="notifications-none" size={24} color={COLORS.primary} />
      {notificationBadge && <View style={styles.headerNotificationBadge} />}
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.onSurfaceVariant,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    color: COLORS.onSurfaceVariant,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: COLORS.onSurface,
    fontSize: 16,
  },
  linkButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondaryContainer,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  badgeText: {
    color: COLORS.onSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  banner: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  bannerIcon: {
    fontSize: 30,
    marginBottom: 10,
    color: COLORS.onPrimaryContainer,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.onPrimaryContainer,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: COLORS.onPrimaryContainer,
    lineHeight: 20,
  },
  // ========== PREMIUM HEADER STYLES ==========
  premiumHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.outlineVariant,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  headerGreeting: {
    fontWeight: '700',
    fontSize: 18,
    color: COLORS.onSurface,
    letterSpacing: -0.3,
  },
  headerSubGreeting: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
    marginTop: 2,
  },
  headerNotificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerNotificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerLowest,
  },
});
