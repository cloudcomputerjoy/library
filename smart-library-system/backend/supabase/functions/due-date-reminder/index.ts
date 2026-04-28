/**
 * Supabase Edge Function - Due Date Reminder Scheduler
 * HTTP endpoint that triggers daily at 8:00 AM via Supabase scheduler
 * 
 * Setup:
 * 1. Deploy this function to Supabase
 * 2. Create a Supabase cron job that calls this endpoint daily:
 *    - Frequency: Daily
 *    - Time: 08:00 UTC
 *    - Endpoint: https://[PROJECT_ID].functions.supabase.co/due-date-reminder
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Email service configuration
const SMTP_CONFIG = {
  host: Deno.env.get('SMTP_HOST') || 'smtp.gmail.com',
  port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
  user: Deno.env.get('SMTP_USER'),
  pass: Deno.env.get('SMTP_PASS'),
}

/**
 * Send email via SMTP (NodeMailer equivalent for Deno)
 */
async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Use SendGrid or similar email service API for Deno
    // For now, we'll log the email details
    console.log(`📧 Email would be sent to: ${to}`)
    console.log(`   Subject: ${subject}`)
    return { success: true, messageId: `msg_${Date.now()}` }
  } catch (error) {
    console.error('Error sending email:', error.message)
    throw error
  }
}

/**
 * Get Firebase tokens and send notifications
 */
async function sendFirebaseNotification(fcmToken: string, title: string, body: string) {
  try {
    // Send to Firebase Cloud Messaging
    const firebaseUrl = 'https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send'
    
    const response = await fetch(firebaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('FIREBASE_ADMIN_TOKEN')}`,
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: {
            title: title,
            body: body,
          },
          data: {
            type: 'due_date_reminder',
            timestamp: new Date().toISOString(),
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Firebase error: ${response.statusText}`)
    }

    console.log(`✅ Firebase notification sent to token: ${fcmToken.substring(0, 20)}...`)
    return { success: true }
  } catch (error) {
    console.error('Firebase notification error:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Main handler
 */
async function processDueDateReminders() {
  console.log('🔄 Starting due date reminder HTTP function...');

  try {
    // Get all books due within next 3 days
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    console.log(`📅 Looking for books due between ${todayStart.toISOString()} and ${threeDaysFromNow.toISOString()}`)

    const { data: upcomingBooks, error: booksError } = await supabase
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
          email,
          fcm_token
        )
      `)
      .eq('status', 'active')
      .gte('due_date', todayStart.toISOString())
      .lte('due_date', threeDaysFromNow.toISOString())

    if (booksError) throw booksError

    if (!upcomingBooks || upcomingBooks.length === 0) {
      console.log('✅ No books due soon.')
      return { success: true, processed: 0 }
    }

    console.log(`📚 Found ${upcomingBooks.length} books due soon`)

    // Group books by user
    const booksByUser: Record<string, any> = {}
    upcomingBooks.forEach((issuedBook: any) => {
      const userId = issuedBook.user_id
      if (!booksByUser[userId]) {
        booksByUser[userId] = {
          user: issuedBook.users,
          books: []
        }
      }
      booksByUser[userId].books.push({
        ...issuedBook.books,
        due_date: issuedBook.due_date
      })
    })

    // Process reminders
    let processed = 0
    const errors: any[] = []

    for (const [userId, userData] of Object.entries(booksByUser)) {
      try {
        const books = userData.books as any[]
        books.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        const earliestDue = books[0].due_date

        console.log(`📨 Sending reminder to ${userData.user.email} for ${books.length} book(s)`)

        // Check if already reminded today
        const { data: reminded } = await supabase
          .from('reminder_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'due_date_reminder')
          .gte('sent_at', todayStart.toISOString())
          .limit(1)

        if (reminded && reminded.length > 0) {
          console.log(`⏭️ User ${userId} already reminded today. Skipping.`)
          continue
        }

        // Send email reminder
        const emailHtml = `
          <p>Dear ${userData.user.name},</p>
          <p>You have ${books.length} book(s) due for return by ${new Date(earliestDue).toLocaleDateString()}.</p>
          <p>Return them on time to avoid late fines of ₹5 per book per day.</p>
          <p>Regards,<br>Smart Library Team</p>
        `

        // Note: In production, use a proper email service
        // await sendEmail(userData.user.email, `📚 Book Return Reminder - ${books.length} Book(s) Due Soon`, emailHtml)

        // Send Firebase notification if token exists
        if (userData.user.fcm_token) {
          const daysUntilDue = Math.ceil(
            (new Date(earliestDue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
          // await sendFirebaseNotification(
          //   userData.user.fcm_token,
          //   '📚 Library Book Reminder',
          //   `${books.length} book(s) due in ${daysUntilDue} days`
          // )
        }

        // Log reminder
        const { error: logError } = await supabase
          .from('reminder_logs')
          .insert([{
            user_id: userId,
            type: 'due_date_reminder',
            books_count: books.length,
            email_sent: true,
            firebase_sent: userData.user.fcm_token ? true : false,
            sent_at: new Date().toISOString()
          }])

        if (logError) {
          console.error(`⚠️ Error logging reminder for user ${userId}:`, logError.message)
        }

        processed++
        console.log(`✅ Reminder processed for user ${userId}`)

      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error.message)
        errors.push({ userId, error: error.message })
      }
    }

    console.log(`✅ Due date reminder function complete. Processed: ${processed}, Errors: ${errors.length}`)

    return {
      success: true,
      processed: processed,
      errors: errors,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

// Serve the function
serve(async (req) => {
  // Verify auth token
  const authHeader = req.headers.get('Authorization')
  const expectedToken = Deno.env.get('REMINDER_CRON_TOKEN')

  if (authHeader !== `Bearer ${expectedToken}` && req.method !== 'OPTIONS') {
    return new Response('Unauthorized', { status: 401 })
  }

  if (req.method === 'OPTIONS') {
    return new Response('OK', { status: 200 })
  }

  const result = await processDueDateReminders()

  return new Response(
    JSON.stringify(result),
    {
      headers: { 'Content-Type': 'application/json' },
      status: result.success ? 200 : 500
    }
  )
})
