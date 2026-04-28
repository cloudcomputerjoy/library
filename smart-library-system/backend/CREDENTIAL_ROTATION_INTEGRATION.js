/**
 * Integration Guide - Credential Rotation System
 * How to integrate email and API key rotation into your application
 */

// ============================================
// 1. ADD ROUTES TO MAIN SERVER
// ============================================

// In your main server.js or app.js file, add:

import credentialManagementRoutes from './src/routes/credentialManagementRoutes.js';

// ... after other routes ...

app.use('/api/credentials', credentialManagementRoutes);

// ============================================
// 2. INITIALIZE ROTATORS ON SERVER START
// ============================================

import emailRotator from './src/services/emailCredentialRotator.js';
import apiKeyRotator from './src/services/apiKeyRotator.js';

// During server initialization:
async function initializeRotators() {
  try {
    // Load email credentials
    await emailRotator.loadCredentials();
    console.log('✅ Email rotator initialized');

    // Load API keys
    await apiKeyRotator.loadAPIKeys();
    console.log('✅ API key rotator initialized');

    // Run health checks periodically
    setInterval(async () => {
      await emailRotator.healthCheck();
    }, 60 * 60 * 1000); // Every hour

    setInterval(async () => {
      await apiKeyRotator.healthCheck();
    }, 6 * 60 * 60 * 1000); // Every 6 hours
  } catch (error) {
    console.error('❌ Error initializing rotators:', error);
  }
}

// Call during app startup
initializeRotators();

// ============================================
// 3. USE EMAIL ROTATION IN CONTROLLERS
// ============================================

import emailRotator from '../services/emailCredentialRotator.js';

// In your email sending controller:
export const sendEmailWithRotation = async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    // Use the rotator to send - it automatically handles failover
    const result = await emailRotator.sendEmail({
      to,
      subject,
      html,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// 4. USE API KEY ROTATION IN CONTROLLERS
// ============================================

import apiKeyRotator from '../services/apiKeyRotator.js';

// In your AI/OpenRouter controller:
export const makeAIRequest = async (req, res) => {
  try {
    const { messages, model, maxTokens } = req.body;

    // Use the rotator to make request - it automatically handles failover
    const response = await apiKeyRotator.makeRequest({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      data: {
        model: model || 'gpt-3.5-turbo',
        messages,
        max_tokens: maxTokens || 1000,
      },
    });

    return res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error making AI request:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// 5. MIGRATION - RUN ON DATABASE SETUP
// ============================================

import migrationSQL from './src/migrations/create_credential_tables.sql.js';

// After connecting to Supabase, run:
async function runMigrations() {
  try {
    const { error } = await supabase.rpc('exec', {
      sql: migrationSQL,
    });

    if (error) throw error;
    console.log('✅ Credential tables created');
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

// ============================================
// 6. API ENDPOINTS REFERENCE
// ============================================

/*
EMAIL CREDENTIALS ENDPOINTS:
================================

GET /api/credentials/email
  - Get all email credentials with statistics
  - Requires: admin role
  - Response: { credentials: [...], statistics: {...} }

POST /api/credentials/email
  - Add new email credential
  - Requires: admin role
  - Body: {
      email: "sender@gmail.com",
      password: "app-specific-password",
      fromName: "Library System",
      priority: 10,
      smtpHost: "smtp.gmail.com",
      smtpPort: 587
    }

PUT /api/credentials/email/:id
  - Enable/disable credential or change priority
  - Requires: admin role
  - Body: { enabled: true, priority: 5 }

DELETE /api/credentials/email/:id
  - Remove email credential
  - Requires: admin role

POST /api/credentials/email/test/:id
  - Test specific email credential
  - Requires: admin role
  - Response: { message: "✅ email@gmail.com is working correctly" }

POST /api/credentials/email/health-check
  - Run health check on all email credentials
  - Requires: admin role
  - Response: { data: [...] }


API KEYS ENDPOINTS:
================================

GET /api/credentials/apikeys
  - Get all OpenRouter API keys with statistics
  - Requires: admin role
  - Response: { keys: [...], statistics: {...} }

POST /api/credentials/apikeys
  - Add new API key
  - Requires: admin role
  - Body: {
      apiKey: "sk-...",
      name: "Primary Key",
      description: "Main API key",
      priority: 10,
      monthlyLimit: 1000000
    }

PUT /api/credentials/apikeys/:id
  - Enable/disable key or change priority
  - Requires: admin role
  - Body: { enabled: true, priority: 5 }

DELETE /api/credentials/apikeys/:id
  - Remove API key
  - Requires: admin role

POST /api/credentials/apikeys/test/:id
  - Test specific API key
  - Requires: admin role
  - Response: { message: "✅ API key is working correctly", data: {...} }

POST /api/credentials/apikeys/health-check
  - Run health check on all API keys
  - Requires: admin role
  - Response: { data: [...] }

POST /api/credentials/apikeys/reset-stats
  - Reset failure and request statistics
  - Requires: admin role
*/

// ============================================
// 7. USAGE EXAMPLES
// ============================================

// EXAMPLE 1: Send email (automatic rotation and failover)
async function sendNotificationEmail() {
  try {
    const result = await emailRotator.sendEmail({
      to: 'user@example.com',
      subject: 'Book Available',
      html: '<p>Your requested book is now available!</p>',
    });
    console.log('Email sent:', result.messageId);
  } catch (error) {
    console.error('Failed to send email:', error.message);
  }
}

// EXAMPLE 2: Make AI request (automatic rotation and failover)
async function getBookRecommendation() {
  try {
    const response = await apiKeyRotator.makeRequest({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      data: {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Recommend a book for someone who likes mystery novels',
          },
        ],
        max_tokens: 500,
      },
    });
    console.log('Recommendation:', response.choices[0].message.content);
  } catch (error) {
    console.error('Failed to get recommendation:', error.message);
  }
}

// EXAMPLE 3: Get rotation statistics
async function getStatistics() {
  const emailStats = emailRotator.getStatistics();
  const apiStats = apiKeyRotator.getStatistics();

  console.log('Email Statistics:', {
    totalCredentials: emailStats.totalCredentials,
    enabledCredentials: emailStats.enabledCredentials,
    healthStatus: emailStats.healthStatus,
  });

  console.log('API Statistics:', {
    totalKeys: apiStats.totalKeys,
    enabledKeys: apiStats.enabledKeys,
    healthStatus: apiStats.healthStatus,
  });
}

// ============================================
// 8. ENVIRONMENT VARIABLES
// ============================================

/*
No additional environment variables needed! 
All credentials are stored securely in the database.

However, you may want to set these optional variables:

# Health check intervals (optional, defaults provided)
EMAIL_HEALTH_CHECK_INTERVAL=3600  # 1 hour
API_KEY_HEALTH_CHECK_INTERVAL=21600  # 6 hours

# Failure thresholds (optional)
EMAIL_FAILURE_THRESHOLD=5  # Disable after 5 failures
API_KEY_FAILURE_THRESHOLD=10  # Disable after 10 failures
*/

// ============================================
// 9. ERROR HANDLING
// ============================================

/*
The rotators handle errors gracefully:

1. Email sending failures:
   - Automatically tries next credential
   - Logs failed attempts to database
   - Disables credentials after threshold
   - Falls back to next healthy credential

2. API key failures:
   - Distinguishes between rate limiting and auth errors
   - Rate limits: Switch to next key, track reset time
   - Auth errors: Disable key immediately
   - Tracks remaining requests from response headers

3. Health checks:
   - Run automatically on schedule
   - Can be triggered manually via API
   - Results stored in database for audit trail
*/

// ============================================
// 10. MONITORING & LOGGING
// ============================================

/*
The system logs everything to database:

- email_logs: All email sending attempts
- email_health_checks: Credential health status
- api_request_logs: All API requests
- api_key_health_checks: API key health status

Query examples:

-- Failed emails
SELECT * FROM email_logs WHERE status = 'failed' ORDER BY sent_at DESC;

-- API key usage
SELECT api_key_id, COUNT(*) as requests 
FROM api_request_logs 
GROUP BY api_key_id;

-- Unhealthy credentials
SELECT * FROM email_health_checks WHERE status = 'unhealthy';

-- Rate limited keys
SELECT * FROM api_key_health_checks 
WHERE remaining_requests = 0;
*/

export default {
  initializeRotators,
  sendEmailWithRotation,
  makeAIRequest,
  getStatistics,
};
