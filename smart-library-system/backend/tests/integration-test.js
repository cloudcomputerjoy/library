/**
 * Backend Integration Test Suite
 * Verifies all API endpoints match mobile app expectations
 * 
 * Run with: node backend/tests/integration-test.js
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Test123!@#',
  phone: '+1234567890',
  firstName: 'Test',
  lastName: 'User',
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Test results tracker
let passed = 0;
let failed = 0;
const failedTests = [];

// Helper function to test an endpoint
async function testEndpoint(method, endpoint, description, data = null, headers = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    console.log(
      `${colors.green}✓${colors.reset} ${method.padEnd(6)} ${endpoint.padEnd(40)} - ${description}`
    );
    passed++;
    return response.data;
  } catch (error) {
    const status = error.response?.status || 'N/A';
    const errorMsg = error.response?.data?.message || error.message;
    console.log(
      `${colors.red}✗${colors.reset} ${method.padEnd(6)} ${endpoint.padEnd(40)} - ${description} (${status})`
    );
    failed++;
    failedTests.push({
      endpoint,
      description,
      status,
      error: errorMsg,
    });
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.blue}${'='.repeat(90)}${colors.reset}`);
  console.log(`${colors.blue}Backend-Frontend Integration Test Suite${colors.reset}`);
  console.log(`${colors.blue}API Base: ${API_BASE}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(90)}${colors.reset}\n`);

  let authToken = null;

  try {
    // ============================================================
    // AUTH ENDPOINTS
    // ============================================================
    console.log(`${colors.yellow}🔐 AUTHENTICATION ENDPOINTS${colors.reset}`);

    // Register
    const registerRes = await testEndpoint(
      'POST',
      '/auth/register',
      'User registration',
      testUser
    );

    if (registerRes?.token) {
      authToken = registerRes.token;
    }

    // Note: Login might fail if user exists, which is OK for this test
    const loginRes = await testEndpoint(
      'POST',
      '/auth/login',
      'User login',
      { email: testUser.email, password: testUser.password }
    );

    if (loginRes?.token) {
      authToken = loginRes.token;
    }

    // Get Profile
    await testEndpoint(
      'GET',
      '/auth/me',
      'Get current user profile',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    // Update Profile
    await testEndpoint(
      'PUT',
      '/auth/me',
      'Update user profile',
      { firstName: 'Updated' },
      { Authorization: `Bearer ${authToken}` }
    );

    // Change Password (will likely fail without knowing current password, which is OK)
    await testEndpoint(
      'POST',
      '/auth/change-password',
      'Change password',
      { currentPassword: 'wrong', newPassword: 'New123!@#' },
      { Authorization: `Bearer ${authToken}` }
    );

    console.log();

    // ============================================================
    // BOOKS ENDPOINTS
    // ============================================================
    console.log(`${colors.yellow}📚 BOOKS ENDPOINTS${colors.reset}`);

    await testEndpoint(
      'GET',
      '/books',
      'List books',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'GET',
      '/books/featured',
      'Get featured books',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'GET',
      '/books/search?q=history',
      'Search books',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'GET',
      '/books/category/1',
      'Get books by category',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    console.log();

    // ============================================================
    // TRANSACTION ENDPOINTS
    // ============================================================
    console.log(`${colors.yellow}🔄 TRANSACTION ENDPOINTS${colors.reset}`);

    await testEndpoint(
      'GET',
      '/transactions/active',
      'Get active borrowed books',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'GET',
      '/transactions/history',
      'Get transaction history',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'GET',
      '/transactions/fines',
      'Get user fines',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    console.log();

    // ============================================================
    // PAYMENT ENDPOINTS
    // ============================================================
    console.log(`${colors.yellow}💳 PAYMENT ENDPOINTS${colors.reset}`);

    await testEndpoint(
      'GET',
      '/payments/fines/outstanding',
      'Get outstanding fines',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'GET',
      '/payments/history',
      'Get payment history',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'GET',
      '/payments/summary',
      'Get payment summary',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    console.log();

    // ============================================================
    // NOTIFICATION ENDPOINTS
    // ============================================================
    console.log(`${colors.yellow}🔔 NOTIFICATION ENDPOINTS${colors.reset}`);

    await testEndpoint(
      'GET',
      '/notifications',
      'Get notifications',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'GET',
      '/notifications/unread-count',
      'Get unread count',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'GET',
      '/notifications/preferences',
      'Get notification preferences',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    console.log();

    // ============================================================
    // FILE ENDPOINTS
    // ============================================================
    console.log(`${colors.yellow}📁 FILE ENDPOINTS${colors.reset}`);

    await testEndpoint(
      'GET',
      '/files/my-files',
      'Get user files',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'POST',
      '/files/1/share',
      'Share file',
      { recipientIds: [1, 2] },
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'POST',
      '/files/revoke-access',
      'Revoke file access',
      { fileId: 1 },
      { Authorization: `Bearer ${authToken}` }
    );

    console.log();

    // ============================================================
    // QR CODE ENDPOINTS
    // ============================================================
    console.log(`${colors.yellow}🎫 QR CODE ENDPOINTS${colors.reset}`);

    await testEndpoint(
      'GET',
      '/qr/user',
      'Generate user QR',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'GET',
      '/qr/book/1',
      'Generate book QR',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'GET',
      '/qr/history',
      'Get QR history',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    console.log();

    // ============================================================
    // RFID ENDPOINTS
    // ============================================================
    console.log(`${colors.yellow}🔐 RFID ENDPOINTS${colors.reset}`);

    await testEndpoint(
      'GET',
      '/rfid/cards',
      'Get user RFID cards',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'GET',
      '/rfid/logs',
      'Get RFID logs',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    console.log();

    // ============================================================
    // CATEGORIES & SEARCH
    // ============================================================
    console.log(`${colors.yellow}📂 CATEGORIES & SEARCH${colors.reset}`);

    await testEndpoint(
      'GET',
      '/categories',
      'Get all categories',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    await testEndpoint(
      'GET',
      '/search?q=test',
      'Global search',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    console.log();
  } catch (error) {
    console.error(`${colors.red}Fatal error during tests:${colors.reset}`, error.message);
  }

  // ============================================================
  // RESULTS SUMMARY
  // ============================================================
  console.log(`${colors.blue}${'='.repeat(90)}${colors.reset}`);
  console.log(`${colors.blue}TEST RESULTS${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(90)}${colors.reset}`);
  console.log(
    `${colors.green}✓ Passed: ${passed}${colors.reset} | ${colors.red}✗ Failed: ${failed}${colors.reset}`
  );

  if (failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    failedTests.forEach((test, index) => {
      console.log(
        `\n${index + 1}. ${test.endpoint} - ${test.description}`
      );
      console.log(`   Status: ${test.status}`);
      console.log(`   Error: ${test.error}`);
    });
  }

  const percentage = Math.round((passed / (passed + failed)) * 100);
  console.log(`\n${colors.blue}Success Rate: ${percentage}%${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(90)}${colors.reset}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(console.error);
