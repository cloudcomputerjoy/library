/**
 * QR Code & Token Utilities
 * Handles QR token generation, validation, and HMAC encryption
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate dynamic QR token (15-second expiry)
 * Used for entry/exit scanning
 */
const generateQRToken = (userId, studentId) => {
  const payload = {
    id: userId,
    studentId: studentId,
    type: 'qr_token',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + parseInt(process.env.QR_TOKEN_EXPIRY || 15),
  };

  const token = jwt.sign(payload, process.env.QR_TOKEN_SECRET);
  
  // Create HMAC hash of token for security
  const hmac = crypto
    .createHmac('sha256', process.env.QR_TOKEN_SECRET)
    .update(token)
    .digest('hex');

  return {
    token,
    hmac,
    expiresIn: parseInt(process.env.QR_TOKEN_EXPIRY || 15),
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + (parseInt(process.env.QR_TOKEN_EXPIRY || 15) * 1000)),
  };
};

/**
 * Verify QR token and HMAC
 */
const verifyQRToken = (token, providedHmac) => {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.QR_TOKEN_SECRET);

    // Verify HMAC
    const expectedHmac = crypto
      .createHmac('sha256', process.env.QR_TOKEN_SECRET)
      .update(token)
      .digest('hex');

    if (providedHmac && providedHmac !== expectedHmac) {
      return {
        valid: false,
        error: 'HMAC verification failed',
      };
    }

    return {
      valid: true,
      decoded,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
};

/**
 * Generate QR data with encryption
 * Returns nested JSON to prevent tampering
 */
const generateSecureQRData = (userId, studentId) => {
  const { token, hmac, expiresAt } = generateQRToken(userId, studentId);

  const qrData = {
    token,
    hmac,
    userId,
    studentId,
    expiresAt,
    libraryId: process.env.LIBRARY_ID || 'SL-001',
  };

  return qrData;
};

/**
 * Validate QR scan data structure
 */
const validateQRScanData = (scanData) => {
  if (!scanData.token || !scanData.hmac) {
    return { valid: false, error: 'Missing QR token or HMAC' };
  }

  if (!scanData.userId || !scanData.studentId) {
    return { valid: false, error: 'Missing user identification' };
  }

  const verification = verifyQRToken(scanData.token, scanData.hmac);
  if (!verification.valid) {
    return { valid: false, error: verification.error };
  }

  return { valid: true, data: verification.decoded };
};

/**
 * Generate QR code string for display (usually encoded in QR format)
 * Returns base64 encoded string that includes all necessary data
 */
const generateQRCodeString = (userId, studentId) => {
  const qrData = generateSecureQRData(userId, studentId);
  const jsonString = JSON.stringify(qrData);
  return Buffer.from(jsonString).toString('base64');
};

/**
 * Decode QR code string
 */
const decodeQRCodeString = (encodedString) => {
  try {
    const jsonString = Buffer.from(encodedString, 'base64').toString('utf-8');
    const qrData = JSON.parse(jsonString);
    return { valid: true, data: qrData };
  } catch (error) {
    return { valid: false, error: 'Invalid QR code format' };
  }
};

module.exports = {
  generateQRToken,
  verifyQRToken,
  generateSecureQRData,
  validateQRScanData,
  generateQRCodeString,
  decodeQRCodeString,
};
