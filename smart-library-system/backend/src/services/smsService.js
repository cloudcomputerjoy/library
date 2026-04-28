/**
 * SMS Service - Twilio Integration
 * Production-ready SMS messaging
 */

import twilio from 'twilio';

class SMSService {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.initClient();
  }

  /**
   * Initialize Twilio client
   */
  initClient() {
    if (!this.config.accountSid || !this.config.authToken || !this.config.phoneNumber) {
      console.warn('Twilio configuration incomplete');
      return;
    }

    this.client = twilio(this.config.accountSid, this.config.authToken);
  }

  /**
   * Send SMS
   */
  async sendSMS(to, message) {
    try {
      if (!this.client) {
        throw new Error('Twilio not configured');
      }

      const result = await this.client.messages.create({
        body: message,
        from: this.config.phoneNumber,
        to: to,
      });

      return {
        success: true,
        messageSid: result.sid,
        status: result.status,
      };
    } catch (error) {
      console.error('SMS send error:', error);
      throw error;
    }
  }

  /**
   * Send OTP
   */
  async sendOTP(phoneNumber, otp) {
    const message = `Your Smart Library OTP is: ${otp}. Valid for 10 minutes.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send book notification SMS
   */
  async sendBookNotificationSMS(phoneNumber, userName, action, bookTitle) {
    const messages = {
      issued: `📚 Book issued: ${bookTitle}. Due in 14 days. - Smart Library`,
      returned: `✅ Book returned: ${bookTitle}. Thank you! - Smart Library`,
      overdue: `⏰ Book overdue: ${bookTitle}. Fine: 5 BDT/day. Return ASAP.`,
      reminder: `⏱️ Reminder: Return ${bookTitle} in 3 days. - Smart Library`,
      reserved: `🔖 ${bookTitle} is now available for pickup. - Smart Library`,
    };

    const message = messages[action] || messages.issued;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send payment notification SMS
   */
  async sendPaymentNotificationSMS(phoneNumber, amount, transactionId, status) {
    let message = '';
    if (status === 'success') {
      message = `✅ Payment of ${amount} BDT successful. Ref: ${transactionId} - Smart Library`;
    } else if (status === 'pending') {
      message = `⏳ Payment of ${amount} BDT is pending. Ref: ${transactionId} - Smart Library`;
    } else {
      message = `❌ Payment failed. Please try again. Ref: ${transactionId} - Smart Library`;
    }

    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send fine notification SMS
   */
  async sendFineNotificationSMS(phoneNumber, amount, reason) {
    const message = `⚠️ Library fine: ${amount} BDT (${reason}). Pay now to avoid suspension.`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Send account alert SMS
   */
  async sendAccountAlertSMS(phoneNumber, alert) {
    const alerts = {
      suspended: `🚫 Your library account has been suspended. Contact support.`,
      passwordReset: `🔐 Password reset requested. If not you, ignore this.`,
      newDevice: `📱 New login from unrecognized device. Check your account security.`,
    };

    const message = alerts[alert] || `Alert: ${alert} - Smart Library`;
    return this.sendSMS(phoneNumber, message);
  }

  /**
   * Test Twilio configuration
   */
  async testConnection() {
    try {
      if (!this.client) {
        throw new Error('Twilio not configured');
      }

      // Try to fetch account balance (proves connection works)
      const account = await this.client.api.accounts.list();
      return {
        success: true,
        message: 'Twilio configuration is valid',
        accountSid: account[0].sid,
      };
    } catch (error) {
      console.error('Twilio test error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get SMS status
   */
  async getSMSStatus(messageSid) {
    try {
      if (!this.client) {
        throw new Error('Twilio not configured');
      }

      const message = await this.client.messages(messageSid).fetch();
      return {
        success: true,
        status: message.status,
        from: message.from,
        to: message.to,
        body: message.body,
        dateSent: message.dateSent,
      };
    } catch (error) {
      console.error('Get SMS status error:', error);
      throw error;
    }
  }
}

export default SMSService;
