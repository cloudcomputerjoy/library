/**
 * Integration Test Suite
 * Test all backend connections manually
 * Run this in your browser console or via Postman/Thunderclient
 */

// ============================================================
// TEST 1: BACKEND HEALTH CHECK
// ============================================================

const testBackendHealth = async () => {
  try {
    const response = await fetch('http://localhost:5000/health');
    const data = await response.json();
    console.log('✅ Backend Health:', data);
    return data;
  } catch (error) {
    console.error('❌ Backend Health Check Failed:', error);
  }
};

// ============================================================
// TEST 2: DATABASE CONNECTION
// ============================================================

const testDatabaseConnection = async () => {
  try {
    // Try fetching books (should work if DB is connected)
    const response = await fetch('http://localhost:5000/api/books');
    const data = await response.json();
    console.log('✅ Database Connected:', data);
    return data;
  } catch (error) {
    console.error('❌ Database Connection Failed:', error);
  }
};

// ============================================================
// TEST 3: USER REGISTRATION
// ============================================================

const testUserRegistration = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@campus.edu',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '01700000000',
        role: 'student',
      }),
    });
    const data = await response.json();
    console.log('✅ User Registration:', data);
    return data;
  } catch (error) {
    console.error('❌ User Registration Failed:', error);
  }
};

// ============================================================
// TEST 4: USER LOGIN
// ============================================================

const testUserLogin = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@campus.edu',
        password: 'TestPassword123!',
      }),
    });
    const data = await response.json();
    console.log('✅ User Login:', data);
    
    // Save token for next tests
    if (data.token) {
      localStorage.setItem('testToken', data.token);
    }
    
    return data;
  } catch (error) {
    console.error('❌ User Login Failed:', error);
  }
};

// ============================================================
// TEST 5: GET USER PROFILE
// ============================================================

const testGetProfile = async () => {
  try {
    const token = localStorage.getItem('testToken');
    const response = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log('✅ Get Profile:', data);
    return data;
  } catch (error) {
    console.error('❌ Get Profile Failed:', error);
  }
};

// ============================================================
// TEST 6: BOOK SEARCH
// ============================================================

const testBookSearch = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/books?search=javascript&limit=5');
    const data = await response.json();
    console.log('✅ Book Search:', data);
    return data;
  } catch (error) {
    console.error('❌ Book Search Failed:', error);
  }
};

// ============================================================
// TEST 7: ISSUE BOOK
// ============================================================

const testIssueBook = async (bookId, copyId) => {
  try {
    const token = localStorage.getItem('testToken');
    const response = await fetch('http://localhost:5000/api/transactions/issue', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookId,
        copyId,
      }),
    });
    const data = await response.json();
    console.log('✅ Issue Book:', data);
    return data;
  } catch (error) {
    console.error('❌ Issue Book Failed:', error);
  }
};

// ============================================================
// TEST 8: RETURN BOOK
// ============================================================

const testReturnBook = async (transactionId) => {
  try {
    const token = localStorage.getItem('testToken');
    const response = await fetch('http://localhost:5000/api/transactions/return', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId,
      }),
    });
    const data = await response.json();
    console.log('✅ Return Book:', data);
    return data;
  } catch (error) {
    console.error('❌ Return Book Failed:', error);
  }
};

// ============================================================
// RUN ALL TESTS
// ============================================================

const runAllTests = async () => {
  console.log('\n🧪 RUNNING INTEGRATION TESTS...\n');
  
  console.log('1️⃣  Testing Backend Health...');
  await testBackendHealth();
  
  console.log('\n2️⃣  Testing Database Connection...');
  await testDatabaseConnection();
  
  console.log('\n3️⃣  Testing User Registration...');
  const registerResult = await testUserRegistration();
  
  console.log('\n4️⃣  Testing User Login...');
  const loginResult = await testUserLogin();
  
  console.log('\n5️⃣  Testing Get Profile...');
  await testGetProfile();
  
  console.log('\n6️⃣  Testing Book Search...');
  await testBookSearch();
  
  console.log('\n✅ ALL TESTS COMPLETE\n');
};

// ============================================================
// BROWSER CONSOLE USAGE
// ============================================================

/*
To run tests in browser console:

1. Open Developer Tools (F12 / Right Click > Inspect)
2. Go to Console tab
3. Paste this entire file
4. Run: runAllTests()

Or run individual tests:
- testBackendHealth()
- testDatabaseConnection()
- testUserRegistration()
- testUserLogin()
- testGetProfile()
- testBookSearch()

Expected Results:
✅ All tests should show success messages
✅ No CORS errors
✅ Token should be saved and used
✅ Data should be returned from backend
*/

export {
  testBackendHealth,
  testDatabaseConnection,
  testUserRegistration,
  testUserLogin,
  testGetProfile,
  testBookSearch,
  testIssueBook,
  testReturnBook,
  runAllTests,
};
