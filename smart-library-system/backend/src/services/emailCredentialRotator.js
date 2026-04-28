/**
 * Email Credential Rotator - Gmail SMTP Auto-Switching
 * Manages multiple Gmail accounts with automatic failover
 */

import nodemailer from 'nodemailer';
import supabase from '../config/supabase.js';

class EmailCredentialRotator {
  constructor() {
    this.credentials = [];
    this.currentIndex = 0;
    this.healthStatus = new Map(); // Track health of each credential
    this.lastUsedIndex = new Map();
    this.failureCount = new Map();
  }

  /**
   * Load all email credentials from database
   */
  async loadCredentials() {
    try {
      const { data, error } = await supabase
        .from('email_credentials')
        .select('*')
        .eq('enabled', true)
        .order('priority', { ascending: true });

      if (error) throw error;

      this.credentials = data || [];

      // Initialize health tracking
      this.credentials.forEach((cred, index) => {
        this.healthStatus.set(index, { healthy: true, lastChecked: null });
        this.failureCount.set(index, 0);
      });

      console.log(`✅ Loaded ${this.credentials.length} email credentials`);
      return this.credentials;
    } catch (error) {
      console.error('❌ Error loading email credentials:', error);
      return [];
    }
  }

  /**
   * Add new email credential
   */
  async addCredential(credential) {
    try {
      const { data, error } = await supabase
        .from('email_credentials')
        .insert({
          email: credential.email,
          password: credential.password, // Should be app-specific password for Gmail
          smtp_host: credential.smtpHost || 'smtp.gmail.com',
          smtp_port: credential.smtpPort || 587,
          from_name: credential.fromName,
          enabled: true,
          priority: credential.priority || 10,
          created_at: new Date(),
        })
        .select();

      if (error) throw error;

      console.log(`✅ Email credential added: ${credential.email}`);
      await this.loadCredentials();
      return data[0];
    } catch (error) {
      console.error('❌ Error adding email credential:', error);
      throw error;
    }
  }

  /**
   * Remove email credential
   */
  async removeCredential(credentialId) {
    try {
      const { error } = await supabase
        .from('email_credentials')
        .delete()
        .eq('id', credentialId);

      if (error) throw error;

      console.log(`✅ Email credential removed`);
      await this.loadCredentials();
    } catch (error) {
      console.error('❌ Error removing email credential:', error);
      throw error;
    }
  }

  /**
   * Get current healthy credential
   */
  async getCurrentCredential() {
    if (this.credentials.length === 0) {
      throw new Error('No email credentials configured');
    }

    // Try to find a healthy credential
    for (let i = 0; i < this.credentials.length; i++) {
      const index = (this.currentIndex + i) % this.credentials.length;
      const health = this.healthStatus.get(index);

      if (health && health.healthy) {
        this.currentIndex = index;
        return this.credentials[index];
      }
    }

    // If all unhealthy, try the next one anyway
    console.warn(
      '⚠️ All email credentials unhealthy, using next in rotation'
    );
    this.currentIndex = (this.currentIndex + 1) % this.credentials.length;
    return this.credentials[this.currentIndex];
  }

  /**
   * Create transporter for current credential
   */
  async createTransporter() {
    const credential = await this.getCurrentCredential();

    return nodemailer.createTransport({
      host: credential.smtp_host,
      port: credential.smtp_port,
      secure: credential.smtp_port === 465,
      auth: {
        user: credential.email,
        pass: credential.password,
      },
    });
  }

  /**
   * Send email with automatic retry and failover
   */
  async sendEmail(options) {
    let lastError;

    // Try each credential
    for (let attempt = 0; attempt < this.credentials.length; attempt++) {
      try {
        const transporter = await this.createTransporter();
        const credential = this.credentials[this.currentIndex];

        const result = await transporter.sendMail({
          from: `${credential.from_name} <${credential.email}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });

        // Mark as healthy on success
        const health = this.healthStatus.get(this.currentIndex);
        health.healthy = true;
        health.lastChecked = new Date();
        this.failureCount.set(this.currentIndex, 0);

        // Log successful send
        await supabase.from('email_logs').insert({
          credential_id: credential.id,
          recipient: options.to,
          subject: options.subject,
          status: 'sent',
          message_id: result.messageId,
          sent_at: new Date(),
        });

        console.log(`✅ Email sent via ${credential.email}`);
        return result;
      } catch (error) {
        lastError = error;
        console.error(
          `❌ Failed to send via credential ${this.currentIndex}:`,
          error.message
        );

        // Mark as unhealthy
        const health = this.healthStatus.get(this.currentIndex);
        health.healthy = false;
        health.lastChecked = new Date();

        const failures = (this.failureCount.get(this.currentIndex) || 0) + 1;
        this.failureCount.set(this.currentIndex, failures);

        // Disable after too many failures
        if (failures > 5) {
          await this.disableCredential(this.currentIndex);
        }

        // Move to next credential
        this.currentIndex = (this.currentIndex + 1) % this.credentials.length;
      }
    }

    throw new Error(
      `Failed to send email after trying all credentials: ${lastError?.message}`
    );
  }

  /**
   * Health check all credentials
   */
  async healthCheck() {
    const results = [];

    for (let index = 0; index < this.credentials.length; index++) {
      try {
        const credential = this.credentials[index];
        const transporter = nodemailer.createTransport({
          host: credential.smtp_host,
          port: credential.smtp_port,
          secure: credential.smtp_port === 465,
          auth: {
            user: credential.email,
            pass: credential.password,
          },
        });

        await transporter.verify();

        this.healthStatus.get(index).healthy = true;
        this.failureCount.set(index, 0);

        results.push({
          index,
          email: credential.email,
          status: 'healthy',
          timestamp: new Date(),
        });

        console.log(`✅ ${credential.email} is healthy`);
      } catch (error) {
        this.healthStatus.get(index).healthy = false;

        results.push({
          index,
          email: credential.email,
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date(),
        });

        console.error(`❌ ${credential.email} is unhealthy:`, error.message);
      }
    }

    // Store health check results
    await supabase.from('email_health_checks').insert(results);

    return results;
  }

  /**
   * Disable credential temporarily
   */
  async disableCredential(index) {
    const credential = this.credentials[index];

    await supabase
      .from('email_credentials')
      .update({ enabled: false })
      .eq('id', credential.id);

    console.log(`🔴 Disabled credential: ${credential.email}`);
    await this.loadCredentials();
  }

  /**
   * Re-enable credential
   */
  async enableCredential(credentialId) {
    const { error } = await supabase
      .from('email_credentials')
      .update({ enabled: true })
      .eq('id', credentialId);

    if (error) throw error;

    const index = this.credentials.findIndex((c) => c.id === credentialId);
    if (index !== -1) {
      this.healthStatus.get(index).healthy = true;
      this.failureCount.set(index, 0);
    }

    console.log(`🟢 Re-enabled credential`);
    await this.loadCredentials();
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalCredentials: this.credentials.length,
      enabledCredentials: this.credentials.filter((c) => c.enabled).length,
      healthStatus: Array.from(this.healthStatus.entries()).map(
        ([index, status]) => ({
          email: this.credentials[index]?.email,
          healthy: status.healthy,
          failureCount: this.failureCount.get(index) || 0,
          lastChecked: status.lastChecked,
        })
      ),
      currentIndex: this.currentIndex,
    };
  }
}

export default new EmailCredentialRotator();
