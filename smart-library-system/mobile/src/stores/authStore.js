/**
 * Zustand Auth Store
 * Manages authentication state and user session across the mobile app
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as supabaseAuthService from '../services/supabaseAuthService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      lastAuthError: null,
      isRegistering: false,
      isLoggingIn: false,
      isResettingPassword: false,
      otpEmail: null,

      // Auth Actions
      /**
       * Register new user
       */
      register: async (email, password, userData = {}) => {
        set({ isRegistering: true, error: null });
        try {
          const { user, session, error } = await supabaseAuthService.register(
            email,
            password,
            userData
          );

          if (error) {
            set({ isRegistering: false, error: error.message, lastAuthError: error });
            return { success: false, error };
          }

          if (session) {
            set({
              user,
              session,
              isAuthenticated: true,
              isRegistering: false,
              error: null,
            });
          }

          return { success: true, user, session };
        } catch (err) {
          set({
            isRegistering: false,
            error: err.message,
            lastAuthError: err,
          });
          return { success: false, error: err };
        }
      },

      /**
       * Login user
       */
      login: async (email, password) => {
        set({ isLoggingIn: true, error: null });
        try {
          const { user, session, error } = await supabaseAuthService.login(
            email,
            password
          );

          if (error) {
            set({
              isLoggingIn: false,
              error: error.message,
              lastAuthError: error,
            });
            return { success: false, error };
          }

          set({
            user,
            session,
            isAuthenticated: true,
            isLoggingIn: false,
            error: null,
          });

          return { success: true, user, session };
        } catch (err) {
          set({
            isLoggingIn: false,
            error: err.message,
            lastAuthError: err,
          });
          return { success: false, error: err };
        }
      },

      /**
       * Request OTP for password reset
       */
      requestPasswordResetOTP: async (email) => {
        set({ isLoading: true, error: null });
        try {
          const { success, error } = await supabaseAuthService.requestPasswordResetOTP(email);

          if (!success) {
            set({ isLoading: false, error, lastAuthError: error });
            return { success: false, error };
          }

          set({ otpEmail: email, isLoading: false, error: null });
          return { success: true };
        } catch (err) {
          set({ isLoading: false, error: err.message, lastAuthError: err });
          return { success: false, error: err };
        }
      },

      /**
       * Verify OTP for password reset
       */
      verifyPasswordResetOTP: async (email, otp) => {
        set({ isLoading: true, error: null });
        try {
          const { resetToken, error } = await supabaseAuthService.verifyPasswordResetOTP(
            email,
            otp
          );

          if (error) {
            set({ isLoading: false, error, lastAuthError: error });
            return { success: false, resetToken: null, error };
          }

          set({ isLoading: false, error: null });
          return { success: true, resetToken };
        } catch (err) {
          set({ isLoading: false, error: err.message, lastAuthError: err });
          return { success: false, resetToken: null, error: err };
        }
      },

      /**
       * Reset password with token
       */
      resetPasswordWithToken: async (resetToken, newPassword) => {
        set({ isResettingPassword: true, error: null });
        try {
          const { success, error } = await supabaseAuthService.resetPasswordWithToken(
            resetToken,
            newPassword
          );

          if (!success) {
            set({
              isResettingPassword: false,
              error,
              lastAuthError: error,
            });
            return { success: false, error };
          }

          set({
            isResettingPassword: false,
            otpEmail: null,
            error: null,
          });

          return { success: true };
        } catch (err) {
          set({
            isResettingPassword: false,
            error: err.message,
            lastAuthError: err,
          });
          return { success: false, error: err };
        }
      },

      /**
       * Change password (requires current password)
       */
      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          const { success, error } = await supabaseAuthService.changePassword(
            currentPassword,
            newPassword
          );

          if (!success) {
            set({ isLoading: false, error, lastAuthError: error });
            return { success: false, error };
          }

          set({ isLoading: false, error: null });
          return { success: true };
        } catch (err) {
          set({ isLoading: false, error: err.message, lastAuthError: err });
          return { success: false, error: err };
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          const { success, error } = await supabaseAuthService.logout();

          if (!success) {
            set({ isLoading: false, error, lastAuthError: error });
            return { success: false, error };
          }

          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            otpEmail: null,
          });

          return { success: true };
        } catch (err) {
          set({ isLoading: false, error: err.message, lastAuthError: err });
          return { success: false, error: err };
        }
      },

      /**
       * Set user from session
       */
      setUser: (user) => set({ user }),

      /**
       * Set session
       */
      setSession: (session) => set({ session }),

      /**
       * Set loading state
       */
      setLoading: (isLoading) => set({ isLoading }),

      /**
       * Clear error
       */
      clearError: () => set({ error: null, lastAuthError: null }),

      /**
       * Refresh session
       */
      refreshSession: async () => {
        try {
          const { session, error } = await supabaseAuthService.refreshSession();

          if (error) {
            set({ error: error.message });
            return { success: false, error };
          }

          if (session) {
            set({ session, error: null });
          }

          return { success: true, session };
        } catch (err) {
          set({ error: err.message });
          return { success: false, error: err };
        }
      },

      /**
       * Initialize auth state (check if user is already logged in)
       */
      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          const session = await supabaseAuthService.getCurrentSession();
          const user = await supabaseAuthService.getCurrentUser();

          if (session && user) {
            set({
              user,
              session,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (err) {
          console.error('Error initializing auth:', err);
          set({ isLoading: false, error: err.message });
        }
      },

      /**
       * Subscribe to auth state changes
       */
      subscribeToAuthChanges: () => {
        return supabaseAuthService.subscribeToAuthChanges((user) => {
          set({
            user,
            isAuthenticated: !!user,
            error: null,
          });
        });
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
