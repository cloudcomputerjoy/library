#!/usr/bin/env node

/**
 * Debug Password Verification
 * Tests the password hashing and comparison
 */

require('dotenv').config();
const { supabaseAdmin } = require('../src/config/database');
const { comparePassword } = require('../src/utils/password');

async function verifyPassword() {
  try {
    console.log('🔍 Verifying admin password...\n');

    const adminEmail = 'admin@smartlibrary.com';
    const testPassword = 'ChangeMe@123';

    // Get admin user
    const { data: admin, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (!admin) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }

    console.log('✅ Admin user found');
    console.log('📧 Email:', admin.email);
    console.log('🔐 Stored password hash:', admin.password_hash?.substring(0, 20) + '...');
    console.log('🧪 Testing password:', testPassword);

    // Test password comparison
    const isValid = await comparePassword(testPassword, admin.password_hash);
    console.log('\n📊 Password Comparison Result:', isValid ? '✅ VALID' : '❌ INVALID');

    if (!isValid) {
      console.log('\n⚠️  Password does not match!');
      console.log('Possible causes:');
      console.log('1. Password hash is corrupted in database');
      console.log('2. Wrong password being used');
      console.log('3. Database encoding issue');
    } else {
      console.log('\n✅ Password verification successful!');
      console.log('Login should work with:');
      console.log('  Email:', adminEmail);
      console.log('  Password:', testPassword);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verifyPassword();
