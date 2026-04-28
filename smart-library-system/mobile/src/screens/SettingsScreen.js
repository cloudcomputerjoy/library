import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../components/UI';
import { COLORS } from '../constants';

const settings = ['Account Preferences', 'Notifications', 'Privacy', 'Security', 'Help & FAQ'];

const SettingsScreen = () => {
  return (
    <ScreenWrapper>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.section}>
        {settings.map((item) => (
          <Pressable key={item} style={styles.settingItem}>
            <Text style={styles.settingText}>{item}</Text>
          </Pressable>
        ))}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 18,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 8,
  },
  settingItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainerLow,
  },
  settingText: {
    fontSize: 16,
    color: COLORS.onSurface,
    fontWeight: '700',
  },
});

export default SettingsScreen;
