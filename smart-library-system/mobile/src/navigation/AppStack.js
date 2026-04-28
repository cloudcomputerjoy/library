/**
 * App Stack Navigator
 * Main navigation for authenticated users
 * Bottom tab navigation with nested stack navigators for each tab
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Custom Components
import CustomBottomTab from '../components/CustomBottomTab';

// Constants
import { TABS, SCREEN_NAMES } from '../constants';

// Main Screens
import PremiumDashboardScreen from '../screens/PremiumDashboardScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import BookSearchScreen from '../screens/BookSearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Book/Transaction Screens
import IssueBooksScreen from '../screens/IssueBooksScreen';
import ReturnBooksScreen from '../screens/ReturnBooksScreen';
import ReturnHistoryScreen from '../screens/ReturnHistoryScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import BiometricVerificationScreen from '../screens/BiometricVerificationScreen';

// Payment & Fines
import PaymentFinesScreen from '../screens/PaymentFinesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// Other Screens
import FileSharingScreen from '../screens/FileSharingScreen';
import PrintPortalScreen from '../screens/PrintPortalScreen';
import SuccessConfirmationScreen from '../screens/SuccessConfirmationScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack Navigator
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
    }}
  >
    <Stack.Screen name="HomeMain" component={PremiumDashboardScreen} />
    <Stack.Screen name="IssueBooksDetail" component={IssueBooksScreen} />
    <Stack.Screen name="ReturnBooksDetail" component={ReturnBooksScreen} />
    <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
  </Stack.Navigator>
);

// QR Scanner Stack Navigator
const QRStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="QRMain" component={QRScannerScreen} />
    <Stack.Screen name="BiometricVerification" component={BiometricVerificationScreen} />
    <Stack.Screen name="QRResult" component={SuccessConfirmationScreen} />
  </Stack.Navigator>
);

// Books Stack Navigator
const BooksStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BooksMain" component={BookSearchScreen} />
    <Stack.Screen name="BookDetail" component={BookSearchScreen} />
    <Stack.Screen name="ReturnHistory" component={ReturnHistoryScreen} />
  </Stack.Navigator>
);

// Print Stack Navigator
const PrintStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PrintMain" component={PrintPortalScreen} />
    <Stack.Screen name="FileSharing" component={FileSharingScreen} />
  </Stack.Navigator>
);

// Profile Stack Navigator
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="ProfileSettings" component={SettingsScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="PaymentFines" component={PaymentFinesScreen} />
    <Stack.Screen name="FileSharing" component={FileSharingScreen} />
    <Stack.Screen name="PrintPortal" component={PrintPortalScreen} />
  </Stack.Navigator>
);

// Main App Stack with Bottom Tab Navigation
const AppStack = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTab {...props} />}
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
      initialRouteName={TABS.HOME}
    >
      <Tab.Screen
        name={TABS.HOME}
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarTestID: 'HomeNavigation',
        }}
      />

      <Tab.Screen
        name={TABS.QR}
        component={QRStack}
        options={{
          tabBarLabel: 'QR',
          tabBarTestID: 'QRNavigation',
        }}
      />

      <Tab.Screen
        name={TABS.BOOKS}
        component={BooksStack}
        options={{
          tabBarLabel: 'Books',
          tabBarTestID: 'BooksNavigation',
        }}
      />

      <Tab.Screen
        name={TABS.FILES}
        component={PrintStack}
        options={{
          tabBarLabel: 'Print',
          tabBarTestID: 'FilesNavigation',
        }}
      />

      <Tab.Screen
        name={SCREEN_NAMES.Profile}
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarTestID: 'ProfileNavigation',
        }}
      />
    </Tab.Navigator>
  );
};

export default AppStack;
