/**
 * Admin Authentication Middleware
 * Verifies JWT token and admin status
 */

const { supabase, isUserAdmin } = require('../config/supabaseAuth');

/**
 * Middleware to verify admin authentication
 * Checks:
 * 1. Authorization header exists
 * 2. Token is valid Supabase token
 * 3. User is marked as admin in database
 * 
 * Attached to req.user:
 * - id: User UUID
 * - email: User email
 * - admin: Admin user data from admin_users table
 */
const adminAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing or invalid Authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Token verification error:', error?.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Verify user is admin
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get admin user details
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (adminError) {
      console.error('Error fetching admin user:', adminError.message);
      return res.status(403).json({
        success: false,
        message: 'Failed to verify admin status'
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      admin: adminUser
    };

    // Continue to next middleware/route handler
    next();

  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Optional: Middleware to verify user is authenticated but not necessarily admin
 * Used for general user endpoints
 */
const userAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Missing authentication'
      });
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = {
      id: user.id,
      email: user.email
    };

    next();

  } catch (error) {
    console.error('User auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware for optional authentication
 * If token exists and is valid, attach user to req
 * Otherwise continue without user
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email
        };
      }
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Don't fail - optional auth should always allow continuation
    next();
  }
};

module.exports = {
  adminAuth,
  userAuth,
  optionalAuth
};
