const express = require('express');
const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateSecureToken,
} = require('../utils/password');
const {
  validateEmail,
  validatePhoneNumber,
  validateRequired,
  validateLength,
} = require('../utils/validator');
const {
  APIError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  asyncHandler,
} = require('../middleware/errorHandler');
const nodemailer = require('nodemailer');

const router = express.Router();

// Email transporter for password reset emails
let emailTransporter;
const initEmailTransporter = () => {
  if (process.env.SMTP_HOST) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
};

const sendResetEmail = async (email, resetLink) => {
  if (!emailTransporter) return;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@smartlibrary.com',
    to: email,
    subject: 'Password Reset - Smart Library Admin',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your Smart Library admin account.</p>
      <p>Click the link below to reset your password (link expires in 1 hour):</p>
      <a href="${resetLink}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
      <p>Or copy and paste this link: ${resetLink}</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending reset email:', error);
  }
};

// Initialize email on startup
initEmailTransporter();

const getRefreshTokenSecret = () =>
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const generateAccessToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    getRefreshTokenSecret(),
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d' }
  );

/**
 * POST /auth/register
 * Register new user (student or staff)
 */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, phone, firstName, lastName, role, studentId } = req.body;

    // Validation
    const validation = validateRequired(email, 'Email');
    if (!validation.valid) throw new ValidationError(validation.error);

    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!password) throw new ValidationError('Password is required');

    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.valid) {
      throw new ValidationError('Password too weak', { password: passwordStrength.errors });
    }

    if (phone && !validatePhoneNumber(phone)) {
      throw new ValidationError('Invalid phone number format');
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new ConflictError('Email already registered', 'EMAIL_EXISTS');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          phone,
          first_name: firstName,
          last_name: lastName,
          role: role || 'student',
          student_id: studentId,
          status: 'active',
          created_at: new Date(),
        },
      ])
      .select()
      .single();

    if (userError) {
      throw new APIError(userError.message);
    }

    // If student, create library card
    if (role === 'student') {
      const { data: libraryCard } = await supabaseAdmin
        .from('library_cards')
        .insert([
          {
            user_id: newUser.id,
            qr_id: `QR-${newUser.id}-${Date.now()}`,
            status: 'active',
            created_at: new Date(),
          },
        ])
        .select()
        .single();
    }

    // Generate JWT tokens
    const token = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
      },
      token,
      refreshToken,
      expiresIn: 86400, // 24 hours in seconds
    });
  })
);

/**
 * POST /auth/login
 * User login with email and password
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user || userError) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if account is active (use is_active column)
    if (user.is_active === false) {
      throw new UnauthorizedError('Account is not active');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date() })
      .eq('id', user.id);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      token,
      refreshToken,
      expiresIn: 86400, // 24 hours in seconds
    });
  })
);

/**
 * Refresh access token using refresh token
 */
const handleRefreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  try {
    const decoded = jwt.verify(refreshToken, getRefreshTokenSecret());
    const user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    const token = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token,
      refreshToken: newRefreshToken,
      expiresIn: 86400,
    });
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

router.post('/refresh-token', asyncHandler(handleRefreshToken));
router.post('/refresh', asyncHandler(handleRefreshToken));

router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      throw new ValidationError('Valid email is required');
    }

    // Find user by email
    const { data: user } = await supabase
      .from('users')
      .select('id, email, first_name')
      .eq('email', email)
      .single();

    // Don't reveal if email exists (security best practice)
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists for this email, a reset link has been sent',
      });
    }

    try {
      // Generate reset token
      const resetToken = generateSecureToken(32);
      const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in database
      await supabaseAdmin
        .from('password_resets')
        .insert([
          {
            user_id: user.id,
            email: user.email,
            reset_token: resetToken,
            token_expiry: tokenExpiry,
            used: false,
            created_at: new Date(),
          },
        ]);

      // Generate reset link
      const resetLink = `${process.env.ADMIN_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      // Send email
      await sendResetEmail(email, resetLink);

      res.json({
        success: true,
        message: 'If an account exists for this email, a reset link has been sent',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      // Don't reveal error details
      res.json({
        success: true,
        message: 'If an account exists for this email, a reset link has been sent',
      });
    }
  })
);

router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      throw new ValidationError('Token, email, and new password are required');
    }

    if (!validateEmail(email)) {
      throw new ValidationError('Valid email is required');
    }

    const passwordStrength = validatePasswordStrength(newPassword);
    if (!passwordStrength.valid) {
      throw new ValidationError('New password too weak', { password: passwordStrength.errors });
    }

    try {
      // Find reset token
      const { data: resetRecord } = await supabase
        .from('password_resets')
        .select('*')
        .eq('reset_token', token)
        .eq('email', email)
        .eq('used', false)
        .single();

      if (!resetRecord) {
        throw new UnauthorizedError('Invalid or expired reset token');
      }

      // Check if token has expired
      if (new Date(resetRecord.token_expiry) < new Date()) {
        throw new UnauthorizedError('Reset token has expired');
      }

      // Get user
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await supabaseAdmin
        .from('users')
        .update({
          password_hash: hashedPassword,
          updated_at: new Date(),
        })
        .eq('id', user.id);

      // Mark token as used
      await supabaseAdmin
        .from('password_resets')
        .update({
          used: true,
          used_at: new Date(),
        })
        .eq('id', resetRecord.id);

      res.json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new APIError('Password reset failed');
    }
  })
);

/**
 * Verify reset token (for frontend validation)
 */
router.post(
  '/verify-reset-token',
  asyncHandler(async (req, res) => {
    const { token, email } = req.body;

    if (!token || !email) {
      throw new ValidationError('Token and email are required');
    }

    const { data: resetRecord } = await supabase
      .from('password_resets')
      .select('*')
      .eq('reset_token', token)
      .eq('email', email)
      .eq('used', false)
      .single();

    if (!resetRecord) {
      throw new UnauthorizedError('Invalid reset token');
    }

    if (new Date(resetRecord.token_expiry) < new Date()) {
      throw new UnauthorizedError('Reset token has expired');
    }

    res.json({
      success: true,
      message: 'Reset token is valid',
      data: {
        valid: true,
        expiresAt: resetRecord.token_expiry,
      },
    });
  })
);

/**
 * POST /auth/logout
 * Logout user (client-side token deletion)
 */
router.post(
  '/logout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Token invalidation should be handled on client
    // Can optionally add token to blacklist in database

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

/**
 * GET /auth/me
 * Get current user profile
 */
router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, role, status, created_at')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      throw new APIError('User not found', 404);
    }

    res.json({
      success: true,
      user,
    });
  })
);

/**
 * PUT /auth/update-profile
 * Update user profile
 */
router.put(
  '/update-profile',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, phone } = req.body;

    // Validation
    if (phone && !validatePhoneNumber(phone)) {
      throw new ValidationError('Invalid phone number format');
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        updated_at: new Date(),
      })
      .eq('id', req.userId)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  })
);

router.put(
  '/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, phone } = req.body;

    if (phone && !validatePhoneNumber(phone)) {
      throw new ValidationError('Invalid phone number format');
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        updated_at: new Date(),
      })
      .eq('id', req.userId)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  })
);

/**
 * PUT /auth/change-password
 * Change user password
 */
const handleChangePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword) {
    throw new ValidationError('Current password and new password are required');
  }

  // Get current password hash
  const { data: user } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', req.userId)
    .single();

  if (!user) {
    throw new APIError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await comparePassword(
    currentPassword,
    user.password_hash
  );
  if (!isCurrentPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Validate new password strength
  const passwordStrength = validatePasswordStrength(newPassword);
  if (!passwordStrength.valid) {
    throw new ValidationError('New password too weak', { password: passwordStrength.errors });
  }

  // Hash new password
  const hashedNewPassword = await hashPassword(newPassword);

  // Update password
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      password_hash: hashedNewPassword,
      updated_at: new Date(),
    })
    .eq('id', req.userId);

  if (error) {
    throw new APIError(error.message);
  }

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
};

router.put(
  '/change-password',
  authenticateToken,
  asyncHandler(handleChangePassword)
);

router.post(
  '/change-password',
  authenticateToken,
  asyncHandler(handleChangePassword)
);

/**
 * POST /auth/request-otp
 * Request OTP for password reset via email
 */
router.post(
  '/request-otp',
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      throw new ValidationError('Valid email is required');
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (!user) {
      // For security, don't reveal if email exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, an OTP has been sent',
      });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .insert([
        {
          user_id: user.id,
          code: otp,
          purpose: 'password_reset',
          expires_at: otpExpiresAt,
          created_at: new Date(),
        },
      ]);

    if (otpError) {
      throw new APIError('Failed to generate OTP', 500);
    }

    // TODO: Send OTP via email using emailService
    console.log(`OTP for ${email}: ${otp}`); // Temporary logging

    res.json({
      success: true,
      message: 'OTP has been sent to your email',
      // For development: returns OTP (remove in production)
      otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  })
);

/**
 * POST /auth/verify-otp
 * Verify OTP code and get password reset token
 */
router.post(
  '/verify-otp',
  asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new ValidationError('Email and OTP are required');
    }

    if (!validateEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      throw new UnauthorizedError('Invalid email or OTP');
    }

    // Verify OTP
    const { data: otpRecord } = await supabase
      .from('otp_codes')
      .select('id, code, expires_at, used_at')
      .eq('user_id', user.id)
      .eq('code', otp)
      .eq('purpose', 'password_reset')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!otpRecord || otpRecord.length === 0) {
      throw new UnauthorizedError('Invalid OTP');
    }

    const record = otpRecord[0];

    // Check if OTP is expired
    if (new Date(record.expires_at) < new Date()) {
      throw new UnauthorizedError('OTP has expired. Please request a new one.');
    }

    // Check if OTP was already used
    if (record.used_at) {
      throw new UnauthorizedError('OTP has already been used');
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('otp_codes')
      .update({ used_at: new Date() })
      .eq('id', record.id);

    // Generate password reset token (short-lived JWT)
    const resetToken = jwt.sign(
      {
        userId: user.id,
        purpose: 'password_reset',
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // 15 minutes validity
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken,
      expiresIn: 900, // 15 minutes in seconds
    });
  })
);

/**
 * POST /auth/reset-password-with-token
 * Reset password using OTP-verified reset token
 */
router.post(
  '/reset-password-with-token',
  asyncHandler(async (req, res) => {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      throw new ValidationError('Reset token and new password are required');
    }

    // Validate new password strength
    const passwordStrength = validatePasswordStrength(newPassword);
    if (!passwordStrength.valid) {
      throw new ValidationError('Password too weak', { password: passwordStrength.errors });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    // Verify token purpose
    if (decoded.purpose !== 'password_reset') {
      throw new UnauthorizedError('Invalid token for password reset');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date(),
      })
      .eq('id', decoded.userId);

    if (updateError) {
      throw new APIError('Failed to reset password', 500);
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  })
);

module.exports = router;
