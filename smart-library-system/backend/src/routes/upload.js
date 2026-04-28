/**
 * File Upload Routes
 * Handles photo uploads to Cloudflare R2 for user profiles
 */

const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { uploadFile } = require('../utils/cloudflare');
const {
  APIError,
  ValidationError,
  asyncHandler,
} = require('../middleware/errorHandler');

const router = express.Router();

// Multer configuration for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB for images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    }
  },
});

/**
 * POST /upload
 * Upload file (generic, for any authenticated user)
 */
router.post(
  '/',
  authenticateToken,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file provided');
    }

    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Upload to Cloudflare R2
    const uploadResult = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId
    );

    if (!uploadResult.success) {
      throw new APIError(`Failed to upload file: ${uploadResult.error}`, 400);
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      url: uploadResult.publicUrl,
      data: uploadResult,
    });
  })
);

/**
 * POST /photo
 * Upload photo for user profile
 */
router.post(
  '/photo',
  authenticateToken,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No photo provided');
    }

    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Upload to Cloudflare R2
    const uploadResult = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      `users/${userId}`
    );

    if (!uploadResult.success) {
      throw new APIError(`Failed to upload photo: ${uploadResult.error}`, 400);
    }

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      url: uploadResult.publicUrl,
      data: uploadResult,
    });
  })
);

module.exports = router;
