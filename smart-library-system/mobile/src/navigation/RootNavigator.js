/**
 * Root Navigator - Entry point for navigation
 * Manages authentication state and routes between AuthStack and AppStack
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import useAuthStore from '../stores/authStore';
import AuthStack from './AuthStack';
import AppStack from './AppStack';

const RootNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const setupAuth = async () => {
      await initializeAuth();
      setAuthReady(true);
    };

    setupAuth();
  }, [initializeAuth]);

  // Show loading screen while initializing auth
  if (!authReady || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Route based on authentication state
  return isAuthenticated ? <AppStack /> : <AuthStack />;
};

export default RootNavigator;
