/**
 * Files Controller
 * Handles file uploads, sharing, and downloads
 */

const { supabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload and share a file
 */
exports.uploadAndShare = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    const { fileName, expiresIn = 30, recipientIds = [] } = req.body;

    // Generate unique file ID
    const fileId = uuidv4();
    const fileKey = `shared/${userId}/${fileId}/${req.file.originalname}`;

    // Upload to Cloudflare R2 (or local storage)
    // For now, store metadata in database
    let expiryDate = null;
    if (expiresIn && expiresIn > 0) {
      expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + parseInt(expiresIn));
    }

    const { data: file, error: fileError } = await supabase
      .from('shared_files')
      .insert({
        id: fileId,
        user_id: userId,
        file_name: fileName || req.file.originalname,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        file_path: fileKey,
        expires_at: expiryDate ? expiryDate.toISOString() : null,
      })
      .select()
      .single();

    if (fileError) throw fileError;

    // Share with specified users
    if (recipientIds && recipientIds.length > 0) {
      const shares = recipientIds.map((recipientId) => ({
        file_id: fileId,
        shared_with_user_id: recipientId,
        shared_by_user_id: userId,
      }));

      const { error: shareError } = await supabase
        .from('file_shares')
        .insert(shares);

      if (shareError) throw shareError;
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded and shared successfully',
      data: {
        file,
        shareCount: recipientIds.length,
        downloadLink: `/api/files/download/${fileId}`,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get shared files
 */
exports.getSharedFiles = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get files shared with user
    const { data: sharedFiles, error } = await supabase
      .from('file_shares')
      .select(
        `
        id,
        shared_by_user_id,
        shared_at,
        file: file_id (
          id,
          file_name,
          file_size,
          file_type,
          created_at,
          expires_at,
          sharedBy: user_id (id, name, email)
        )
      `
      )
      .eq('shared_with_user_id', userId)
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    res.json({
      success: true,
      data: sharedFiles,
      count: sharedFiles.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get files uploaded by current user
 */
exports.getMyFiles = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from('shared_files')
      .select(
        `
        *,
        shares: file_shares (
          id,
          shared_with_user_id,
          sharedWith: shared_with_user_id (id, name, email),
          shared_at
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Download a file
 */
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user ? req.user.userId : null;

    // Get file
    const { data: file, error: fileError } = await supabase
      .from('shared_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Check expiry
    if (file.expires_at && new Date() > new Date(file.expires_at)) {
      return res.status(410).json({
        success: false,
        message: 'File has expired',
      });
    }

    // Check access (if user is not the owner, must be in shares)
    if (file.user_id !== userId) {
      const { data: share } = await supabase
        .from('file_shares')
        .select('id')
        .eq('file_id', fileId)
        .eq('shared_with_user_id', userId)
        .single();

      if (!share) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    // Log download
    await supabase.from('file_downloads').insert({
      file_id: fileId,
      downloaded_by_user_id: userId,
    });

    // For now, return file metadata
    // In production, stream the file from Cloudflare R2 or storage
    res.json({
      success: true,
      data: file,
      message: 'File ready for download',
      downloadUrl: `/storage/shared/${file.file_path}`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Share file with additional users
 */
exports.shareFile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fileId } = req.params;
    const { recipientIds } = req.body;

    if (!recipientIds || recipientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one recipient is required',
      });
    }

    // Verify file owner
    const { data: file, error: fileError } = await supabase
      .from('shared_files')
      .select('id')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (fileError || !file) {
      return res.status(403).json({
        success: false,
        message: 'File not found or access denied',
      });
    }

    // Create shares
    const shares = recipientIds.map((recipientId) => ({
      file_id: fileId,
      shared_with_user_id: recipientId,
      shared_by_user_id: userId,
    }));

    const { error: shareError } = await supabase
      .from('file_shares')
      .insert(shares);

    if (shareError) throw shareError;

    res.json({
      success: true,
      message: `File shared with ${recipientIds.length} user(s)`,
      sharedCount: recipientIds.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Revoke file access
 */
exports.revokeAccess = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fileId, shareId } = req.body;

    // Verify file owner
    const { data: file } = await supabase
      .from('shared_files')
      .select('id')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (!file) {
      return res.status(403).json({
        success: false,
        message: 'File not found or access denied',
      });
    }

    // Delete share
    const { error } = await supabase
      .from('file_shares')
      .delete()
      .eq('id', shareId)
      .eq('file_id', fileId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Access revoked',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete file
 */
exports.deleteFile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fileId } = req.params;

    // Verify file owner
    const { data: file, error: fileError } = await supabase
      .from('shared_files')
      .select('id')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (fileError || !file) {
      return res.status(403).json({
        success: false,
        message: 'File not found or access denied',
      });
    }

    // Delete file shares
    await supabase
      .from('file_shares')
      .delete()
      .eq('file_id', fileId);

    // Delete file
    const { error: deleteError } = await supabase
      .from('shared_files')
      .delete()
      .eq('id', fileId);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: 'File deleted',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get file download statistics (admin)
 */
exports.getFileStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { fileId } = req.params;

    // Get file info
    const { data: file } = await supabase
      .from('shared_files')
      .select('*')
      .eq('id', fileId)
      .single();

    // Get download count
    const { data: downloads, error: downloadError } = await supabase
      .from('file_downloads')
      .select('*', { count: 'exact' })
      .eq('file_id', fileId);

    // Get share count
    const { data: shares, error: shareError } = await supabase
      .from('file_shares')
      .select('*', { count: 'exact' })
      .eq('file_id', fileId);

    if (downloadError || shareError) throw downloadError || shareError;

    res.json({
      success: true,
      data: {
        file,
        downloadCount: downloads.length,
        sharedWithCount: shares.length,
        downloads,
        shares,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
