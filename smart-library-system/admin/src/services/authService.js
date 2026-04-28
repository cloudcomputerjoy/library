import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Auth Service
 * Handles all authentication-related API calls
 * 
 * Base: GET /api/auth/health
 * Login: POST /api/auth/login
 * Register: POST /api/auth/register
 * Logout: POST /api/auth/logout
 * Refresh Token: POST /api/auth/refresh-token
 * Forgot Password: POST /api/auth/forgot-password
 * Reset Password: POST /api/auth/reset-password
 * Verify Reset Token: POST /api/auth/verify-reset-token
 */

const authService = {
  /**
   * Login with email and password
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @returns {Promise<Object>} User data and tokens
   */
  login: async (email, password) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error) {
      const err = new Error(error.response?.data?.message || 'Login failed');
      err.status = error.response?.status;
      err.originalError = error;
      throw err;
    }
  },

  /**
   * Register a new admin account
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @param {string} fullName - Full name of admin
   * @returns {Promise<Object>} New user data
   */
  register: async (email, password, fullName) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        { email, password, fullName },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error) {
      const err = new Error(error.response?.data?.message || 'Registration failed');
      err.status = error.response?.status;
      err.originalError = error;
      throw err;
    }
  },

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token from localStorage
   * @returns {Promise<Object>} New access token
   */
  refreshToken: async (refreshToken) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/refresh-token`,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error) {
      const err = new Error(error.response?.data?.message || 'Token refresh failed');
      err.status = error.response?.status;
      err.originalError = error;
      throw err;
    }
  },

  /**
   * Logout and invalidate tokens
   * @param {string} accessToken - Current access token
   * @returns {Promise<Object>} Logout confirmation
   */
  logout: async (accessToken) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error) {
      // Logout errors are non-critical
      return { success: true, message: 'Logged out' };
    }
  },

  /**
   * Request password reset email
   * @param {string} email - Admin email
   * @returns {Promise<Object>} Reset link sent confirmation
   */
  forgotPassword: async (email) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/forgot-password`,
        { email },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error) {
      const err = new Error(error.response?.data?.message || 'Failed to send reset email');
      err.status = error.response?.status;
      err.originalError = error;
      throw err;
    }
  },

  /**
   * Verify reset token validity
   * @param {string} token - Reset token from email
   * @param {string} email - User email
   * @returns {Promise<Object>} Token validation result
   */
  verifyResetToken: async (token, email) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/verify-reset-token`,
        { token, email },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error) {
      const err = new Error(error.response?.data?.message || 'Token validation failed');
      err.status = error.response?.status;
      err.originalError = error;
      throw err;
    }
  },

  /**
   * Reset password with new password
   * @param {string} token - Reset token from email
   * @param {string} email - User email
   * @param {string} newPassword - New password (must meet requirements)
   * @returns {Promise<Object>} Password reset confirmation
   */
  resetPassword: async (token, email, newPassword) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/reset-password`,
        { token, email, newPassword },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (error) {
      const err = new Error(error.response?.data?.message || 'Password reset failed');
      err.status = error.response?.status;
      err.originalError = error;
      throw err;
    }
  },

  /**
   * Check backend health
   * @returns {Promise<Object>} Health status
   */
  healthCheck: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/auth/health`,
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      const err = new Error('Backend server is not responding');
      err.originalError = error;
      throw err;
    }
  },
};

export default authService;
