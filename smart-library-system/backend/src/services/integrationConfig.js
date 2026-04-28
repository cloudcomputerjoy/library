/**
 * Integration Configuration Manager
 * Centralized configuration loading and initialization
 */

import { BKashService, NagadService } from './paymentService.js';
import EmailService from './emailService.js';
import SMSService from './smsService.js';
import CloudflareR2Service from './storageService.js';
import AIService from './aiService.js';

class IntegrationConfig {
  constructor() {
    this.services = {};
    this.config = {};
  }

  /**
   * Load configuration from environment or database
   */
  async loadConfig(configData) {
    try {
      this.config = configData;

      // Initialize services if enabled
      if (configData.bkashEnabled) {
        this.services.bkash = new BKashService({
          appKey: configData.bkashAppKey,
          appSecret: configData.bkashAppSecret,
          username: configData.bkashUsername,
          password: configData.bkashPassword,
          mode: configData.bkashMode || 'sandbox',
        });
      }

      if (configData.nagadEnabled) {
        this.services.nagad = new NagadService({
          merchantId: configData.nagadMerchantId,
          publicKey: configData.nagadPublicKey,
          privateKey: configData.nagadPrivateKey,
          mode: configData.nagadMode || 'sandbox',
        });
      }

      if (configData.smtpEnabled) {
        this.services.email = new EmailService({
          host: configData.smtpHost,
          port: configData.smtpPort || 587,
          user: configData.smtpUser,
          password: configData.smtpPassword,
          fromEmail: configData.smtpFromEmail,
          fromName: configData.smtpFromName,
          secure: configData.smtpSecure || true,
        });
      }

      if (configData.twilioEnabled) {
        this.services.sms = new SMSService({
          accountSid: configData.twilioAccountSid,
          authToken: configData.twilioAuthToken,
          phoneNumber: configData.twilioPhoneNumber,
        });
      }

      if (configData.cloudflarR2Enabled) {
        this.services.storage = new CloudflareR2Service({
          accountId: configData.cloudflarAccountId,
          accessKeyId: configData.cloudflarAccessKeyId,
          accessKeySecret: configData.cloudflarAccessKeySecret,
          bucketName: configData.cloudflarBucketName,
          publicUrl: configData.cloudflarPublicUrl,
        });
      }

      if (configData.openRouterEnabled) {
        this.services.ai = new AIService({
          apiKey: configData.openRouterApiKey,
          model: configData.openRouterModel || 'openrouter/auto',
        });
      }

      return {
        success: true,
        servicesInitialized: Object.keys(this.services),
      };
    } catch (error) {
      console.error('Configuration loading error:', error);
      throw error;
    }
  }

  /**
   * Get service
   */
  getService(serviceName) {
    return this.services[serviceName];
  }

  /**
   * Test all services
   */
  async testAllServices() {
    const results = {};

    // Test bKash
    if (this.services.bkash) {
      try {
        const token = await this.services.bkash.getToken();
        results.bkash = { success: true, message: 'bKash configured' };
      } catch (error) {
        results.bkash = { success: false, error: error.message };
      }
    }

    // Test Nagad
    if (this.services.nagad) {
      results.nagad = { success: true, message: 'Nagad configured' };
    }

    // Test SMTP
    if (this.services.email) {
      try {
        const result = await this.services.email.testConnection();
        results.email = result;
      } catch (error) {
        results.email = { success: false, error: error.message };
      }
    }

    // Test Twilio
    if (this.services.sms) {
      try {
        const result = await this.services.sms.testConnection();
        results.sms = result;
      } catch (error) {
        results.sms = { success: false, error: error.message };
      }
    }

    // Test Cloudflare R2
    if (this.services.storage) {
      try {
        const result = await this.services.storage.testConnection();
        results.storage = result;
      } catch (error) {
        results.storage = { success: false, error: error.message };
      }
    }

    // Test OpenRouter
    if (this.services.ai) {
      try {
        const result = await this.services.ai.testConnection();
        results.ai = result;
      } catch (error) {
        results.ai = { success: false, error: error.message };
      }
    }

    return results;
  }

  /**
   * Get all available services
   */
  getAvailableServices() {
    return {
      bkash: !!this.services.bkash,
      nagad: !!this.services.nagad,
      email: !!this.services.email,
      sms: !!this.services.sms,
      storage: !!this.services.storage,
      ai: !!this.services.ai,
    };
  }
}

export default new IntegrationConfig();
