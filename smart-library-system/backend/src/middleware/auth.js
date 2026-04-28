/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and attaches user info to request
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token and extract user info
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'NO_TOKEN',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(403).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
};

/**
 * Verify API Key (for server-to-server communication)
 */
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      code: 'NO_API_KEY',
    });
  }

  // Verify API key against database
  // This should be done in a real implementation
  // For now, just check if it matches a pattern
  if (apiKey.length < 32) {
    return res.status(401).json({
      error: 'Invalid API key',
      code: 'INVALID_API_KEY',
    });
  }

  req.apiKey = apiKey;
  next();
};

/**
 * Check user role - Admin only
 */
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'FORBIDDEN',
    });
  }
  next();
};

/**
 * Check user role - Librarian or Admin
 */
const requireLibrarian = (req, res, next) => {
  if (!['admin', 'librarian'].includes(req.userRole)) {
    return res.status(403).json({
      error: 'Librarian access required',
      code: 'FORBIDDEN',
    });
  }
  next();
};

/**
 * Check user role - Student
 */
const requireStudent = (req, res, next) => {
  if (req.userRole !== 'student') {
    return res.status(403).json({
      error: 'Student access required',
      code: 'FORBIDDEN',
    });
  }
  next();
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue as anonymous
    req.userId = null;
    req.userRole = 'anonymous';
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    req.user = decoded;
  } catch (error) {
    // Invalid token, but don't fail - just continue as anonymous
    req.userId = null;
    req.userRole = 'anonymous';
  }

  next();
};

/**
 * QR Token authentication (short-lived tokens for QR scans)
 */
const authenticateQRToken = (req, res, next) => {
  const token = req.body.token || req.query.token;

  if (!token) {
    return res.status(400).json({
      error: 'QR token required',
      code: 'NO_QR_TOKEN',
    });
  }

  try {
    // Verify QR token (has shorter expiry - 15 seconds)
    const decoded = jwt.verify(token, process.env.QR_TOKEN_SECRET);
    req.userId = decoded.id;
    req.qrTokenData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired QR token',
      code: 'INVALID_QR_TOKEN',
    });
  }
};

module.exports = {
  authenticateToken,
  authenticateApiKey,
  requireAdmin,
  requireLibrarian,
  requireStudent,
  optionalAuth,
  authenticateQRToken,
};
