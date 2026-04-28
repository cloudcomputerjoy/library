#!/usr/bin/env node

/**
 * Check Admin User Details
 * Displays all admin user information
 */

require('dotenv').config();
const { supabaseAdmin } = require('../src/config/database');

async function checkAdmin() {
  try {
    console.log('🔍 Checking admin user details...\n');

    const adminEmail = 'admin@smartlibrary.com';

    // Get admin user with all details
    const { data: admin, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }

    if (!admin) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }

    console.log('✅ Admin User Details:');
    console.log('─'.repeat(50));
    console.log('ID:', admin.id || 'No ID (⚠️  This may be the problem!)');
    console.log('Email:', admin.email);
    console.log('First Name:', admin.first_name);
    console.log('Last Name:', admin.last_name);
    console.log('Role:', admin.role);
    console.log('Status:', admin.is_active ? 'Active' : 'Inactive');
    console.log('Created:', admin.created_at);
    console.log('─'.repeat(50));

    if (!admin.id) {
      console.log('\n⚠️  WARNING: Admin user has no ID!');
      console.log('This is why login is failing.');
      console.log('\nSolution: The users table requires an ID that references auth.users.');
      console.log('You need to either:');
      console.log('1. Use Supabase Auth to create user first, then add to users table');
      console.log('2. Or modify the schema to not reference auth.users');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkAdmin();
