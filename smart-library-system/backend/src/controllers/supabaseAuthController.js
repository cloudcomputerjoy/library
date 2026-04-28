/**
 * Admin Authentication Controller
 * Handles Supabase authentication, login, logout, and token management
 * 
 * Features:
 * - Email/Password authentication via Supabase
 * - JWT token generation and refresh
 * - Admin role verification
 * - Session management
 * - Audit logging
 */

const supabase = require('../config/supabaseAuth');
const jwt = require('jsonwebtoken');

class AuthController {
  /**
   * Login endpoint - Authenticate admin with email/password
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Log authentication attempt
      await logAuthEvent('login', email, 'attempt', req);

      if (error) {
        await logAuthEvent('login', email, 'failed', req, error.message);
        
        // Don't reveal if email exists or not (security best practice)
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const user = data.user;
      const session = data.session;

      // Verify user is admin
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (adminError || !adminUser) {
        await logAuthEvent('login', email, 'failed', req, 'Not an admin user');
        
        // Sign out the user since they're not an admin
        await supabase.auth.signOut({ scope: 'global' });

        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Log successful login
      await logAuthEvent('login', email, 'success', req);

      // Generate additional JWT for backend use (optional)
      const backendToken = generateToken(user.id, email);

      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: adminUser.full_name
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          backend_token: backendToken
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Logout endpoint - Revoke auth session
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    try {
      const userId = req.user?.id;
      const email = req.user?.email;

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) {
        console.error('Logout error:', error);
      }

      // Log logout event
      await logAuthEvent('logout', email, 'success', req);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }

  /**
   * Verify token - Check if current token is valid
   * GET /api/auth/verify
   */
  static async verify(req, res) {
    try {
      const userId = req.user?.id;
      const email = req.user?.email;

      // Get current admin user data
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !adminUser) {
        return res.status(401).json({
          success: false,
          message: 'User not found or not authorized'
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: userId,
          email: email,
          fullName: adminUser.full_name,
          createdAt: adminUser.created_at,
          lastLogin: adminUser.last_login
        }
      });

    } catch (error) {
      console.error('Verify error:', error);
      res.status(500).json({
        success: false,
        message: 'Verification failed'
      });
    }
  }

  /**
   * Refresh token - Get new access token using refresh token
   * POST /api/auth/refresh
   */
  static async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Refresh session with Supabase
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token
      });

      if (error) {
        await logAuthEvent('token_refresh', 'unknown', 'failed', req, error.message);
        
        return res.status(401).json({
          success: false,
          message: 'Token refresh failed'
        });
      }

      const session = data.session;
      const user = data.user;

      await logAuthEvent('token_refresh', user.email, 'success', req);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Token refresh failed'
      });
    }
  }

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`
      });

      if (error) {
        console.error('Password reset error:', error);
        
        // Don't reveal if email exists
        return res.status(200).json({
          success: true,
          message: 'If the email exists, password reset instructions have been sent'
        });
      }

      await logAuthEvent('forgot_password', email, 'success', req);

      res.status(200).json({
        success: true,
        message: 'Password reset instructions sent to your email'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset request failed'
      });
    }
  }

  /**
   * Update password
   * POST /api/auth/update-password
   */
  static async updatePassword(req, res) {
    try {
      const { new_password, confirm_password } = req.body;
      const userId = req.user?.id;

      if (!new_password || !confirm_password) {
        return res.status(400).json({
          success: false,
          message: 'New password is required'
        });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match'
        });
      }

      if (new_password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters'
        });
      }

      // Update password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: new_password
      });

      if (error) {
        console.error('Update password error:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to update password'
        });
      }

      await logAuthEvent('password_update', req.user?.email, 'success', req);

      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password update failed'
      });
    }
  }

  /**
   * Get auth logs (admin only)
   * GET /api/auth/logs
   */
  static async getAuthLogs(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const { data, error } = await supabase
        .from('auth_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      const { count } = await supabase
        .from('auth_logs')
        .select('*', { count: 'exact', head: true });

      res.status(200).json({
        success: true,
        logs: data,
        total: count,
        limit,
        offset
      });

    } catch (error) {
      console.error('Get auth logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch auth logs'
      });
    }
  }
}

/**
 * Helper function to generate JWT token
 */
function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );
}

/**
 * Helper function to log auth events
 */
async function logAuthEvent(action, email, status, req, errorMessage = null) {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Get user ID if available
    const token = req.headers.authorization?.split(' ')[1];
    let userId = null;

    if (token) {
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      } catch (e) {
        // Token might be invalid, continue without userId
      }
    }

    await supabase.from('auth_logs').insert({
      user_id: userId,
      email,
      action,
      ip_address: ipAddress,
      user_agent: userAgent,
      status,
      error_message: errorMessage
    });
  } catch (error) {
    console.error('Error logging auth event:', error);
    // Don't throw - logging shouldn't break the auth flow
  }
}

module.exports = AuthController;
