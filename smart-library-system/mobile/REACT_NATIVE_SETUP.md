# 📱 React Native Smart Library App - Complete Setup

## 🎯 Project Structure

```
mobile/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── OTPVerificationScreen.js
│   │   │   └── ForgotPasswordScreen.js
│   │   ├── home/
│   │   │   ├── HomeScreen.js
│   │   │   ├── DashboardScreen.js
│   │   │   └── QuickActionsScreen.js
│   │   ├── qr/
│   │   │   ├── QRCodeScreen.js
│   │   │   ├── QRScannerScreen.js
│   │   │   └── QRHistoryScreen.js
│   │   ├── books/
│   │   │   ├── BooksListScreen.js
│   │   │   ├── BookDetailsScreen.js
│   │   │   ├── BookSearchScreen.js
│   │   │   └── BookRecommendationsScreen.js
│   │   ├── transactions/
│   │   │   ├── IssuedBooksScreen.js
│   │   │   ├── ReservationScreen.js
│   │   │   ├── ReservationQueueScreen.js
│   │   │   └── TransactionHistoryScreen.js
│   │   ├── attendance/
│   │   │   ├── AttendanceScreen.js
│   │   │   ├── EntryExitHistoryScreen.js
│   │   │   └── LiveStatusScreen.js
│   │   ├── fines/
│   │   │   ├── FinesScreen.js
│   │   │   ├── PaymentScreen.js
│   │   │   ├── PaymentSuccessScreen.js
│   │   │   └── WaiverRequestScreen.js
│   │   ├── files/
│   │   │   ├── FileShareScreen.js
│   │   │   ├── FileUploadScreen.js
│   │   │   ├── FileListScreen.js
│   │   │   ├── PrintJobsScreen.js
│   │   │   └── PrintStatusScreen.js
│   │   ├── profile/
│   │   │   ├── ProfileScreen.js
│   │   │   ├── EditProfileScreen.js
│   │   │   ├── ActivityHistoryScreen.js
│   │   │   ├── QRIDCardScreen.js
│   │   │   └── APIKeysScreen.js
│   │   ├── notifications/
│   │   │   ├── NotificationsScreen.js
│   │   │   └── NotificationDetailsScreen.js
│   │   └── settings/
│   │       ├── SettingsScreen.js
│   │       ├── LanguageScreen.js
│   │       └── HelpScreen.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.js
│   │   │   ├── Button.js
│   │   │   ├── Card.js
│   │   │   ├── Loading.js
│   │   │   ├── ErrorMessage.js
│   │   │   ├── SuccessMessage.js
│   │   │   ├── EmptyState.js
│   │   │   └── Modal.js
│   │   ├── qr/
│   │   │   ├── QRCodeDisplay.js
│   │   │   ├── QRScanner.js
│   │   │   └── QRRefreshTimer.js
│   │   ├── forms/
│   │   │   ├── LoginForm.js
│   │   │   ├── RegisterForm.js
│   │   │   ├── SearchForm.js
│   │   │   └── FileUploadForm.js
│   │   ├── book/
│   │   │   ├── BookCard.js
│   │   │   ├── BookRating.js
│   │   │   ├── AvailabilityBadge.js
│   │   │   └── BookActionButtons.js
│   │   ├── transaction/
│   │   │   ├── IssuedBookItem.js
│   │   │   ├── DueReminder.js
│   │   │   ├── ReservationCard.js
│   │   │   └── OverdueAlert.js
│   │   ├── attendance/
│   │   │   ├── EntryExitLog.js
│   │   │   ├── TimeTracking.js
│   │   │   └── LiveStatus.js
│   │   └── dashboard/
│   │       ├── StatsCard.js
│   │       ├── AlertsPanel.js
│   │       └── QuickActions.js
│   ├── navigation/
│   │   ├── AuthNavigator.js
│   │   ├── AppNavigator.js
│   │   ├── BookNavigator.js
│   │   ├── ProfileNavigator.js
│   │   ├── BottomTabNavigator.js
│   │   └── RootNavigator.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── bookService.js
│   │   ├── qrService.js
│   │   ├── attendanceService.js
│   │   ├── transactionService.js
│   │   ├── fileService.js
│   │   ├── notificationService.js
│   │   └── socketService.js
│   ├── redux/
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   ├── bookSlice.js
│   │   │   ├── transactionSlice.js
│   │   │   ├── attendanceSlice.js
│   │   │   ├── userSlice.js
│   │   │   ├── notificationSlice.js
│   │   │   └── settingsSlice.js
│   │   ├── store.js
│   │   └── hooks.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── storage.js
│   │   ├── permissions.js
│   │   └── logger.js
│   ├── styles/
│   │   ├── colors.js
│   │   ├── fonts.js
│   │   ├── spacing.js
│   │   └── globalStyles.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useQR.js
│   │   ├── useBooks.js
│   │   ├── useNotifications.js
│   │   └── useSocket.js
│   └── App.js
├── android/
├── ios/
├── package.json
├── app.json
├── .env
├── .env.example
├── babel.config.js
├── metro.config.js
├── tsconfig.json
└── README.md
```

## 📦 Installation & Setup

### 1. Create Expo Project
```bash
npx create-expo-app smart-library
cd smart-library
```

### 2. Install Core Dependencies
```bash
# React Native & Navigation
npx expo install expo-router
npx expo install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npx expo install react-native-gesture-handler

# State Management
npm install @reduxjs/toolkit react-redux

# API & HTTP
npm install axios
npm install socket.io-client

# QR Code
npm install react-native-qrcode-svg
npx expo install expo-barcode-scanner
npx expo install expo-camera

# Camera & File Picker
npx expo install expo-image-picker
npx expo install expo-document-picker

# Authentication
npx expo install expo-secure-store
npm install @supabase/supabase-js

# UI Components
npm install react-native-paper
npm install react-native-vector-icons
npm install lottie-react-native

# Forms & Validation
npm install react-hook-form yup

# Local Storage
npx expo install expo-sqlite
npm install async-storage

# Date/Time
npm install moment dayjs

# File Upload
npx expo install expo-file-system

# Toast Notifications
npm install react-native-toast-message

# Analytics
npx expo install expo-analytics

# Dev Tools
npm install --save-dev eslint prettier

```

### 3. Environment Setup
```bash
# Create .env file
echo "REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your_anon_key
REACT_APP_SOCKET_URL=http://localhost:3000" > .env
```

## 🔑 Core Implementation Files

### src/services/api.js
```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        const response = await api.post('/auth/refresh-token', { refresh_token: refreshToken });
        
        await AsyncStorage.setItem('access_token', response.data.access_token);
        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        throw refreshError;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### src/services/qrService.js
```javascript
import api from './api';
import { Alert } from 'react-native';

class QRService {
  async generateDynamicQR() {
    try {
      const response = await api.post('/qr/generate');
      return response.data;
    } catch (error) {
      Alert.alert('Error', 'Failed to generate QR code');
      throw error;
    }
  }
  
  async validateQRToken(qrToken) {
    try {
      const response = await api.post('/qr/validate', {
        qr_token: qrToken
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  async getQRHistory() {
    try {
      const response = await api.get('/qr/history?limit=10');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new QRService();
```

### src/components/qr/QRCodeDisplay.js
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export const QRCodeDisplay = ({ qrData, expiresIn }) => {
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowRefreshPrompt(true);
          return expiresIn;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expiresIn]);
  
  return (
    <View style={{ alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        Expires in: {timeLeft}s
      </Text>
      
      <QRCode
        value={JSON.stringify(qrData)}
        size={300}
        color="black"
        backgroundColor="white"
        logo={require('../../assets/logo.png')}
        logoSize={60}
        logoBackgroundColor="transparent"
      />
      
      {showRefreshPrompt && (
        <Text style={{ color: 'red', marginTop: 10 }}>
          QR Code expiring soon. Refresh to get a new one.
        </Text>
      )}
    </View>
  );
};

export default QRCodeDisplay;
```

### src/hooks/useQR.js
```javascript
import { useState, useCallback, useEffect } from 'react';
import qrService from '../services/qrService';

export const useQR = () => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expiresIn, setExpiresIn] = useState(15);
  
  const generateQR = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await qrService.generateDynamicQR();
      setQrData(data.qr_data);
      setExpiresIn(data.expires_in);
      
      // Auto-refresh QR before expiry
      setTimeout(() => {
        generateQR();
      }, (data.expires_in - 2) * 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    generateQR();
  }, [generateQR]);
  
  return { qrData, loading, error, expiresIn, regenerateQR: generateQR };
};

export default useQR;
```

### src/screens/qr/QRCodeScreen.js
```javascript
import React from 'react';
import { View, TouchableOpacity, Text, BackHandler } from 'react-native';
import { useQR } from '../../hooks/useQR';
import { QRCodeDisplay } from '../../components/qr/QRCodeDisplay';
import { ActivityIndicator } from 'react-native-paper';

const QRCodeScreen = ({ navigation }) => {
  const { qrData, loading, error, expiresIn, regenerateQR } = useQR();
  
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prevent back button in QR screen
      return true;
    });
    
    return () => backHandler.remove();
  }, []);
  
  if (loading && !qrData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Generating QR code...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', marginBottom: 10 }}>Error: {error}</Text>
        <TouchableOpacity onPress={regenerateQR}>
          <Text style={{ color: 'blue', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      {qrData && (
        <QRCodeDisplay qrData={qrData} expiresIn={expiresIn} />
      )}
      
      <View style={{ flexDirection: 'row', marginTop: 30, gap: 10 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('QRScanner')}
          style={{
            backgroundColor: '#007AFF',
            paddingVertical: 12,
            paddingHorizontal: 30,
            borderRadius: 8
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Scan for Exit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={regenerateQR}
          style={{
            backgroundColor: '#34C759',
            paddingVertical: 12,
            paddingHorizontal: 30,
            borderRadius: 8
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QRCodeScreen;
```

### src/components/qr/QRScanner.js
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useAppDispatch } from '../../redux/hooks';

export const QRScanner = ({ onScan, scanType = 'exit' }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  
  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    
    try {
      const qrData = JSON.parse(data);
      onScan(qrData, scanType);
    } catch (error) {
      Alert.alert('Error', 'Invalid QR code');
      setScanned(false);
    }
  };
  
  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  
  return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={{ flex: 1 }}
      />
      
      {scanned && (
        <TouchableOpacity
          onPress={() => setScanned(false)}
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: '#007AFF',
            paddingVertical: 12,
            borderRadius: 8
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Tap to Scan Again
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default QRScanner;
```

### src/redux/slices/authSlice.js
```javascript
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      state.isAuthenticated = true;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setAuth, logout, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
```

### src/hooks/useSocket.js
```javascript
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { useAppDispatch } from '../redux/hooks';
import { addNotification } from '../redux/slices/notificationSlice';

export const useSocket = (userId) => {
  const socketRef = useRef(null);
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current.emit('subscribe_notifications', userId);
    });
    
    // Listen for notifications
    socketRef.current.on('book_available', (data) => {
      dispatch(addNotification({
        title: 'Book Available',
        message: `${data.book_title} is now available`,
        type: 'book_available'
      }));
    });
    
    socketRef.current.on('entry_success', (data) => {
      dispatch(addNotification({
        title: 'Entry Recorded',
        message: `Entry at ${data.location}`,
        type: 'entry'
      }));
    });
    
    socketRef.current.on('exit_success', (data) => {
      dispatch(addNotification({
        title: 'Exit Recorded',
        message: `You spent ${data.duration_inside} inside`,
        type: 'exit'
      }));
    });
    
    socketRef.current.on('print_ready', (data) => {
      dispatch(addNotification({
        title: 'Print Ready',
        message: 'Your print is ready for collection',
        type: 'print_ready'
      }));
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId, dispatch]);
  
  return socketRef.current;
};

export default useSocket;
```

## 🎯 Key Features Implementation

### Dynamic QR Code Refresh (Every 10-15 seconds)
```javascript
// Automatic refresh implemented in useQR hook
// QR token expires in 15 seconds
// Auto-refresh triggers 2 seconds before expiry
// Smooth transition with new QR display
```

### Real-Time Entry/Exit with Socket.IO
```javascript
// Immediate feedback via Socket.IO
// Live occupancy updates
// Automatic notification dispatch
// Activity history updates in real-time
```

### File Sharing with Auto-Delete
```javascript
// Backend sets auto_delete_at to 30 minutes from upload
// Scheduled job checks and deletes expired files
// User can manually delete before auto-cleanup
// Delete confirmation with toast message
```

### Print Management with Tracking
```javascript
// Print job created with status tracking
// Real-time updates via Socket.IO
// Admin approval workflow
// Collection receipt generation
// Print history with details
```

## 📱 Navigation Structure

### Root Navigator (Authentication Check)
```javascript
// Redirects to Auth Stack or App Stack based on login status
```

### Auth Stack
```javascript
// Login Screen → Register Screen → OTP Verification → Home
```

### App Stack (Bottom Tab Navigator)
```javascript
// Home Tab → Books Tab → Attendance Tab → Files Tab → Profile Tab
```

## 🔐 Security Best Practices

1. **Secure Token Storage**
   - Use Expo Secure Store for tokens
   - Clear tokens on logout
   - Auto-refresh before expiry

2. **API Security**
   - JWT authentication
   - HTTPS only
   - Request signing with API keys

3. **Data Privacy**
   - Encrypt sensitive data at rest
   - Secure WebSocket connection
   - Permission-based feature access

## 📊 Testing Setup

```bash
npm install --save-dev jest @testing-library/react-native
npm install --save-dev @testing-library/jest-native
```

## 🚀 Build & Deploy

```bash
# Expo Build
eas build --platform android --profile production
eas build --platform ios --profile production

# Or Build Locally
npx react-native build-android
npx react-native build-ios
```

## 🔗 Important Notes

- **QR Expiry:** 15 seconds (configurable via settings)
- **QR Refresh:** Every 10 seconds
- **Socket.IO:** Real-time updates for entry/exit/notifications
- **File Auto-Delete:** 30 minutes from creation
- **RFID Integration:** Handled through API endpoints
- **Print Processing:** Queued with admin approval workflow

