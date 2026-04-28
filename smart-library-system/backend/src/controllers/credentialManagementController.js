/**
 * Credential Management Controller
 * API endpoints for managing email and API key credentials
 */

import emailRotator from '../services/emailCredentialRotator.js';
import apiKeyRotator from '../services/apiKeyRotator.js';
import supabase from '../config/supabase.js';
import { ValidationError, IntegrationError } from '../utils/errorBoundaries.js';

// ============================================
// EMAIL CREDENTIALS MANAGEMENT
// ============================================

/**
 * GET /api/credentials/email
 * Get all email credentials
 */
export const getEmailCredentials = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('email_credentials')
      .select('id, email, from_name, enabled, priority, created_at')
      .order('priority', { ascending: true });

    if (error) throw error;

    const stats = emailRotator.getStatistics();

    return res.json({
      success: true,
      data: {
        credentials: data,
        statistics: stats,
      },
    });
  } catch (error) {
    console.error('Error fetching email credentials:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch email credentials',
    });
  }
};

/**
 * POST /api/credentials/email
 * Add new email credential
 */
export const addEmailCredential = async (req, res, next) => {
  try {
    const { email, password, fromName, priority, smtpHost, smtpPort } = req.body;

    // Validation
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    const credential = await emailRotator.addCredential({
      email,
      password,
      fromName: fromName || 'Library System',
      priority: priority || 10,
      smtpHost: smtpHost || 'smtp.gmail.com',
      smtpPort: smtpPort || 587,
    });

    return res.json({
      success: true,
      data: credential,
      message: 'Email credential added successfully',
    });
  } catch (error) {
    console.error('Error adding email credential:', error);
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to add email credential',
    });
  }
};

/**
 * DELETE /api/credentials/email/:id
 * Remove email credential
 */
export const removeEmailCredential = async (req, res, next) => {
  try {
    const { id } = req.params;

    await emailRotator.removeCredential(id);

    return res.json({
      success: true,
      message: 'Email credential removed',
    });
  } catch (error) {
    console.error('Error removing email credential:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove email credential',
    });
  }
};

/**
 * PUT /api/credentials/email/:id
 * Enable/disable email credential
 */
export const updateEmailCredential = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { enabled, priority } = req.body;

    const updates = {};
    if (typeof enabled === 'boolean') updates.enabled = enabled;
    if (typeof priority === 'number') updates.priority = priority;

    const { data, error } = await supabase
      .from('email_credentials')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    await emailRotator.loadCredentials();

    return res.json({
      success: true,
      data: data[0],
      message: 'Email credential updated',
    });
  } catch (error) {
    console.error('Error updating email credential:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update email credential',
    });
  }
};

/**
 * POST /api/credentials/email/test/:id
 * Test specific email credential
 */
export const testEmailCredential = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('email_credentials')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new ValidationError('Credential not found');
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: data.smtp_host,
      port: data.smtp_port,
      secure: data.smtp_port === 465,
      auth: {
        user: data.email,
        pass: data.password,
      },
    });

    await transporter.verify();

    return res.json({
      success: true,
      message: `✅ ${data.email} is working correctly`,
    });
  } catch (error) {
    console.error('Error testing email credential:', error);
    return res.status(500).json({
      success: false,
      error: `❌ Test failed: ${error.message}`,
    });
  }
};

/**
 * POST /api/credentials/email/health-check
 * Health check all email credentials
 */
export const emailHealthCheck = async (req, res, next) => {
  try {
    const results = await emailRotator.healthCheck();

    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error running email health check:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to run health check',
    });
  }
};

// ============================================
// API KEY MANAGEMENT
// ============================================

/**
 * GET /api/credentials/apikeys
 * Get all API keys
 */
export const getAPIKeys = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select(
        'id, name, service, enabled, priority, monthly_limit, created_at'
      )
      .eq('service', 'openrouter')
      .order('priority', { ascending: true });

    if (error) throw error;

    const stats = apiKeyRotator.getStatistics();

    return res.json({
      success: true,
      data: {
        keys: data,
        statistics: stats,
      },
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch API keys',
    });
  }
};

/**
 * POST /api/credentials/apikeys
 * Add new API key
 */
export const addAPIKey = async (req, res, next) => {
  try {
    const {
      apiKey,
      name,
      description,
      priority,
      monthlyLimit,
    } = req.body;

    // Validation
    if (!apiKey || !name) {
      throw new ValidationError('API key and name are required');
    }

    if (apiKey.length < 10) {
      throw new ValidationError('Invalid API key format');
    }

    const result = await apiKeyRotator.addAPIKey({
      apiKey,
      name,
      description: description || '',
      priority: priority || 10,
      monthlyLimit: monthlyLimit || null,
    });

    return res.json({
      success: true,
      data: result,
      message: 'API key added successfully',
    });
  } catch (error) {
    console.error('Error adding API key:', error);
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to add API key',
    });
  }
};

/**
 * DELETE /api/credentials/apikeys/:id
 * Remove API key
 */
export const removeAPIKey = async (req, res, next) => {
  try {
    const { id } = req.params;

    await apiKeyRotator.removeAPIKey(id);

    return res.json({
      success: true,
      message: 'API key removed',
    });
  } catch (error) {
    console.error('Error removing API key:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove API key',
    });
  }
};

/**
 * PUT /api/credentials/apikeys/:id
 * Enable/disable API key
 */
export const updateAPIKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { enabled, priority } = req.body;

    const updates = {};
    if (typeof enabled === 'boolean') updates.enabled = enabled;
    if (typeof priority === 'number') updates.priority = priority;

    const { data, error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    await apiKeyRotator.loadAPIKeys();

    return res.json({
      success: true,
      data: data[0],
      message: 'API key updated',
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update API key',
    });
  }
};

/**
 * POST /api/credentials/apikeys/test/:id
 * Test specific API key
 */
export const testAPIKey = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new ValidationError('API key not found');
    }

    const axios = require('axios');

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'test',
          },
        ],
        max_tokens: 10,
      },
      {
        headers: {
          Authorization: `Bearer ${data.api_key}`,
        },
        timeout: 10000,
      }
    );

    const remainingRequests =
      response.headers['x-openrouter-remaining-requests'];

    return res.json({
      success: true,
      message: `✅ API key is working correctly`,
      data: {
        name: data.name,
        remainingRequests,
      },
    });
  } catch (error) {
    console.error('Error testing API key:', error);
    return res.status(500).json({
      success: false,
      error: `❌ Test failed: ${error.message}`,
    });
  }
};

/**
 * POST /api/credentials/apikeys/health-check
 * Health check all API keys
 */
export const apiKeysHealthCheck = async (req, res, next) => {
  try {
    const results = await apiKeyRotator.healthCheck();

    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error running API key health check:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to run health check',
    });
  }
};

/**
 * POST /api/credentials/apikeys/reset-stats
 * Reset statistics
 */
export const resetAPIKeyStats = async (req, res, next) => {
  try {
    apiKeyRotator.resetStatistics();

    return res.json({
      success: true,
      message: 'Statistics reset',
    });
  } catch (error) {
    console.error('Error resetting API key stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset statistics',
    });
  }
};

export default {
  // Email
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
};
