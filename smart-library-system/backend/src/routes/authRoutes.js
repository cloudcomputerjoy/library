/**
 * Authentication Routes
 * Public and protected routes for admin authentication
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/supabaseAuthController');
const adminAuth = require('../middleware/adminAuth');
const rateLimiter = require('../middleware/rateLimiter');

/**
 * PUBLIC ROUTES (No authentication required)
 */

/**
 * POST /api/auth/login
 * Login with email and password
 * Rate limited to 5 attempts per 15 minutes
 */
router.post('/login', 
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  AuthController.login
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 * Rate limited to 3 attempts per hour
 */
router.post('/forgot-password',
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 3 }),
  AuthController.forgotPassword
);

/**
 * PROTECTED ROUTES (Authentication required)
 */

/**
 * POST /api/auth/logout
 * Logout and revoke session
 */
router.post('/logout',
  adminAuth,
  AuthController.logout
);

/**
 * GET /api/auth/verify
 * Verify current authentication status
 */
router.get('/verify',
  adminAuth,
  AuthController.verify
);

/**
 * POST /api/auth/update-password
 * Update authenticated user's password
 * Requires current session
 */
router.post('/update-password',
  adminAuth,
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 5 }),
  AuthController.updatePassword
);

/**
 * GET /api/auth/logs
 * Get authentication logs (admin only)
 * Returns login attempts, logouts, failed attempts
 */
router.get('/logs',
  adminAuth,
  AuthController.getAuthLogs
);

module.exports = router;
