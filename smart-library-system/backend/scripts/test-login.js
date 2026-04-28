#!/usr/bin/env node

/**
 * Test Login Endpoint
 * Tests the login endpoint directly
 */

const http = require('http');

function testLogin() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'admin@smartlibrary.com',
      password: 'ChangeMe@123'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('\n📊 Login Endpoint Response:');
        console.log('─'.repeat(50));
        console.log('Status Code:', res.statusCode);
        console.log('Status Message:', res.statusMessage);
        console.log('Headers:', res.headers);
        console.log('Body:', responseData);
        console.log('─'.repeat(50));
        
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.success) {
            console.log('\n✅ Login successful!');
            console.log('Token:', parsed.token?.substring(0, 30) + '...');
            console.log('User:', parsed.user);
          } else {
            console.log('\n❌ Login failed:', parsed.message);
          }
        } catch (e) {
          console.log('\n❌ Error parsing response');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    console.log('🧪 Testing Login Endpoint...');
    console.log('URL: http://localhost:5000/api/auth/login');
    console.log('Email: admin@smartlibrary.com');
    console.log('Password: ChangeMe@123');

    req.write(data);
    req.end();
  });
}

testLogin().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
