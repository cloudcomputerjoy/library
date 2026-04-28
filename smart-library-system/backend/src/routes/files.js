/**
 * File Sharing Routes
 * Handles file uploads with 30-minute auto-deletion
 */

const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cron = require('node-cron');
const { supabase, supabaseAdmin } = require('../config/database');
const { authenticateToken, requireLibrarian, requireStudent } = require('../middleware/auth');
const { uploadFile, deleteFile, generateSignedUrl, getPublicUrl } = require('../utils/cloudflare');
const { emitToRole, emitToUser } = require('../config/socket');
const {
  APIError,
  ValidationError,
  NotFoundError,
  asyncHandler,
} = require('../middleware/errorHandler');

const router = express.Router();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.FILE_UPLOAD_MAX_SIZE) || 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'application/pdf').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Auto-deletion job map (for cleanup)
const deletionJobs = new Map();

/**
 * Schedule file deletion (using setTimeout for now, can use Bull queue in production)
 */
const scheduleFileDeletion = async (fileId, storagePath, userId) => {
  const expiryMinutes = parseInt(process.env.FILE_SHARE_EXPIRY_MINUTES) || 30;
  const expiryMs = expiryMinutes * 60 * 1000;

  // Schedule deletion
  const timeoutId = setTimeout(async () => {
    try {
      // Delete from Cloudflare R2
      const deleted = await deleteFile(storagePath);

      if (deleted) {
        // Update database
        await supabaseAdmin
          .from('file_shares')
          .update({
            status: 'deleted',
            deleted_at: new Date(),
          })
          .eq('id', fileId);

        console.log(`✓ File auto-deleted: ${fileId} (${storagePath})`);

        // Notify user
        try {
          emitToUser(userId, 'file_auto_deleted', {
            fileId,
            message: 'Your shared file was automatically deleted after 30 minutes',
          });
        } catch (err) {
          console.error('Socket.IO error:', err);
        }
      }
    } catch (error) {
      console.error('Auto-deletion failed:', error);
    }

    deletionJobs.delete(fileId);
  }, expiryMs);

  deletionJobs.set(fileId, timeoutId);
};

/**
 * Clean up orphaned files (cron job - runs every hour)
 */
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Running file cleanup job...');

  try {
    // Find files that have expired
    const now = new Date().toISOString();

    const { data: orphanedFiles, error } = await supabase
      .from('file_shares')
      .select('*')
      .eq('is_expired', false)
      .lt('expires_at', now);

    if (error) {
      console.error('Orphaned file cleanup failed:', error);
      return;
    }

    // Delete orphaned files
    for (const file of orphanedFiles || []) {
      try {
        await deleteFile(file.storage_path);
        await supabaseAdmin
          .from('file_shares')
          .update({
            is_expired: true,
          })
          .eq('id', file.id);

        console.log(`✓ Orphaned file cleaned: ${file.id}`);
      } catch (err) {
        console.error(`Failed to cleanup file ${file.id}:`, err);
      }
    }

    console.log(`[CRON] File cleanup completed. Processed ${orphanedFiles?.length || 0} files`);
  } catch (error) {
    console.error('[CRON] File cleanup error:', error);
  }
});

/**
 * POST /files/upload
 * Upload file with auto-deletion after 30 minutes (Student only)
 */
router.post(
  '/upload',
  authenticateToken,
  requireStudent,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file provided');
    }

    const { description } = req.body;

    // Extract page count if PDF
    let pageCount = null;
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        pageCount = pdfData.numpages;
      } catch (err) {
        console.warn('Failed to extract PDF page count:', err);
      }
    }

    // Upload to Cloudflare R2
    const uploadResult = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.userId
    );

    if (!uploadResult.success) {
      throw new APIError('File upload failed: ' + uploadResult.error);
    }

    // Store file metadata in database
    const { data: fileShare, error } = await supabaseAdmin
      .from('file_shares')
      .insert([
        {
          user_id: req.userId,
          file_name: uploadResult.fileName,
          storage_path: uploadResult.storagePath,
          public_url: uploadResult.publicUrl,
          file_size: uploadResult.size,
          mime_type: uploadResult.mimeType,
          page_count: pageCount,
          description,
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 60 * 1000),
          created_at: new Date(),
        },
      ])
      .select()
      .single();

    if (error) {
      // Delete uploaded file if database insert fails
      await deleteFile(uploadResult.storagePath);
      throw new APIError('Failed to save file metadata: ' + error.message);
    }

    // Schedule auto-deletion
    scheduleFileDeletion(fileShare.id, uploadResult.storagePath, req.userId);

    // Notify admin/teachers
    try {
      emitToRole('admin', 'file_uploaded', {
        fileId: fileShare.id,
        fileName: uploadResult.fileName,
        userId: req.userId,
        fileSize: uploadResult.size,
        pageCount,
        timestamp: new Date(),
      });

      emitToRole('librarian', 'file_uploaded', {
        fileId: fileShare.id,
        fileName: uploadResult.fileName,
        userId: req.userId,
        fileSize: uploadResult.size,
        pageCount,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('Socket.IO notification failed:', err);
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId: fileShare.id,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.size,
        pageCount,
        uploadedAt: fileShare.created_at,
        expiresAt: fileShare.expires_at,
        expirationMinutes: 30,
        url: uploadResult.publicUrl,
      },
    });
  })
);

/**
 * GET /files/my-files
 * Get user's uploaded files
 */
router.get(
  '/my-files',
  authenticateToken,
  requireStudent,
  asyncHandler(async (req, res) => {
    const { status = 'active', limit = 20, offset = 0 } = req.query;

    const { data: files, error } = await supabase
      .from('file_shares')
      .select('*')
      .eq('user_id', req.userId)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data: files,
    });
  })
);

/**
 * GET /files/shared
 * Get files shared/uploaded by students (Admin/Librarian only)
 */
router.get(
  '/shared',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { userId, status = 'active', limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('file_shares')
      .select(
        `
        *,
        users:user_id(first_name, last_name, email, student_id)
      `
      );

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: files, error } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      data: files,
    });
  })
);

/**
 * DELETE /files/:id
 * Delete file manually (Admin/Librarian or owner)
 */
router.delete(
  '/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { data: file, error: fileError } = await supabase
      .from('file_shares')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!file || fileError) {
      throw new NotFoundError('File');
    }

    // Check authorization (owner, admin, or librarian)
    if (
      req.userId !== file.user_id &&
      !['admin', 'librarian'].includes(req.userRole)
    ) {
      throw new APIError('Unauthorized', 403);
    }

    // Delete from Cloudflare
    const deleted = await deleteFile(file.storage_path);

    if (deleted) {
      // Update database
      await supabaseAdmin
        .from('file_shares')
        .update({
          status: 'deleted',
          deleted_at: new Date(),
        })
        .eq('id', req.params.id);

      // Clear scheduled deletion if exists
      if (deletionJobs.has(req.params.id)) {
        clearTimeout(deletionJobs.get(req.params.id));
        deletionJobs.delete(req.params.id);
      }

      return res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } else {
      throw new APIError('Failed to delete file from storage');
    }
  })
);

/**
 * GET /files/download/:id
 * Get signed URL for file download
 */
router.get(
  '/download/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { data: file, error: fileError } = await supabase
      .from('file_shares')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!file || fileError) {
      throw new NotFoundError('File');
    }

    if (file.status !== 'active') {
      throw new APIError('File is no longer available', 410);
    }

    // Generate signed URL (1-hour expiry)
    const signedUrl = await generateSignedUrl(file.storage_path, 3600);

    res.json({
      success: true,
      data: {
        downloadUrl: signedUrl,
        fileName: file.file_name,
        expiresIn: 3600,
      },
    });
  })
);

/**
 * POST /files/:fileId/share
 * Share file with other users
 */
router.post(
  '/:fileId/share',
  authenticateToken,
  requireStudent,
  asyncHandler(async (req, res) => {
    const { recipientIds } = req.body;

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      throw new ValidationError('recipientIds array is required');
    }

    // Get file ownership check
    const { data: file, error: fileError } = await supabase
      .from('file_shares')
      .select('*')
      .eq('id', req.params.fileId)
      .eq('user_id', req.userId)
      .single();

    if (!file || fileError) {
      throw new NotFoundError('File or unauthorized access');
    }

    if (file.status !== 'active') {
      throw new APIError('File is no longer available', 410);
    }

    // Create share records for each recipient
    const shareRecords = recipientIds.map((recipientId) => ({
      file_id: req.params.fileId,
      shared_by: req.userId,
      shared_with: recipientId,
      shared_at: new Date(),
      status: 'active',
    }));

    const { data: shares, error: shareError } = await supabaseAdmin
      .from('file_shares')
      .insert(shareRecords)
      .select();

    if (shareError) {
      throw new APIError('Failed to share file: ' + shareError.message);
    }

    // Emit notifications to recipients
    try {
      for (const recipientId of recipientIds) {
        emitToUser(recipientId, 'file_shared', {
          fileId: req.params.fileId,
          fileName: file.file_name,
          sharedBy: req.userId,
          sharedAt: new Date(),
          message: `A file was shared with you`,
        });
      }
    } catch (err) {
      console.error('Socket.IO notification failed:', err);
    }

    res.status(201).json({
      success: true,
      message: `File shared with ${recipientIds.length} user(s)`,
      data: {
        fileId: req.params.fileId,
        sharedWith: recipientIds,
        sharedAt: new Date(),
      },
    });
  })
);

/**
 * POST /files/revoke-access
 * Revoke file sharing for specific users
 */
router.post(
  '/revoke-access',
  authenticateToken,
  requireStudent,
  asyncHandler(async (req, res) => {
    const { fileId, shareId } = req.body;

    if (!fileId && !shareId) {
      throw new ValidationError('Either fileId or shareId is required');
    }

    // Get file to verify ownership
    if (fileId) {
      const { data: file, error: fileError } = await supabase
        .from('file_shares')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', req.userId)
        .single();

      if (!file || fileError) {
        throw new NotFoundError('File or unauthorized');
      }

      // Revoke all shares for this file
      const { data: revoked, error: revokeError } = await supabaseAdmin
        .from('file_shares')
        .update({ status: 'revoked', revoked_at: new Date() })
        .eq('file_id', fileId)
        .select();

      if (revokeError) {
        throw new APIError('Failed to revoke access: ' + revokeError.message);
      }

      res.json({
        success: true,
        message: 'File access revoked for all users',
        data: {
          fileId,
          revokedShares: revoked?.length || 0,
        },
      });
    } else {
      // Revoke specific share
      const { data: share, error: shareError } = await supabase
        .from('file_shares')
        .select('*')
        .eq('id', shareId)
        .single();

      if (!share || shareError) {
        throw new NotFoundError('Share record');
      }

      // Verify ownership
      const { data: file } = await supabase
        .from('file_shares')
        .select('*')
        .eq('id', share.file_id)
        .eq('user_id', req.userId)
        .single();

      if (!file) {
        throw new APIError('Unauthorized', 403);
      }

      // Revoke this specific share
      const { error: revokeError } = await supabaseAdmin
        .from('file_shares')
        .update({ status: 'revoked', revoked_at: new Date() })
        .eq('id', shareId);

      if (revokeError) {
        throw new APIError('Failed to revoke access: ' + revokeError.message);
      }

      res.json({
        success: true,
        message: 'Share access revoked',
        data: {
          shareId,
        },
      });
    }
  })
);

module.exports = router;
