/**
 * Custom Auth Hooks
 * Convenient hooks for auth operations in React components
 */

import { useEffect, useCallback, useState } from 'react';
import useAuthStore from '../stores/authStore';

/**
 * Hook to use auth state (user, isAuthenticated, etc.)
 * @returns {Object} Auth state and helpers
 */
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    error,
    clearError,
  };
};

/**
 * Hook for login functionality
 * @returns {Object} Login function and loading state
 */
export const useLogin = () => {
  const login = useAuthStore((state) => state.login);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const handleLogin = useCallback(
    async (email, password) => {
      clearError();
      return login(email, password);
    },
    [login, clearError]
  );

  return {
    login: handleLogin,
    isLoggingIn,
    error,
    clearError,
  };
};

/**
 * Hook for registration functionality
 * @returns {Object} Register function and loading state
 */
export const useRegister = () => {
  const register = useAuthStore((state) => state.register);
  const isRegistering = useAuthStore((state) => state.isRegistering);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const handleRegister = useCallback(
    async (email, password, userData) => {
      clearError();
      return register(email, password, userData);
    },
    [register, clearError]
  );

  return {
    register: handleRegister,
    isRegistering,
    error,
    clearError,
  };
};

/**
 * Hook for password reset (OTP flow)
 * @returns {Object} OTP functions and loading state
 */
export const usePasswordReset = () => {
  const requestOTP = useAuthStore((state) => state.requestPasswordResetOTP);
  const verifyOTP = useAuthStore((state) => state.verifyPasswordResetOTP);
  const resetPassword = useAuthStore((state) => state.resetPasswordWithToken);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isResettingPassword = useAuthStore((state) => state.isResettingPassword);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const otpEmail = useAuthStore((state) => state.otpEmail);

  const handleRequestOTP = useCallback(
    async (email) => {
      clearError();
      return requestOTP(email);
    },
    [requestOTP, clearError]
  );

  const handleVerifyOTP = useCallback(
    async (email, otp) => {
      clearError();
      return verifyOTP(email, otp);
    },
    [verifyOTP, clearError]
  );

  const handleResetPassword = useCallback(
    async (resetToken, newPassword) => {
      clearError();
      return resetPassword(resetToken, newPassword);
    },
    [resetPassword, clearError]
  );

  return {
    requestOTP: handleRequestOTP,
    verifyOTP: handleVerifyOTP,
    resetPassword: handleResetPassword,
    isLoading,
    isResettingPassword,
    error,
    clearError,
    otpEmail,
  };
};

/**
 * Hook for logout functionality
 * @returns {Object} Logout function and loading state
 */
export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const handleLogout = useCallback(async () => {
    return logout();
  }, [logout]);

  return {
    logout: handleLogout,
    isLoading,
    error,
  };
};

/**
 * Hook for change password functionality
 * @returns {Object} Change password function and loading state
 */
export const useChangePassword = () => {
  const changePassword = useAuthStore((state) => state.changePassword);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const handleChangePassword = useCallback(
    async (currentPassword, newPassword) => {
      clearError();
      return changePassword(currentPassword, newPassword);
    },
    [changePassword, clearError]
  );

  return {
    changePassword: handleChangePassword,
    isLoading,
    error,
    clearError,
  };
};

/**
 * Hook for session management
 * @returns {Object} Session functions and state
 */
export const useSession = () => {
  const session = useAuthStore((state) => state.session);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const handleRefreshSession = useCallback(async () => {
    return refreshSession();
  }, [refreshSession]);

  return {
    session,
    refreshSession: handleRefreshSession,
    isLoading,
    error,
  };
};

/**
 * Hook to initialize auth on app startup
 */
export const useInitializeAuth = () => {
  const [isReady, setIsReady] = useState(false);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const subscribeToAuthChanges = useAuthStore((state) => state.subscribeToAuthChanges);

  useEffect(() => {
    const initAuth = async () => {
      await initializeAuth();
      setIsReady(true);
    };

    initAuth();

    // Subscribe to auth changes
    const unsubscribe = subscribeToAuthChanges();

    return unsubscribe;
  }, [initializeAuth, subscribeToAuthChanges]);

  return { isReady };
};

/**
 * Hook to enforce authentication guard on route/screen
 * @param {Function} onUnauthenticated - Callback when user is not authenticated
 */
export const useRequireAuth = (onUnauthenticated = null) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && onUnauthenticated) {
      onUnauthenticated();
    }
  }, [isAuthenticated, isLoading, onUnauthenticated]);

  return { isAuthenticated, isLoading };
};

/**
 * Hook to get access token for API requests
 * @returns {Promise<string|null>} Access token or null if not authenticated
 */
export const useAccessToken = () => {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    const getToken = async () => {
      setIsLoading(true);
      try {
        // Token is available from session
        setToken(session?.access_token || null);
      } finally {
        setIsLoading(false);
      }
    };

    getToken();
  }, [session]);

  return { token, isLoading };
};

export default {
  useAuth,
  useLogin,
  useRegister,
  usePasswordReset,
  useLogout,
  useChangePassword,
  useSession,
  useInitializeAuth,
  useRequireAuth,
  useAccessToken,
};
