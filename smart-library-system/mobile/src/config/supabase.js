/**
 * Supabase Client Configuration
 * Initializes Supabase client for React Native with proper auth handling
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase credentials from environment
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wwlcmewowcwsbeebalxh.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bGNtZXdvd2N3c2JlZWJhbHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODg2MDgsImV4cCI6MjA5MDg2NDYwOH0.TTMQs6QSe63HeBpKosFjp-F4RM1sWbL_exdOYNq0QY4';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required env vars: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Create Supabase client for React Native
 * Uses AsyncStorage for auth persistence
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Not applicable in React Native
    flowType: 'pkce', // Better security with PKCE flow
  },
  headers: {
    'X-Client-Info': 'library-app/1.0.0',
  },
});

/**
 * Export Supabase auth reference for convenience
 */
export const supabaseAuth = supabase.auth;

/**
 * Helper: Check if user is authenticated
 */
export const isUserAuthenticated = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

/**
 * Helper: Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Helper: Get current session
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * Helper: Refresh access token
 */
export const refreshAccessToken = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

/**
 * Setup auth state listener (subscribe to auth changes)
 * @param {Function} callback - Called with (user) on auth state change
 */
export const onAuthStateChanged = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log(`🔐 Auth event: ${event}`);
      callback(session?.user || null, session);
    }
  );

  // Return unsubscribe function
  return () => {
    subscription?.unsubscribe();
  };
};

export default supabase;
