/**
 * Email & Notification Service for Book Returns
 * Sends Firebase push notifications and email confirmations
 */

const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const { supabase } = require('../config/database');

/**
 * Send Firebase notification for book return
 * @param {string} fcmToken - User's FCM token
 * @param {Object} data - Notification data
 */
async function sendFirebaseNotification(fcmToken, data) {
  try {
    if (!admin.apps.length) {
      console.warn('Firebase not initialized');
      return;
    }

    const message = {
      notification: {
        title: data.title || '📚 Books Returned',
        body: data.body || 'Return processed successfully',
      },
      data: {
        type: data.type || 'book_returned',
        booksCount: (data.booksCount || 0).toString(),
        totalFine: (data.totalFine || 0).toString(),
        timestamp: new Date().toISOString(),
      },
      webpush: {
        fcmOptions: {
          link: 'smart-library://returns',
        },
      },
    };

    const response = await admin.messaging().send({
      ...message,
      token: fcmToken,
    });

    console.log('Firebase notification sent:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Firebase notification error:', error);
    throw error;
  }
}

/**
 * Send email notification for book return
 * @param {string} email - Student email
 * @param {string} studentName - Student name
 * @param {Object} returnData - Return data with books and fine
 */
async function sendReturnEmailNotification(email, studentName, returnData) {
  try {
    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Build books list HTML
    const booksHTML = returnData.books
      .map(
        (book, idx) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          <strong>${book.books?.title || 'Unknown'}</strong><br>
          <small style="color: #666;">ISBN: ${book.isbn}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-transform: capitalize;">
          ${book.condition}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
          ₹${book.fine || 0}
        </td>
      </tr>
    `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; }
          .header { background: #007AFF; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ddd; }
          .section h2 { font-size: 16px; color: #007AFF; border-bottom: 2px solid #007AFF; padding-bottom: 10px; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f0f0f0; padding: 10px; text-align: left; font-weight: 600; }
          .summary { display: flex; justify-content: space-between; padding: 10px 0; }
          .summary-label { font-weight: 600; color: #666; }
          .summary-value { font-weight: 700; color: #007AFF; font-size: 18px; }
          .fine-value { color: #FF9500; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
          .success-badge { display: inline-block; background: #34C759; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="success-badge">✓ RETURN SUCCESSFUL</span>
            <h1>📚 Books Returned Successfully</h1>
          </div>

          <div class="section">
            <h2>Return Confirmation</h2>
            <p>Hi <strong>${studentName}</strong>,</p>
            <p>Your books have been successfully returned to the library. Below is your return receipt.</p>
          </div>

          <div class="section">
            <h2>📖 Returned Books</h2>
            <table>
              <thead>
                <tr style="background: #f0f0f0;">
                  <th style="padding: 10px;">#</th>
                  <th style="padding: 10px;">Book Title</th>
                  <th style="padding: 10px;">Condition</th>
                  <th style="padding: 10px; text-align: right;">Fine</th>
                </tr>
              </thead>
              <tbody>
                ${booksHTML}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>💰 Fine Summary</h2>
            <div class="summary">
              <span class="summary-label">Books Returned:</span>
              <span class="summary-value">${returnData.booksCount}</span>
            </div>
            <div class="summary">
              <span class="summary-label">Return Date:</span>
              <span class="summary-value">${new Date(returnData.returnedAt).toLocaleDateString()}</span>
            </div>
            <div class="summary" style="border-top: 2px solid #f0f0f0; padding-top: 15px; margin-top: 15px;">
              <span class="summary-label">Total Fine:</span>
              <span class="summary-value fine-value">₹${returnData.totalFine}</span>
            </div>
          </div>

          ${
            returnData.totalFine > 0
              ? `
          <div class="section" style="background: #FFF3E0; border-left: 4px solid #FF9500;">
            <h2 style="color: #FF9500;">⚠️ Fine Details</h2>
            <p>You have outstanding fines for overdue books. Please pay before issuing new books.</p>
            <p><strong>Fine Amount:</strong> ₹${returnData.totalFine}</p>
            <p style="color: #666; font-size: 12px;">Late return fee: ₹10 per day</p>
          </div>
          `
              : `
          <div class="section" style="background: #E7F5E7; border-left: 4px solid #34C759;">
            <h2 style="color: #34C759;">✓ No Fine</h2>
            <p>Great! All books were returned on time. No fine charged.</p>
          </div>
          `
          }

          <div class="section">
            <h2>ℹ️ Next Steps</h2>
            <ul>
              <li>Your books have been added back to library inventory</li>
              ${returnData.totalFine > 0 ? '<li>Please settle the fine before issuing new books</li>' : ''}
              <li>You can now issue new books from the library</li>
            </ul>
          </div>

          <div class="footer">
            <p>This is an automated email from Smart Library Management System</p>
            <p>If you have any questions, please contact the library staff</p>
            <p style="margin-top: 10px; color: #ccc;">SLMS © 2024 • All rights reserved</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Smart Library'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: `📚 Book Return Confirmation - ${returnData.booksCount} Book(s)`,
      html: htmlContent,
      text: `
Books Returned Successfully

Hi ${studentName},

Your books have been successfully returned.

Books Returned: ${returnData.booksCount}
Return Date: ${new Date(returnData.returnedAt).toLocaleDateString()}
Total Fine: ₹${returnData.totalFine}

Please log in to the Smart Library app for more details.

Best regards,
Smart Library Management System
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

/**
 * Send overdue reminder email
 * @param {string} email - Student email
 * @param {string} studentName - Student name
 * @param {Object} overdueData - Overdue books data
 */
async function sendOverdueReminderEmail(email, studentName, overdueData) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { background: #FFE5E5; border-left: 4px solid #FF3B30; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .alert h2 { color: #FF3B30; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f0f0f0; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📖 Book Return Reminder</h1>
          
          <div class="alert">
            <h2>⚠️ Overdue Books</h2>
            <p>Hi ${studentName},</p>
            <p>You have overdue books that need to be returned urgently. Late fines are accumulating!</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Due Date</th>
                <th>Days Overdue</th>
                <th>Fine</th>
              </tr>
            </thead>
            <tbody>
              ${overdueData.books
                .map(
                  (book) => `
              <tr>
                <td>${book.title}</td>
                <td>${new Date(book.dueDate).toLocaleDateString()}</td>
                <td style="color: #FF3B30; font-weight: bold;">${book.daysOverdue} days</td>
                <td style="color: #FF3B30; font-weight: bold;">₹${book.fine}</td>
              </tr>
            `
                )
                .join('')}
            </tbody>
          </table>

          <p style="margin-top: 20px;">
            <strong>Total Fine:</strong> <span style="color: #FF3B30; font-size: 18px;">₹${overdueData.totalFine}</span>
          </p>

          <p style="margin-top: 20px;">Please return these books as soon as possible to avoid additional fines.</p>
          
          <p>You can return books through the Smart Library app or visit the library in person.</p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Smart Library'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: `⚠️ URGENT: Overdue Books - Fine ₹${overdueData.totalFine}`,
      html: htmlContent,
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Overdue reminder email error:', error);
    throw error;
  }
}

module.exports = {
  sendFirebaseNotification,
  sendReturnEmailNotification,
  sendOverdueReminderEmail,
};
