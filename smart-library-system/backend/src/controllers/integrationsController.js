/**
 * Integrations Controller - Supabase Integration
 * Handles all external service integrations
 */

import supabase from '../config/supabase.js';
import integrationConfig from '../services/integrationConfig.js';

// ============================================
// CONFIGURATION MANAGEMENT
// ============================================

/**
 * GET /api/integrations/config
 * Get current integration configuration
 */
export const getIntegrationConfig = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .in('setting_key', [
        'bkashEnabled', 'bkashMode',
        'nagadEnabled', 'nagadMode',
        'smtpEnabled',
        'twilioEnabled',
        'cloudflarR2Enabled',
        'openRouterEnabled',
      ]);

    if (error) throw error;

    const config = {};
    data?.forEach(setting => {
      config[setting.setting_key] = setting.setting_value;
    });

    return res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Get integration config error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch integration config',
    });
  }
};

/**
 * POST /api/integrations/config
 * Update integration configuration
 */
export const updateIntegrationConfig = async (req, res, next) => {
  try {
    const { config } = req.body;

    // Start transaction-like updates
    for (const [key, value] of Object.entries(config)) {
      await supabase
        .from('settings')
        .upsert({
          setting_key: key,
          setting_value: value,
        }, { onConflict: 'setting_key' });
    }

    // Reload services
    await integrationConfig.loadConfig(config);

    return res.json({
      success: true,
      message: 'Configuration updated successfully',
      servicesInitialized: Object.keys(integrationConfig.services),
    });
  } catch (error) {
    console.error('Update integration config error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update configuration',
    });
  }
};

/**
 * POST /api/integrations/test
 * Test all service connections
 */
export const testIntegrations = async (req, res, next) => {
  try {
    const results = await integrationConfig.testAllServices();

    return res.json({
      success: true,
      tests: results,
    });
  } catch (error) {
    console.error('Integration test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to test integrations',
    });
  }
};

// ============================================
// PAYMENT INTEGRATIONS
// ============================================

/**
 * POST /api/integrations/payment/bkash/create
 * Create bKash payment
 */
export const createBKashPayment = async (req, res, next) => {
  try {
    const { amount, orderId, description, callbackUrl } = req.body;

    const bkash = integrationConfig.getService('bkash');
    if (!bkash) {
      return res.status(400).json({
        success: false,
        error: 'bKash not configured',
      });
    }

    const result = await bkash.createPayment(amount, orderId, description, callbackUrl);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Create bKash payment error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/integrations/payment/bkash/execute
 * Execute bKash payment
 */
export const executeBKashPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.body;

    const bkash = integrationConfig.getService('bkash');
    if (!bkash) {
      return res.status(400).json({
        success: false,
        error: 'bKash not configured',
      });
    }

    const result = await bkash.executePayment(paymentId);

    // Save transaction
    await supabase.from('transactions').insert({
      payment_method: 'bkash',
      transaction_id: result.transactionId,
      amount: result.amount,
      status: result.status,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Execute bKash payment error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/integrations/payment/nagad/create
 * Create Nagad payment
 */
export const createNagadPayment = async (req, res, next) => {
  try {
    const { amount, orderId, description, callbackUrl, customerPhone } = req.body;

    const nagad = integrationConfig.getService('nagad');
    if (!nagad) {
      return res.status(400).json({
        success: false,
        error: 'Nagad not configured',
      });
    }

    const result = await nagad.createPayment(amount, orderId, description, callbackUrl, customerPhone);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Create Nagad payment error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/integrations/payment/nagad/complete
 * Complete Nagad payment
 */
export const completeNagadPayment = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    const nagad = integrationConfig.getService('nagad');
    if (!nagad) {
      return res.status(400).json({
        success: false,
        error: 'Nagad not configured',
      });
    }

    const result = await nagad.completePayment(sessionId);

    // Save transaction
    await supabase.from('transactions').insert({
      payment_method: 'nagad',
      transaction_id: result.transactionId,
      amount: result.amount,
      status: result.status,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Complete Nagad payment error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// EMAIL INTEGRATIONS
// ============================================

/**
 * POST /api/integrations/email/send
 * Send email
 */
export const sendEmail = async (req, res, next) => {
  try {
    const { to, subject, html } = req.body;

    const email = integrationConfig.getService('email');
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email service not configured',
      });
    }

    const result = await email.sendEmail(to, subject, html);

    // Log email
    await supabase.from('email_logs').insert({
      recipient: to,
      subject: subject,
      status: 'sent',
      message_id: result.messageId,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Send email error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/integrations/email/verify
 * Verify email
 */
export const verifyEmailConfig = async (req, res, next) => {
  try {
    const email = integrationConfig.getService('email');
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email service not configured',
      });
    }

    const result = await email.testConnection();
    return res.json(result);
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// SMS INTEGRATIONS
// ============================================

/**
 * POST /api/integrations/sms/send
 * Send SMS
 */
export const sendSMS = async (req, res, next) => {
  try {
    const { to, message } = req.body;

    const sms = integrationConfig.getService('sms');
    if (!sms) {
      return res.status(400).json({
        success: false,
        error: 'SMS service not configured',
      });
    }

    const result = await sms.sendSMS(to, message);

    // Log SMS
    await supabase.from('sms_logs').insert({
      recipient: to,
      message: message,
      status: result.status,
      message_sid: result.messageSid,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Send SMS error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/integrations/sms/verify
 * Verify SMS configuration
 */
export const verifySMSConfig = async (req, res, next) => {
  try {
    const sms = integrationConfig.getService('sms');
    if (!sms) {
      return res.status(400).json({
        success: false,
        error: 'SMS service not configured',
      });
    }

    const result = await sms.testConnection();
    return res.json(result);
  } catch (error) {
    console.error('Verify SMS error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// STORAGE INTEGRATIONS
// ============================================

/**
 * POST /api/integrations/storage/upload
 * Upload file to Cloudflare R2
 */
export const uploadFile = async (req, res, next) => {
  try {
    const { filePath, fileKey, contentType } = req.body;

    const storage = integrationConfig.getService('storage');
    if (!storage) {
      return res.status(400).json({
        success: false,
        error: 'Storage service not configured',
      });
    }

    const result = await storage.uploadFile(filePath, fileKey, contentType);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Upload file error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/integrations/storage/delete
 * Delete file from Cloudflare R2
 */
export const deleteFile = async (req, res, next) => {
  try {
    const { fileKey } = req.body;

    const storage = integrationConfig.getService('storage');
    if (!storage) {
      return res.status(400).json({
        success: false,
        error: 'Storage service not configured',
      });
    }

    const result = await storage.deleteFile(fileKey);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/integrations/storage/signed-url
 * Get signed URL for file access
 */
export const getSignedUrl = async (req, res, next) => {
  try {
    const { fileKey, expiresIn } = req.body;

    const storage = integrationConfig.getService('storage');
    if (!storage) {
      return res.status(400).json({
        success: false,
        error: 'Storage service not configured',
      });
    }

    const result = await storage.getSignedUrl(fileKey, expiresIn || 3600);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get signed URL error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// AI INTEGRATIONS
// ============================================

/**
 * POST /api/integrations/ai/chat
 * Chat with AI
 */
export const aiChat = async (req, res, next) => {
  try {
    const { messages, temperature, maxTokens } = req.body;

    const ai = integrationConfig.getService('ai');
    if (!ai) {
      return res.status(400).json({
        success: false,
        error: 'AI service not configured',
      });
    }

    const result = await ai.chat(messages, temperature, maxTokens);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/integrations/ai/recommendation
 * Get book recommendation
 */
export const getBookRecommendation = async (req, res, next) => {
  try {
    const { bookTitle, genre, userPreferences } = req.body;

    const ai = integrationConfig.getService('ai');
    if (!ai) {
      return res.status(400).json({
        success: false,
        error: 'AI service not configured',
      });
    }

    const result = await ai.generateBookRecommendation(bookTitle, genre, userPreferences);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get book recommendation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/integrations/ai/verify
 * Verify AI configuration
 */
export const verifyAIConfig = async (req, res, next) => {
  try {
    const ai = integrationConfig.getService('ai');
    if (!ai) {
      return res.status(400).json({
        success: false,
        error: 'AI service not configured',
      });
    }

    const result = await ai.testConnection();
    return res.json(result);
  } catch (error) {
    console.error('Verify AI error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  getIntegrationConfig,
  updateIntegrationConfig,
  testIntegrations,
  createBKashPayment,
  executeBKashPayment,
  createNagadPayment,
  completeNagadPayment,
  sendEmail,
  verifyEmailConfig,
  sendSMS,
  verifySMSConfig,
  uploadFile,
  deleteFile,
  getSignedUrl,
  aiChat,
  getBookRecommendation,
  verifyAIConfig,
};
