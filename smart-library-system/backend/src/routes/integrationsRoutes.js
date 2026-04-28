/**
 * Integrations Routes - Supabase Integration
 * API routes for external service integrations
 */

import express from 'express';
import {
  // Configuration
  getIntegrationConfig,
  updateIntegrationConfig,
  testIntegrations,

  // Payment
  createBKashPayment,
  executeBKashPayment,
  createNagadPayment,
  completeNagadPayment,

  // Email
  sendEmail,
  verifyEmailConfig,

  // SMS
  sendSMS,
  verifySMSConfig,

  // Storage
  uploadFile,
  deleteFile,
  getSignedUrl,

  // AI
  aiChat,
  getBookRecommendation,
  verifyAIConfig,
} from '../controllers/integrationsController.js';

import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// ============================================
// CONFIGURATION ROUTES
// ============================================

// Get integration configuration
router.get('/config', authenticate, authorize('admin'), getIntegrationConfig);

// Update integration configuration
router.post('/config', authenticate, authorize('admin'), updateIntegrationConfig);

// Test all integrations
router.post('/test', authenticate, authorize('admin'), testIntegrations);

// ============================================
// PAYMENT ROUTES
// ============================================

// bKash payment - Create
router.post('/payment/bkash/create', authenticate, createBKashPayment);

// bKash payment - Execute
router.post('/payment/bkash/execute', authenticate, executeBKashPayment);

// Nagad payment - Create
router.post('/payment/nagad/create', authenticate, createNagadPayment);

// Nagad payment - Complete
router.post('/payment/nagad/complete', authenticate, completeNagadPayment);

// ============================================
// EMAIL ROUTES
// ============================================

// Send email
router.post('/email/send', authenticate, sendEmail);

// Verify email configuration
router.post('/email/verify', authenticate, authorize('admin'), verifyEmailConfig);

// ============================================
// SMS ROUTES
// ============================================

// Send SMS
router.post('/sms/send', authenticate, sendSMS);

// Verify SMS configuration
router.post('/sms/verify', authenticate, authorize('admin'), verifySMSConfig);

// ============================================
// STORAGE ROUTES
// ============================================

// Upload file
router.post('/storage/upload', authenticate, uploadFile);

// Delete file
router.post('/storage/delete', authenticate, deleteFile);

// Get signed URL
router.post('/storage/signed-url', authenticate, getSignedUrl);

// ============================================
// AI ROUTES
// ============================================

// Chat with AI
router.post('/ai/chat', authenticate, aiChat);

// Get book recommendation
router.post('/ai/recommendation', authenticate, getBookRecommendation);

// Verify AI configuration
router.post('/ai/verify', authenticate, authorize('admin'), verifyAIConfig);

export default router;
