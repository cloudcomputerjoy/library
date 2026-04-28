/**
 * Supabase Authentication Service
 * Handles all auth operations: registration, login, OTP, password reset, etc.
 */

import supabase from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
  OTP_EMAIL: 'auth_otp_email',
};

/**
 * Register new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} userData - Additional user data (firstName, lastName, phone, role)
 * @returns {Promise<{user, session, error}>}
 */
export const register = async (email, password, userData = {}) => {
  try {
    console.log('📝 Registering user:', email);

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          phone: userData.phone || '',
          role: userData.role || 'student',
          student_id: userData.studentId || null,
        },
        // Don't auto-login on signup (email verification required)
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error('❌ Registration error:', error.message);
      return { user: null, session: null, error };
    }

    // Store user and tokens if session exists
    if (data.session) {
      await saveSession(data.session);
      console.log('✅ User registered and logged in:', email);
    } else {
      console.log('✅ User registered. Email verification required.');
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('❌ Signup exception:', error.message);
    return { user: null, session: null, error };
  }
};

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user, session, error}>}
 */
export const login = async (email, password) => {
  try {
    console.log('🔓 Login attempt:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login error:', error.message);
      return { user: null, session: null, error };
    }

    // Save session and tokens
    if (data.session) {
      await saveSession(data.session);
      console.log('✅ Login successful:', email);
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('❌ Login exception:', error.message);
    return { user: null, session: null, error };
  }
};

/**
 * Request OTP for password reset
 * @param {string} email - User email
 * @returns {Promise<{success, error}>}
 */
export const requestPasswordResetOTP = async (email) => {
  try {
    console.log('📧 Requesting OTP for:', email);

    // Call backend endpoint
    const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ OTP request error:', data.message);
      return { success: false, error: data.message };
    }

    // Store email for OTP verification
    await AsyncStorage.setItem(STORAGE_KEYS.OTP_EMAIL, email);
    console.log('✅ OTP sent to:', email);

    return { success: true, error: null };
  } catch (error) {
    console.error('❌ OTP request exception:', error.message);
    return { success: false, error };
  }
};

/**
 * Verify OTP and get password reset token
 * @param {string} email - User email
 * @param {string} otp - OTP code from email
 * @returns {Promise<{resetToken, error}>}
 */
export const verifyPasswordResetOTP = async (email, otp) => {
  try {
    console.log('🔐 Verifying OTP for:', email);

    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ OTP verification error:', data.message);
      return { resetToken: null, error: data.message };
    }

    console.log('✅ OTP verified successfully');
    return { resetToken: data.resetToken, error: null };
  } catch (error) {
    console.error('❌ OTP verification exception:', error.message);
    return { resetToken: null, error };
  }
};

/**
 * Reset password with OTP-verified token
 * @param {string} resetToken - Token from OTP verification
 * @param {string} newPassword - New password
 * @returns {Promise<{success, error}>}
 */
export const resetPasswordWithToken = async (resetToken, newPassword) => {
  try {
    console.log('🔐 Resetting password with token');

    const response = await fetch(`${API_BASE_URL}/auth/reset-password-with-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Password reset error:', data.message);
      return { success: false, error: data.message };
    }

    // Clear stored OTP email
    await AsyncStorage.removeItem(STORAGE_KEYS.OTP_EMAIL);
    console.log('✅ Password reset successfully');

    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Password reset exception:', error.message);
    return { success: false, error };
  }
};

/**
 * Change password (requires current password)
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<{success, error}>}
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    console.log('🔐 Changing password');

    // Use Supabase updateUser for password change
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('❌ Password change error:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ Password changed successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Password change exception:', error.message);
    return { success: false, error };
  }
};

/**
 * Refresh access token
 * @returns {Promise<{session, error}>}
 */
export const refreshSession = async () => {
  try {
    console.log('🔄 Refreshing session');

    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('❌ Session refresh error:', error.message);
      return { session: null, error };
    }

    if (data.session) {
      await saveSession(data.session);
      console.log('✅ Session refreshed');
    }

    return { session: data.session, error: null };
  } catch (error) {
    console.error('❌ Session refresh exception:', error.message);
    return { session: null, error };
  }
};

/**
 * Logout user
 * @returns {Promise<{success, error}>}
 */
export const logout = async () => {
  try {
    console.log('🚪 Logging out');

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ Logout error:', error.message);
      return { success: false, error };
    }

    // Clear stored auth data
    await clearAuthStorage();
    console.log('✅ Logout successful');

    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Logout exception:', error.message);
    return { success: false, error };
  }
};

/**
 * Get current session
 * @returns {Promise<Session|null>}
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('❌ Error getting session:', error.message);
    return null;
  }
};

/**
 * Get current user
 * @returns {Promise<User|null>}
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('❌ Error getting user:', error.message);
    return null;
  }
};

/**
 * Get stored access token
 * @returns {Promise<string|null>}
 */
export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('❌ Error getting access token:', error.message);
    return null;
  }
};

/**
 * Save session tokens and user info
 * @param {Object} session - Supabase session object
 */
const saveSession = async (session) => {
  try {
    if (session?.access_token) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.access_token);
    }
    if (session?.refresh_token) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.refresh_token);
    }
    if (session?.user) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(session.user));
    }
  } catch (error) {
    console.error('❌ Error saving session:', error.message);
  }
};

/**
 * Clear all auth-related storage
 */
const clearAuthStorage = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('❌ Error clearing auth storage:', error.message);
  }
};

/**
 * Setup auth state listener
 * @param {Function} callback - Called with (user) on auth state change
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAuthChanges = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log(`🔐 Auth state changed: ${event}`);
      
      if (session) {
        await saveSession(session);
      } else {
        await clearAuthStorage();
      }
      
      callback(session?.user || null);
    }
  );

  return () => {
    subscription?.unsubscribe();
  };
};

export default {
  register,
  login,
  logout,
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPasswordWithToken,
  changePassword,
  refreshSession,
  getCurrentSession,
  getCurrentUser,
  getAccessToken,
  subscribeToAuthChanges,
};
