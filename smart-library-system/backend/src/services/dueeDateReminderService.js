/**
 * Due Date Reminder Service
 * Automatically scheduled task (via Supabase cron) to send reminders 3 days before due date
 * Sends email and Firebase notifications to users with books due soon
 */

const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const { supabase } = require('../config/database');

/**
 * Send due date reminder email
 * @param {string} email - Student email
 * @param {string} studentName - Student name
 * @param {Array} upcomingBooks - Books due soon
 * @param {string} dueDate - Due date of earliest book
 */
async function sendDueDateReminderEmail(email, studentName, upcomingBooks, dueDate) {
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

    const daysUntilDue = Math.ceil(
      (new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    const booksHTML = upcomingBooks
      .map(
        (book, idx) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          <strong>${idx + 1}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${book.title}</strong><br>
          <small style="color: #666;">ISBN: ${book.isbn || 'N/A'}</small>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          <span style="background: ${daysUntilDue <= 1 ? '#ffebee' : '#fff3e0'}; 
                       color: ${daysUntilDue <= 1 ? '#c62828' : '#e65100'}; 
                       padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${new Date(book.due_date).toLocaleDateString()}
          </span>
        </td>
      </tr>
    `
      )
      .join('');

    const urgencyLevel = daysUntilDue <= 1 ? 'critical' : daysUntilDue <= 2 ? 'high' : 'medium';
    const urgencyColor = daysUntilDue <= 1 ? '#c62828' : daysUntilDue <= 2 ? '#ff6f00' : '#fbc02d';
    const urgencyBg = daysUntilDue <= 1 ? '#ffebee' : daysUntilDue <= 2 ? '#fff3e0' : '#fffde7';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; background: #f5f5f5; }
          .wrapper { background: #fff; margin: 20px auto; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ff6f00 0%, #ff5722 100%); color: white; padding: 30px 20px; text-align: center; border-left: 8px solid #c62828; }
          .header h1 { font-size: 22px; margin-bottom: 5px; }
          .header p { font-size: 14px; opacity: 0.9; }
          .content { padding: 30px 20px; }
          .urgency-banner { 
            background: ${urgencyBg}; 
            border-left: 5px solid ${urgencyColor}; 
            padding: 15px; 
            border-radius: 4px; 
            margin-bottom: 20px;
          }
          .urgency-banner strong { color: ${urgencyColor}; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 15px; border-left: 4px solid #ff6f00; padding-left: 12px; }
          .info-box { background: #f0f4ff; border-left: 4px solid #1976d2; padding: 15px; border-radius: 4px; margin-bottom: 15px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .info-label { color: #666; font-size: 13px; }
          .info-value { color: #333; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          table th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: bold; color: #333; border-bottom: 2px solid #ddd; }
          table td { padding: 12px; border-bottom: 1px solid #eee; }
          .cta-button { background: #ff6f00; color: white; padding: 12px 24px; border-radius: 4px; text-align: center; text-decoration: none; display: inline-block; margin: 10px 0; }
          .cta-button:hover { background: #ff5722; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 4px; margin-bottom: 15px; font-size: 13px; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          .penalty { color: #c62828; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <!-- Header -->
          <div class="header">
            <h1>📚 Book Return Reminder</h1>
            <p>Your books are due soon!</p>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Greeting -->
            <p>Dear <strong>${studentName}</strong>,</p>
            <p style="margin-bottom: 20px; color: #666;">
              This is a friendly reminder that you have ${upcomingBooks.length} book(s) due for return soon.
            </p>

            <!-- Urgency Banner -->
            <div class="urgency-banner">
              <strong>⏰ ${daysUntilDue <= 0 ? 'OVERDUE!' : `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`}</strong><br>
              ${daysUntilDue <= 0 ? 'Your books are now overdue. Late fines are accumulating at ₹5 per day per book.' : 'Please return your books on or before the due date to avoid late fines.'}
            </div>

            <!-- Key Info -->
            <div class="section">
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">📖 Books Due:</span>
                  <span class="info-value">${upcomingBooks.length}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">📅 Latest Due Date:</span>
                  <span class="info-value">${new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">💰 Fine per day:</span>
                  <span class="info-value penalty">₹5 per book (after due date)</span>
                </div>
              </div>
            </div>

            <!-- Books Table -->
            <div class="section">
              <div class="section-title">📋 Books Requiring Attention</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 40px;">No.</th>
                    <th>Book Title</th>
                    <th style="width: 120px;">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${booksHTML}
                </tbody>
              </table>
            </div>

            <!-- Quick Actions -->
            <div class="section">
              <div class="section-title">✅ Quick Actions</div>
              <p style="margin-bottom: 15px; font-size: 14px; color: #666;">
                You can:
              </p>
              <ul style="margin-left: 20px; font-size: 13px;">
                <li>Return your books at the library counter</li>
                <li>Renew your books (up to 3 times, if not reserved)</li>
                <li>Check renewal availability in the app</li>
                <li>Pay any fines accumulated</li>
              </ul>
            </div>

            <!-- Renewal Info -->
            <div class="section">
              <div class="section-title">🔄 Renewal Policy</div>
              <div class="warning">
                <strong>📌 Renew Your Books:</strong> You can renew most books up to 3 times (14 days each) in the app, unless they have a reservation.
              </div>
              <div class="warning">
                <strong>💰 Late Fines:</strong> Fines accrue at ₹5 per book per day after the due date. Settle fines within 30 days or face account suspension.
              </div>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin: 25px 0;">
              <a href="smart-library://active-books" class="cta-button">View My Books & Renew</a>
            </div>

            <!-- Support -->
            <div class="section">
              <div class="section-title">❓ Questions?</div>
              <p style="font-size: 13px; color: #666;">
                Contact our library support team:<br>
                <strong>📧 Email:</strong> support@library.university.edu<br>
                <strong>📞 Phone:</strong> +1 (555) 123-4567<br>
                <strong>🕐 Available:</strong> Monday - Friday, 9 AM - 6 PM
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Smart Library Management System</p>
            <p>This is an automated reminder. Please do not reply to this message.</p>
            <p style="margin-top: 10px; color: #999;">© 2026 Smart Library. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await transporter.sendMail({
      from: `"Smart Library" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `⏰ Reminder: ${upcomingBooks.length} Book(s) Due ${daysUntilDue <= 1 ? 'Today/Soon' : `in ${daysUntilDue} days`}`,
      html: htmlContent,
    });

    console.log(`✅ Due date reminder email sent to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending due date reminder email:', error.message);
    throw error;
  }
}

/**
 * Send Firebase notification for due date reminder
 * @param {string} userId - User ID
 * @param {Array} upcomingBooks - Books due soon
 * @param {string} dueDate - Due date
 */
async function sendDueDateReminderFirebase(userId, upcomingBooks, dueDate) {
  try {
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

    const daysUntilDue = Math.ceil(
      (new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    const message = {
      notification: {
        title: '📚 Library Book Reminder',
        body: `${upcomingBooks.length} book(s) due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}. Return to avoid fines!`,
      },
      data: {
        type: 'due_date_reminder',
        booksCount: upcomingBooks.length.toString(),
        dueDate: dueDate,
        daysUntilDue: daysUntilDue.toString(),
        bookTitles: upcomingBooks.map(b => b.title).join('|'),
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

    console.log(`✅ Due date reminder Firebase notification sent to user ${userId}:`, response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Firebase reminder notification error:', error.message);
    throw error;
  }
}

/**
 * Process all due date reminders
 * Called via Supabase scheduled task (cron)
 * Runs daily at 8:00 AM
 */
async function processDueDateReminders() {
  try {
    console.log('🔄 Starting due date reminder processing...');

    // Get all books due within next 3 days (72 hours)
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const { data: upcomingBooksData, error: booksError } = await supabase
      .from('issued_books')
      .select(`
        id,
        user_id,
        book_id,
        due_date,
        books (
          id,
          title,
          isbn
        ),
        users (
          id,
          name,
          email
        )
      `)
      .eq('status', 'active')
      .lte('due_date', threeDaysFromNow.toISOString())
      .gt('due_date', new Date().toISOString());

    if (booksError) throw booksError;

    if (!upcomingBooksData || upcomingBooksData.length === 0) {
      console.log('✅ No books due soon. No reminders needed.');
      return { success: true, processed: 0, reminders: [] };
    }

    // Group books by user
    const booksByUser = {};
    upcomingBooksData.forEach(issuedBook => {
      const userId = issuedBook.user_id;
      if (!booksByUser[userId]) {
        booksByUser[userId] = {
          user: issuedBook.users,
          books: []
        };
      }
      booksByUser[userId].books.push({
        ...issuedBook.books,
        due_date: issuedBook.due_date,
        issue_id: issuedBook.id
      });
    });

    const processedReminders = [];
    const errors = [];

    // Send reminders for each user
    for (const [userId, userData] of Object.entries(booksByUser)) {
      try {
        // Sort by due date to get earliest
        userData.books.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        const earliestDue = userData.books[0].due_date;

        // Check if reminder already sent today
        const { data: existingReminder } = await supabase
          .from('reminder_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'due_date_reminder')
          .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (existingReminder && existingReminder.length > 0) {
          console.log(`⏭️ Reminder already sent to user ${userId} today. Skipping.`);
          continue;
        }

        const emailResult = await sendDueDateReminderEmail(
          userData.user.email,
          userData.user.name,
          userData.books,
          earliestDue
        );

        const firebaseResult = await sendDueDateReminderFirebase(
          userId,
          userData.books,
          earliestDue
        );

        // Log the reminder
        await supabase
          .from('reminder_logs')
          .insert([{
            user_id: userId,
            type: 'due_date_reminder',
            books_count: userData.books.length,
            email_sent: emailResult.success,
            firebase_sent: firebaseResult.success,
            sent_at: new Date().toISOString()
          }]);

        processedReminders.push({
          userId: userId,
          userName: userData.user.name,
          booksCount: userData.books.length,
          emailSent: emailResult.success,
          firebaseSent: firebaseResult.success
        });

      } catch (userError) {
        console.error(`❌ Error sending reminder to user ${userId}:`, userError.message);
        errors.push({
          userId: userId,
          error: userError.message
        });
      }
    }

    console.log(`✅ Due date reminder processing complete. Processed: ${processedReminders.length}, Errors: ${errors.length}`);

    return {
      success: true,
      processed: processedReminders.length,
      reminders: processedReminders,
      errors: errors
    };

  } catch (error) {
    console.error('❌ Fatal error in due date reminder processing:', error.message);
    throw error;
  }
}

module.exports = {
  sendDueDateReminderEmail,
  sendDueDateReminderFirebase,
  processDueDateReminders
};
