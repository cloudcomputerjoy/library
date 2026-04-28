/**
 * Email Service - SMTP Integration
 * Production-ready email sending with templates
 */

import nodemailer from 'nodemailer';

class EmailService {
  constructor(config) {
    this.config = config;
    this.transporter = null;
    this.initTransporter();
  }

  /**
   * Initialize email transporter
   */
  initTransporter() {
    if (!this.config.host || !this.config.user || !this.config.password) {
      console.warn('SMTP configuration incomplete');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port || 587,
      secure: this.config.secure || true,
      auth: {
        user: this.config.user,
        pass: this.config.password,
      },
    });
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.transporter) {
        throw new Error('SMTP not configured');
      }

      const mailOptions = {
        from: `"${this.config.fromName || 'Smart Library'}" <${this.config.fromEmail}>`,
        to: to,
        subject: subject,
        html: html,
        text: text || html.replace(/<[^>]*>/g, ''),
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  /**
   * Send book notification
   */
  async sendBookNotification(email, userName, action, bookTitle) {
    const templates = {
      issued: {
        subject: `📚 Book Issued: ${bookTitle}`,
        html: `
          <h2>Book Issued Successfully</h2>
          <p>Hi ${userName},</p>
          <p>Your book "<strong>${bookTitle}</strong>" has been issued.</p>
          <p><strong>Due Date:</strong> ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
          <p>Please return the book before the due date to avoid late fines.</p>
          <hr>
          <p>Smart Library Management System</p>
        `,
      },
      returned: {
        subject: `✅ Book Returned: ${bookTitle}`,
        html: `
          <h2>Book Return Confirmed</h2>
          <p>Hi ${userName},</p>
          <p>Your book "<strong>${bookTitle}</strong>" has been successfully returned.</p>
          <p>Thank you for using our library!</p>
          <hr>
          <p>Smart Library Management System</p>
        `,
      },
      overdue: {
        subject: `⏰ Overdue Notice: ${bookTitle}`,
        html: `
          <h2>Book Overdue Reminder</h2>
          <p>Hi ${userName},</p>
          <p>Your book "<strong>${bookTitle}</strong>" is now overdue.</p>
          <p>Please return it as soon as possible to avoid additional fines.</p>
          <p><strong>Fine: 5 BDT per day</strong></p>
          <hr>
          <p>Smart Library Management System</p>
        `,
      },
      reserved: {
        subject: `🔖 Book Reserved: ${bookTitle}`,
        html: `
          <h2>Book Reservation Confirmed</h2>
          <p>Hi ${userName},</p>
          <p>You have reserved "<strong>${bookTitle}</strong>".</p>
          <p>We will notify you when it becomes available for pickup.</p>
          <hr>
          <p>Smart Library Management System</p>
        `,
      },
    };

    const template = templates[action] || templates.issued;
    return this.sendEmail(email, template.subject, template.html);
  }

  /**
   * Send payment notification
   */
  async sendPaymentNotification(email, userName, amount, transactionId, status) {
    const statusText = status === 'completed' ? '✅ Payment Successful' : '⏳ Payment Pending';
    const html = `
      <h2>${statusText}</h2>
      <p>Hi ${userName},</p>
      <p>Payment Status: <strong>${status.toUpperCase()}</strong></p>
      <p><strong>Amount:</strong> ${amount} BDT</p>
      <p><strong>Transaction ID:</strong> ${transactionId}</p>
      <p>Thank you for using our library services!</p>
      <hr>
      <p>Smart Library Management System</p>
    `;

    return this.sendEmail(
      email,
      `💳 Payment ${statusText}`,
      html
    );
  }

  /**
   * Send fine notification
   */
  async sendFineNotification(email, userName, amount, reason) {
    const html = `
      <h2>📋 Fine Notice</h2>
      <p>Hi ${userName},</p>
      <p><strong>Fine Amount:</strong> ${amount} BDT</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please pay the fine to avoid suspension of library services.</p>
      <hr>
      <p>Smart Library Management System</p>
    `;

    return this.sendEmail(email, '⚠️ Library Fine Notice', html);
  }

  /**
   * Send account notification
   */
  async sendAccountNotification(email, userName, type, content) {
    const templates = {
      welcome: {
        subject: '👋 Welcome to Smart Library',
        html: `
          <h2>Welcome to Smart Library!</h2>
          <p>Hi ${userName},</p>
          <p>Your account has been successfully created.</p>
          <p>You can now borrow books, access our digital resources, and more!</p>
          <hr>
          <p>Smart Library Management System</p>
        `,
      },
      passwordReset: {
        subject: '🔐 Password Reset Request',
        html: `
          <h2>Password Reset</h2>
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password.</p>
          <p>${content}</p>
          <p>If you didn't request this, you can ignore this email.</p>
          <hr>
          <p>Smart Library Management System</p>
        `,
      },
      suspended: {
        subject: '🚫 Account Suspended',
        html: `
          <h2>Account Suspended</h2>
          <p>Hi ${userName},</p>
          <p>Your account has been suspended due to: ${content}</p>
          <p>Please contact the library for more information.</p>
          <hr>
          <p>Smart Library Management System</p>
        `,
      },
    };

    const template = templates[type] || templates.welcome;
    return this.sendEmail(email, template.subject, template.html);
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      if (!this.transporter) {
        throw new Error('SMTP not configured');
      }

      await this.transporter.verify();
      return {
        success: true,
        message: 'SMTP configuration is valid',
      };
    } catch (error) {
      console.error('SMTP test error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default EmailService;
