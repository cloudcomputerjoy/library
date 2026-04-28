/**
 * Root App Component
 * Main entry point for the React Native app
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initializeSocket } from './src/services/socket';
import { initializePushNotifications } from './src/services/firebaseNotification';
import { useStore } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import GlobalHeader from './src/components/GlobalHeader';
import { COLORS } from './src/constants';
import * as logger from './src/utils/logger';
import useAuthStore from './src/stores/authStore';

// ✅ Navigation Ref (Correct way)
export const navigationRef = createNavigationContainerRef();

/**
 * Splash screen component
 */
const SplashScreen = () => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.primary,
    }}
  >
    <ActivityIndicator size="large" color={COLORS.white} />
  </View>
);

/**
 * Deep Linking Config (Production Ready)
 */
const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Home: 'home',
      Profile: 'profile/:id',
      Chat: 'chat/:roomId',
      Settings: 'settings',
    },
  },
};

/**
 * Root App Component
 */
export default function App() {
  const { authStore } = useStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let socket;

    const initializeApp = async () => {
      try {
        logger.info('Initializing app...', null, 'APP_INIT');

        // 🔹 Load token & user
        const token = await AsyncStorage.getItem('userToken');
        const user = await AsyncStorage.getItem('user');

        if (token && user) {
          logger.info('Restoring user session...', null, 'APP_INIT');

          authStore.setToken(token);

          // ✅ Safe JSON parse
          try {
            authStore.setUser(JSON.parse(user));
          } catch (err) {
            logger.error('User parse failed', err, 'APP_INIT');
            authStore.setUser(null);
          }

          // 🔹 Initialize socket
          try {
            socket = await initializeSocket(token);
            logger.info('Socket connected', null, 'SOCKET');
          } catch (err) {
            logger.error('Socket init failed', err, 'SOCKET');
          }

          // 🔹 Initialize push notifications (FCM)
          try {
            const pushNotificationsEnabled = await initializePushNotifications();
            if (pushNotificationsEnabled) {
              logger.info('Push notifications enabled', null, 'NOTIFICATIONS');
            } else {
              logger.info('Push notifications disabled (expected in Expo Go or Web)', null, 'NOTIFICATIONS');
            }
          } catch (err) {
            logger.error('Push notification init failed', err, 'NOTIFICATIONS');
          }
        }

        logger.info('App initialization complete', null, 'APP_INIT');
        setIsReady(true);
      } catch (error) {
        logger.error('App initialization error', error, 'APP_INIT');
        setIsReady(true);
      }
    };

    initializeApp();

    // ✅ Cleanup (VERY IMPORTANT)
    return () => {
      if (socket && socket.disconnect) {
        socket.disconnect();
        logger.info('Socket disconnected', null, 'SOCKET');
      }
    };
  }, []);

  // 🔹 Splash Screen
  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          {isAuthenticated ? <GlobalHeader onNotificationPress={() => {}} /> : null}
          <NavigationContainer
            ref={navigationRef}
            linking={linking}
            onReady={() => {
              logger.info('Navigation Ready', null, 'NAVIGATION');
            }}
            onStateChange={() => {
              const route = navigationRef.getCurrentRoute();
              logger.logNavigation('Route Change', route?.name);
            }}
          >
            <RootNavigator />
          </NavigationContainer>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
