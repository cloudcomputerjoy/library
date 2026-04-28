/**
 * QR Code Routes
 * Handles QR token generation and QR code scanning for entry/exit
 */

const express = require('express');
const { supabase, supabaseAdmin } = require('../config/database');
const { authenticateToken, authenticateQRToken } = require('../middleware/auth');
const qrController = require('../controllers/qrController');
const {
  generateQRCodeString,
  decodeQRCodeString,
  verifyQRToken,
} = require('../utils/qr');
const { emitToRole } = require('../config/socket');
const {
  APIError,
  ValidationError,
  UnauthorizedError,
  asyncHandler,
} = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /qr/generate
 * Generate dynamic QR code for student (15-second expiry)
 * Authenticated: Requires JWT token
 */
router.get(
  '/generate',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, student_id, role')
      .eq('id', req.userId)
      .single();

    if (!user || userError) {
      throw new APIError('User not found', 404);
    }

    // Only students can generate QR codes
    if (user.role !== 'student') {
      throw new APIError('Only students can generate QR codes', 403);
    }

    // Generate QR code string
    const qrCodeString = generateQRCodeString(user.id, user.student_id);

    // Decode to get token details
    const decoded = decodeQRCodeString(qrCodeString);
    if (!decoded.valid) {
      throw new APIError('Failed to generate QR code');
    }

    // Store QR token in database for audit trail
    const { data: qrRecord, error: qrError } = await supabaseAdmin
      .from('qr_tokens')
      .insert([
        {
          user_id: user.id,
          token: decoded.data.token,
          hmac: decoded.data.hmac,
          expires_at: decoded.data.expiresAt,
          status: 'active',
          created_at: new Date(),
        },
      ])
      .select()
      .single();

    res.json({
      success: true,
      data: {
        qrCode: qrCodeString,
        token: decoded.data.token,
        hmac: decoded.data.hmac,
        expiresIn: decoded.data.expiresAt,
        generatedAt: new Date(),
        userId: user.id,
      },
    });
  })
);

/**
 * POST /qr/scan
 * Scan QR code for entry/exit
 * This endpoint can be called with QR token (from mobile app)
 */
router.post(
  '/scan',
  asyncHandler(async (req, res) => {
    const { qrCode, token, hmac } = req.body;

    // Validation
    if (!qrCode && !token) {
      throw new ValidationError('QR code or token is required');
    }

    let userId, studentId;

    // Decode QR code if provided
    if (qrCode) {
      const decoded = decodeQRCodeString(qrCode);
      if (!decoded.valid) {
        throw new ValidationError('Invalid QR code format');
      }

      userId = decoded.data.userId;
      studentId = decoded.data.studentId;
      const providedToken = decoded.data.token;
      const providedHmac = decoded.data.hmac;

      // Verify token and HMAC
      const verification = verifyQRToken(providedToken, providedHmac);
      if (!verification.valid) {
        throw new UnauthorizedError('QR code is invalid or expired');
      }
    } else {
      // Token provided directly
      if (!hmac) throw new ValidationError('HMAC is required');

      const verification = verifyQRToken(token, hmac);
      if (!verification.valid) {
        throw new UnauthorizedError('Token is invalid or expired');
      }

      userId = verification.decoded.id;
      studentId = verification.decoded.studentId;
    }

    // Get user and current attendance status
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, student_id')
      .eq('id', userId)
      .single();

    if (!user || userError) {
      throw new APIError('User not found', 404);
    }

    // Check if user is currently inside
    const { data: lastEntry, error: entryError } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', userId)
      .is('exit_time', null)
      .order('entry_time', { ascending: false })
      .limit(1)
      .single();

    let actionType, log;

    if (lastEntry && !lastEntry.exit_time) {
      // User is currently inside - this is an exit scan
      actionType = 'exit';

      const { data: exitLog, error: exitError } = await supabaseAdmin
        .from('attendance_logs')
        .update({
          exit_time: new Date(),
          duration_minutes: Math.round(
            (Date.now() - new Date(lastEntry.entry_time).getTime()) / 60000
          ),
        })
        .eq('id', lastEntry.id)
        .select()
        .single();

      if (exitError) throw new APIError(exitError.message);
      log = exitLog;
    } else {
      // User is not inside - this is an entry scan
      actionType = 'entry';

      const { data: entryLog, error: createError } = await supabaseAdmin
        .from('attendance_logs')
        .insert([
          {
            user_id: userId,
            entry_time: new Date(),
            status: 'present',
          },
        ])
        .select()
        .single();

      if (createError) throw new APIError(createError.message);
      log = entryLog;
    }

    // Emit real-time event to librarians
    try {
      emitToRole('librarian', `${actionType}_success`, {
        userId,
        userName: `${user.first_name} ${user.last_name}`,
        studentId: user.student_id,
        timestamp: new Date(),
        action: actionType,
      });
    } catch (err) {
      console.error('Failed to emit Socket.IO event:', err);
    }

    res.json({
      success: true,
      message: `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} recorded successfully`,
      data: {
        userId,
        action: actionType,
        timestamp: log.created_at || new Date(),
        userName: `${user.first_name} ${user.last_name}`,
        log,
      },
    });
  })
);

/**
 * GET /qr/status
 * Get current attendance status for user
 * Authenticated: Requires JWT token
 */
router.get(
  '/status',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { data: lastLog, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', req.userId)
      .order('entry_time', { ascending: false })
      .limit(1)
      .single();

    if (!lastLog || error) {
      return res.json({
        success: true,
        data: {
          status: 'not_yet_entered',
          currentlyInside: false,
        },
      });
    }

    const currentlyInside = !lastLog.exit_time;

    res.json({
      success: true,
      data: {
        status: currentlyInside ? 'inside' : 'outside',
        currentlyInside,
        lastEntry: lastLog.entry_time,
        lastExit: lastLog.exit_time,
        duration: lastLog.duration_minutes,
      },
    });
  })
);

router.get(
  '/book/:bookId',
  authenticateToken,
  asyncHandler(qrController.generateBookQR)
);

router.get(
  '/user',
  authenticateToken,
  asyncHandler(qrController.generateUserQR)
);

router.post(
  '/transaction',
  authenticateToken,
  asyncHandler(qrController.processQRTransaction)
);

router.get(
  '/history',
  authenticateToken,
  asyncHandler(qrController.getQRHistory)
);

router.post(
  '/validate',
  asyncHandler(qrController.validateQRToken)
);

/**
 * GET /qr/attendance-logs
 * Get attendance history for user
 * Authenticated: Requires JWT token
 */
router.get(
  '/attendance-logs',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { startDate, endDate, limit = 30 } = req.query;

    let query = supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', req.userId)
      .order('entry_time', { ascending: false });

    if (startDate) {
      query = query.gte('entry_time', startDate);
    }

    if (endDate) {
      query = query.lte('entry_time', endDate);
    }

    const { data: logs, error } = await query.limit(parseInt(limit));

    if (error) {
      throw new APIError(error.message);
    }

    // Calculate statistics
    const totalVisits = logs.length;
    const totalTime = logs.reduce((acc, log) => acc + (log.duration_minutes || 0), 0);
    const averageTime = totalVisits > 0 ? Math.round(totalTime / totalVisits) : 0;

    res.json({
      success: true,
      data: {
        logs,
        statistics: {
          totalVisits,
          totalTimeMinutes: totalTime,
          averageTimeMinutes: averageTime,
        },
      },
    });
  })
);

/**
 * GET /qr/live-attendance
 * Get real-time attendance statistics (Admin/Librarian only)
 * Authenticated: Requires JWT token + Admin/Librarian role
 */
router.get(
  '/live-attendance',
  authenticateToken,
  asyncHandler(async (req, res) => {
    if (!['admin', 'librarian'].includes(req.userRole)) {
      throw new APIError('Admin or Librarian access required', 403);
    }

    // Get count of currently inside users
    const { data: insideUsers, error: insideError } = await supabase
      .from('attendance_logs')
      .select('count', { count: 'exact', head: true })
      .is('exit_time', null);

    // Get total visits today
    const today = new Date().toISOString().split('T')[0];
    const { data: todayVisits, error: todayError } = await supabase
      .from('attendance_logs')
      .select('count', { count: 'exact', head: true })
      .gte('entry_time', `${today}T00:00:00`);

    if (insideError || todayError) {
      throw new APIError('Failed to retrieve attendance stats');
    }

    res.json({
      success: true,
      data: {
        currentlyInside: insideUsers.count || 0,
        totalVisitsToday: todayVisits.count || 0,
        timestamp: new Date(),
      },
    });
  })
);

module.exports = router;
