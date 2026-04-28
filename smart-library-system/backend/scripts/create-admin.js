#!/usr/bin/env node

/**
 * Create Default Admin User
 * 
 * This script creates the default admin account in Supabase
 * Run: node scripts/create-admin.js
 */

require('dotenv').config();
const { supabaseAdmin, supabase } = require('../src/config/database');
const { hashPassword } = require('../src/utils/password');

async function createAdmin() {
  try {
    console.log('🔧 Creating default admin user...\n');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartlibrary.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe@123';

    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${adminEmail}\n`);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(adminPassword);

    // Create admin user (using correct schema columns)
    const { data: adminUser, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: adminEmail,
          password_hash: hashedPassword,
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating admin:', error.message);
      console.error('Error details:', error);
      process.exit(1);
    }

    console.log('✅ Admin user created successfully!\n');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password:', adminPassword);
    console.log('\n⚠️  Please change this password after first login!\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

createAdmin();
