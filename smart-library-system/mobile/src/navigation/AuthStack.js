/**
 * Auth Stack Navigator
 * Handles authentication flow with Supabase
 * Screens: Login, Signup, Forgot Password, OTP Verification
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OTPScreen from '../screens/OTPScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        gestureEnabled: false, // Prevent swiping back from login
      }}
      initialRouteName="Login"
    >
      {/* Login Screen */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          animationTypeForReplace: 'pop',
          cardStyle: { backgroundColor: '#fff' },
        }}
      />

      {/* Sign Up Screen */}
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{
          animationEnabled: true,
          animationTypeForReplace: 'pop',
        }}
      />

      {/* Forgot Password Screen */}
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          animationEnabled: true,
          gestureEnabled: true, // Allow back gesture on this screen
        }}
      />

      {/* OTP Verification Screen */}
      <Stack.Screen
        name="OTP"
        component={OTPScreen}
        options={{
          animationEnabled: true,
          gestureEnabled: false, // Don't allow back once OTP started
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
