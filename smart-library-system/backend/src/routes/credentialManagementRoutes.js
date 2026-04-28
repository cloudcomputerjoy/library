/**
 * Credential Management Routes
 * API endpoints for managing email and API key credentials
 */

import express from 'express';
import {
  // Email Credentials
  getEmailCredentials,
  addEmailCredential,
  removeEmailCredential,
  updateEmailCredential,
  testEmailCredential,
  emailHealthCheck,

  // API Keys
  getAPIKeys,
  addAPIKey,
  removeAPIKey,
  updateAPIKey,
  testAPIKey,
  apiKeysHealthCheck,
  resetAPIKeyStats,
} from '../controllers/credentialManagementController.js';

import { authenticate, authorize } from '../middleware/auth.js';
import { apiRateLimit } from '../middleware/rateLimiting.js';

const router = express.Router();

// ============================================
// EMAIL CREDENTIALS ROUTES
// ============================================

// Get all email credentials
router.get(
  '/email',
  authenticate,
  authorize('admin'),
  apiRateLimit,
  getEmailCredentials
);

// Add email credential
router.post(
  '/email',
  authenticate,
  authorize('admin'),
  apiRateLimit,
  addEmailCredential
);

// Update email credential
router.put(
  '/email/:id',
  authenticate,
  authorize('admin'),
  apiRateLimit,
  updateEmailCredential
);

// Remove email credential
router.delete(
  '/email/:id',
  authenticate,
  authorize('admin'),
  apiRateLimit,
  removeEmailCredential
);

// Test email credential
router.post(
  '/email/test/:id',
  authenticate,
  authorize('admin'),
  apiRateLimit,
  testEmailCredential
);

// Email health check
router.post(
  '/email/health-check',
  authenticate,
  authorize('admin'),
  apiRateLimit,
  emailHealthCheck
);

// ============================================
// API KEYS ROUTES
// ============================================

// Get all API keys
router.get(
  '/apikeys',
  authenticate,
  authorize('admin'),
  apiRateLimit,
  getAPIKeys
);

// Add API key
router.post(
  '/apikeys',
  authenticate,
  authorize('admin'),
  apiRateLimit,
  addAPIKey
);

// Update API key
router.put(
  '/apikeys/:id',
  authenticate,
  authorize('admin'),
  apiRateLimit,
  updateAPIKey
);

// Remove API key
router.delete(
  '/apikeys/:id',
  authenticate,
  authorize('admin'),
  apiRateLimit,
  removeAPIKey
);

// Test API key
router.post(
  '/apikeys/test/:id',
  authenticate,
  authorize('admin'),
  apiRateLimit,
  testAPIKey
);

// API key health check
router.post(
  '/apikeys/health-check',
  authenticate,
  authorize('admin'),
  apiRateLimit,
  apiKeysHealthCheck
);

// Reset API key stats
router.post(
  '/apikeys/reset-stats',
  authenticate,
  authorize('admin'),
  apiRateLimit,
  resetAPIKeyStats
);

export default router;
