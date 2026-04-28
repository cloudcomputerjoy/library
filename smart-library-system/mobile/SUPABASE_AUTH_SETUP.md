# Mobile Supabase Authentication Setup Guide

## Overview

This guide explains how to use Supabase Authentication in the Smart Library mobile app. The authentication system provides:

- Email/Password registration and login
- Secure session management with automatic token refresh
- OTP-based password reset via email
- Persistent session storage using AsyncStorage
- Real-time auth state changes
- Type-safe authentication with TypeScript types

---

## 📦 Installation & Setup

### 1. **Install Dependencies**

The Supabase client and required dependencies should already be installed:

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage zustand
```

### 2. **Configure Environment Variables**

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Update `.env.local`:
```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://wwlcmewowcwsbeebalxh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Backend API (for OTP and custom endpoints)
EXPO_PUBLIC_API_URL=http://localhost:3000

# Enable Supabase Auth
EXPO_PUBLIC_USE_SUPABASE_AUTH=true
```

### 3. **Wrap App with Auth Provider**

In your `App.js` or `index.js`, wrap your navigation with auth initialization:

```javascript
import React, { useEffect } from 'react';
import useAuthStore from './src/stores/authStore';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const subscribeToAuthChanges = useAuthStore((state) => state.subscribeToAuthChanges);

  useEffect(() => {
    // Initialize auth state when app starts
    initializeAuth();

    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthChanges();
    return unsubscribe;
  }, []);

  return <RootNavigator />;
}
```

---

## 🔐 Authentication Flows

### ✅ **1. User Registration**

```javascript
import useAuthStore from './src/stores/authStore';

function RegisterScreen() {
  const register = useAuthStore((state) => state.register);
  const isRegistering = useAuthStore((state) => state.isRegistering);
  const error = useAuthStore((state) => state.error);

  const handleRegister = async () => {
    const result = await register('user@example.com', 'password123', {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'student',
      studentId: 'STU123',
    });

    if (result.success) {
      // User registered successfully!
      // Navigate to home or email verification screen
    } else {
      // Show error message
      console.error('Registration failed:', error);
    }
  };

  return (
    <TouchableOpacity onPress={handleRegister} disabled={isRegistering}>
      <Text>{isRegistering ? 'Registering...' : 'Register'}</Text>
    </TouchableOpacity>
  );
}
```

### 🔓 **2. User Login**

```javascript
function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);
  const error = useAuthStore((state) => state.error);

  const handleLogin = async () => {
    const result = await login('user@example.com', 'password123');

    if (result.success) {
      // User logged in successfully!
      // Navigation will automatically update
    } else {
      console.error('Login failed:', error);
    }
  };

  return (
    <TouchableOpacity onPress={handleLogin} disabled={isLoggingIn}>
      <Text>{isLoggingIn ? 'Signing in...' : 'Sign In'}</Text>
    </TouchableOpacity>
  );
}
```

### 📧 **3. Password Reset (OTP Flow)**

**Step 1: Request OTP**

```javascript
function ForgotPasswordScreen() {
  const requestPasswordResetOTP = useAuthStore((state) => state.requestPasswordResetOTP);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleRequestOTP = async () => {
    const result = await requestPasswordResetOTP('user@example.com');

    if (result.success) {
      // OTP sent! Show OTP verification screen
      navigation.navigate('VerifyOTP');
    }
  };

  return (
    <TouchableOpacity onPress={handleRequestOTP} disabled={isLoading}>
      <Text>Send OTP</Text>
    </TouchableOpacity>
  );
}
```

**Step 2: Verify OTP**

```javascript
function VerifyOTPScreen() {
  const verifyPasswordResetOTP = useAuthStore((state) => state.verifyPasswordResetOTP);
  const [otp, setOTP] = useState('');
  const [resetToken, setResetToken] = useState(null);

  const handleVerifyOTP = async () => {
    const result = await verifyPasswordResetOTP('user@example.com', otp);

    if (result.success) {
      // OTP verified! Go to password reset screen
      setResetToken(result.resetToken);
      navigation.navigate('ResetPassword', { resetToken });
    }
  };

  return (
    <>
      <TextInput 
        placeholder="Enter 6-digit OTP" 
        value={otp}
        onChangeText={setOTP}
      />
      <TouchableOpacity onPress={handleVerifyOTP}>
        <Text>Verify OTP</Text>
      </TouchableOpacity>
    </>
  );
}
```

**Step 3: Reset Password**

```javascript
function ResetPasswordScreen({ route }) {
  const { resetToken } = route.params;
  const resetPasswordWithToken = useAuthStore((state) => state.resetPasswordWithToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const result = await resetPasswordWithToken(resetToken, newPassword);

    if (result.success) {
      // Password reset successfully!
      navigation.navigate('Login');
    }
  };

  return (
    <>
      <TextInput 
        placeholder="New Password" 
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput 
        placeholder="Confirm Password" 
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity onPress={handleResetPassword}>
        <Text>Reset Password</Text>
      </TouchableOpacity>
    </>
  );
}
```

### 🚪 **4. Logout**

```javascript
function ProfileScreen() {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    const result = await logout();
    
    if (result.success) {
      // Logged out successfully
      // Navigation will automatically update
    }
  };

  return (
    <TouchableOpacity onPress={handleLogout}>
      <Text>Logout</Text>
    </TouchableOpacity>
  );
}
```

---

## 🎣 **Using Auth State in Components**

### Get Current User

```javascript
import useAuthStore from './src/stores/authStore';

function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Text>Please log in</Text>;
  }

  return <Text>Welcome, {user?.email}!</Text>;
}
```

### Protected Route Example

```javascript
import useAuthStore from './src/stores/authStore';

function ProtectedComponent() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <MainContent />;
}
```

---

## 🔄 **Advanced Usage**

### Subscribe to Auth Changes

```javascript
useEffect(() => {
  const unsubscribe = useAuthStore
    .getState()
    .subscribeToAuthChanges((user) => {
      if (user) {
        console.log('User logged in:', user.email);
      } else {
        console.log('User logged out');
      }
    });

  return unsubscribe;
}, []);
```

### Refresh Session

```javascript
const refreshSession = useAuthStore((state) => state.refreshSession);

const handleRefreshSession = async () => {
  const result = await refreshSession();
  
  if (result.success) {
    console.log('Session refreshed');
  } else {
    console.error('Failed to refresh session');
  }
};
```

### Change Password (Logged In User)

```javascript
const changePassword = useAuthStore((state) => state.changePassword);

const handleChangePassword = async () => {
  const result = await changePassword('oldPassword', 'newPassword');
  
  if (result.success) {
    console.log('Password changed');
  }
};
```

---

## 🚨 **Error Handling**

The auth store provides error information:

```javascript
function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const lastAuthError = useAuthStore((state) => state.lastAuthError);
  const clearError = useAuthStore((state) => state.clearError);

  const handleLogin = async () => {
    const result = await login(email, password);
    
    if (!result.success) {
      // Error is automatically set in store
      // Display error message
      <Text style={{ color: 'red' }}>{error}</Text>
    }
  };

  return (
    <>
      {error && (
        <View>
          <Text style={{ color: 'red' }}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Rest of form */}
    </>
  );
}
```

---

## 📝 **Common Errors & Solutions**

### `Missing Supabase credentials`
- Ensure `.env.local` has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart Expo dev server after updating `.env`

### `User already exists`
- Email is already registered in Supabase
- Use a different email or reset password

### `Invalid OTP`
- OTP may be expired (valid for 10 minutes)
- OTP code is case-sensitive
- Request a new OTP if needed

### `Session not found`
- User may have been logged out
- Token may have expired
- Try logging in again

---

## 🔗 **Related Documentation**

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Zustand Store Docs](https://github.com/pmndrs/zustand)
- [Backend OTP Endpoints](../backend/BACKEND_OTP_SETUP.md)
- [API Integration](./src/services/api.js)

---

## ✅ **Checklist for Implementation**

- [ ] Install `@supabase/supabase-js`
- [ ] Copy `.env.example` to `.env.local`
- [ ] Update Supabase credentials in `.env.local`
- [ ] Import and initialize auth in App.js
- [ ] Create login/register screens using auth store
- [ ] Create password reset screens (OTP flow)
- [ ] Implement protected routes
- [ ] Test all auth flows
- [ ] Set up error handling and user feedback

---

**Last Updated**: April 2026
**Status**: Ready for Implementation
