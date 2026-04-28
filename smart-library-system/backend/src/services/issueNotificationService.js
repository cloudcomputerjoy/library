/**
 * Book Issuance Notification Service
 * Sends Firebase notifications and emails when books are successfully issued
 * Includes real-time updates via Socket.IO
 */

const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const { supabase } = require('../config/database');

/**
 * Send book issuance email notification
 * @param {string} email - Student email
 * @param {string} studentName - Student name
 * @param {Object} issueData - Issue data with books and due date
 */
async function sendIssuanceEmailNotification(email, studentName, issueData) {
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
    const booksHTML = issueData.books
      .map(
        (book, idx) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          <strong>${idx + 1}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${book.title || 'Unknown'}</strong><br>
          <small style="color: #666;">ISBN: ${book.isbn || 'N/A'}</small>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          <span style="background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            Active
          </span>
        </td>
      </tr>
    `
      )
      .join('');

    const dueDateFormatted = new Date(issueData.dueDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; background: #f5f5f5; }
          .wrapper { background: #fff; margin: 20px auto; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { font-size: 14px; opacity: 0.9; }
          .content { padding: 30px 20px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 15px; border-left: 4px solid #667eea; padding-left: 12px; }
          .info-box { background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; border-radius: 4px; margin-bottom: 15px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .info-label { color: #666; font-size: 13px; }
          .info-value { color: #333; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          table th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: bold; color: #333; border-bottom: 2px solid #ddd; }
          table td { padding: 12px; border-bottom: 1px solid #eee; }
          .total-row { background: #f9f9f9; font-weight: bold; }
          .cta-button { background: #667eea; color: white; padding: 12px 24px; border-radius: 4px; text-align: center; text-decoration: none; display: inline-block; margin: 10px 0; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 13px; color: #856404; }
          .success-icon { font-size: 48px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <!-- Header -->
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>Books Issued Successfully!</h1>
            <p>Your book issuance transaction is complete</p>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Greeting -->
            <p>Dear <strong>${studentName}</strong>,</p>
            <p style="margin-bottom: 20px; color: #666;">
              Your library transaction has been processed successfully. Here are the details of your issued books:
            </p>

            <!-- Key Info -->
            <div class="section">
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">📅 Issue Date:</span>
                  <span class="info-value">${new Date(issueData.issuedAt).toLocaleDateString()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">⏰ Due Date:</span>
                  <span class="info-value">${dueDateFormatted}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">📚 Books Issued:</span>
                  <span class="info-value">${issueData.books.length}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">⏱ Borrowing Period:</span>
                  <span class="info-value">14 days</span>
                </div>
              </div>
            </div>

            <!-- Books Table -->
            <div class="section">
              <div class="section-title">📖 Issued Books</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 40px;">No.</th>
                    <th>Book Title</th>
                    <th style="width: 80px;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${booksHTML}
                </tbody>
              </table>
            </div>

            <!-- Important Notes -->
            <div class="section">
              <div class="section-title">⚠️ Important Reminders</div>
              <div class="warning">
                <strong>📌 Return Deadline:</strong> Please return these books by <strong>${dueDateFormatted}</strong> to avoid late fines.
              </div>
              <div class="warning">
                <strong>💰 Late Fine Policy:</strong> ₹5 per day per book after due date. Check your account for fine details.
              </div>
              <div class="warning">
                <strong>📱 Book Condition:</strong> Please verify book condition before leaving the counter. Report any issues immediately.
              </div>
            </div>

            <!-- What Next -->
            <div class="section">
              <div class="section-title">📋 What's Next?</div>
              <ul style="margin-left: 20px;">
                <li>Books are now added to your active collection</li>
                <li>You'll receive a reminder 3 days before the due date</li>
                <li>Track your books anytime in the app</li>
                <li>Renew books up to 3 times (if not reserved)</li>
              </ul>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin: 25px 0;">
              <a href="smart-library://active-books" class="cta-button">View My Books</a>
            </div>

            <!-- Support -->
            <div class="section">
              <div class="section-title">❓ Need Help?</div>
              <p style="font-size: 13px; color: #666;">
                If you have any questions about these books or this transaction, please contact our library support team.<br>
                <strong>📧 Email:</strong> support@library.university.edu<br>
                <strong>📞 Phone:</strong> +1 (555) 123-4567<br>
                <strong>🕐 Available:</strong> Monday - Friday, 9 AM - 6 PM
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Smart Library Management System</p>
            <p>This is an automated email. Please do not reply to this message.</p>
            <p style="margin-top: 10px; color: #999;">© 2026 Smart Library. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const result = await transporter.sendMail({
      from: `"Smart Library" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `✅ Book Issuance Confirmation - ${issueData.books.length} Book(s) Issued`,
      html: htmlContent,
    });

    console.log(`✅ Issuance email sent to ${email}:`, result.messageId);
    return {
      success: true,
      messageId: result.messageId,
      recipient: email
    };
  } catch (error) {
    console.error('❌ Error sending issuance email:', error.message);
    throw error;
  }
}

/**
 * Send Firebase notification for book issuance
 * @param {string} userId - User ID
 * @param {Object} issueData - Issue data
 */
async function sendIssuanceFirebaseNotification(userId, issueData) {
  try {
    // Get user's FCM token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('fcm_token')
      .eq('id', userId)
      .single();

    if (userError || !user?.fcm_token) {
      console.warn(`⚠️ No FCM token found for user ${userId}`);
      return { success: false, reason: 'No FCM token' };
    }

    if (!admin.apps.length) {
      console.warn('⚠️ Firebase not initialized');
      return { success: false, reason: 'Firebase not initialized' };
    }

    const bookTitles = issueData.books.map(b => b.title).join(', ');
    const dueDate = new Date(issueData.dueDate).toLocaleDateString();

    const message = {
      notification: {
        title: '📚 Books Issued Successfully',
        body: `${issueData.books.length} book(s) issued. Due: ${dueDate}`,
      },
      data: {
        type: 'book_issued',
        booksCount: issueData.books.length.toString(),
        bookTitles: bookTitles,
        dueDate: issueData.dueDate,
        sessionId: issueData.sessionId,
        timestamp: new Date().toISOString(),
      },
      webpush: {
        fcmOptions: {
          link: 'smart-library://active-books',
        },
      },
    };

    const response = await admin.messaging().send({
      ...message,
      token: user.fcm_token,
    });

    console.log(`✅ Firebase notification sent to user ${userId}:`, response);
    return {
      success: true,
      messageId: response,
      userId: userId
    };
  } catch (error) {
    console.error('❌ Firebase notification error:', error.message);
    throw error;
  }
}

/**
 * Emit real-time event for issuance success
 * @param {Object} io - Socket.IO instance
 * @param {string} userId - User ID
 * @param {Object} issueData - Issue data
 */
function emitIssuanceSuccessEvent(io, userId, issueData) {
  try {
    io.emit(`issuance_success_${userId}`, {
      type: 'issuance_complete',
      userId: userId,
      booksCount: issueData.books.length,
      dueDate: issueData.dueDate,
      issuedAt: issueData.issuedAt,
      books: issueData.books.map(book => ({
        id: book.id,
        title: book.title,
        isbn: book.isbn,
        dueDate: issueData.dueDate
      })),
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Real-time issuance event emitted for user ${userId}`);
  } catch (error) {
    console.error('❌ Error emitting real-time event:', error.message);
  }
}

/**
 * Send all notifications for book issuance
 * @param {Object} io - Socket.IO instance
 * @param {string} userId - User ID
 * @param {string} email - Student email
 * @param {string} studentName - Student name
 * @param {Array} books - Array of issued books
 * @param {string} sessionId - Session ID
 * @param {string} dueDate - Due date
 */
async function sendAllIssuanceNotifications(io, userId, email, studentName, books, sessionId, dueDate) {
  const issueData = {
    books: books,
    dueDate: dueDate,
    issuedAt: new Date().toISOString(),
    sessionId: sessionId
  };

  const results = {
    email: null,
    firebase: null,
    realtime: null,
    errors: []
  };

  // 1. Send Email
  try {
    results.email = await sendIssuanceEmailNotification(email, studentName, issueData);
  } catch (emailError) {
    console.error('⚠️ Email notification failed:', emailError.message);
    results.errors.push(`Email: ${emailError.message}`);
  }

  // 2. Send Firebase Notification
  try {
    results.firebase = await sendIssuanceFirebaseNotification(userId, issueData);
  } catch (firebaseError) {
    console.error('⚠️ Firebase notification failed:', firebaseError.message);
    results.errors.push(`Firebase: ${firebaseError.message}`);
  }

  // 3. Emit Real-time Event
  try {
    emitIssuanceSuccessEvent(io, userId, issueData);
    results.realtime = { success: true };
  } catch (realtimeError) {
    console.error('⚠️ Real-time event failed:', realtimeError.message);
    results.errors.push(`Real-time: ${realtimeError.message}`);
  }

  return results;
}

module.exports = {
  sendIssuanceEmailNotification,
  sendIssuanceFirebaseNotification,
  emitIssuanceSuccessEvent,
  sendAllIssuanceNotifications
};
