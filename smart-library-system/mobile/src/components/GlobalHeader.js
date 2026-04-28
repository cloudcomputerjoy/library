import React, { useState, useEffect } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants';

const GlobalHeader = ({ onNotificationPress }) => {
  const { user } = useAuth();
  const [userData, setUserData] = useState({
    name: 'Student',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  });

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Student',
        avatar: user.user_metadata?.avatar_url || 'https://randomuser.me/api/portraits/men/32.jpg',
      });
    }
  }, [user]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        {/* Left */}
        <View style={styles.headerLeft}>
          <Image source={{ uri: userData.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.greeting}>Hi, {userData.name}</Text>
            <Text style={styles.subGreeting}>Welcome back</Text>
          </View>
        </View>

        {/* Right */}
        <Pressable style={styles.notificationButton} onPress={onNotificationPress}>
          <MaterialIcons name="notifications-none" size={22} color={COLORS.primary} />
          <View style={styles.notificationBadge} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default GlobalHeader;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.outlineVariant,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginRight: 8,
  },

  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },

  subGreeting: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },

  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryFixed,
  },

  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.error,
  },
});