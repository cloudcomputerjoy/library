/**
 * Cloudflare R2 Storage Integration
 * Handles file uploads, downloads, and deletion from Cloudflare R2
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflairstorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload file to Cloudflare R2
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {String} originalFileName - Original file name
 * @param {String} mimeType - File MIME type
 * @param {String} userId - User ID for organizing files
 * @returns {Promise<Object>} - Upload result with URL and metadata
 */
const uploadFile = async (fileBuffer, originalFileName, mimeType, userId) => {
  try {
    // Generate unique file name
    const fileId = uuidv4();
    const extension = originalFileName.split('.').pop();
    const storagePath = `uploads/${userId}/${fileId}.${extension}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: storagePath,
      Body: fileBuffer,
      ContentType: mimeType,
      Metadata: {
        'original-name': originalFileName,
        'uploaded-by': userId,
        'upload-date': new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Generate public URL
    const publicUrl = `${process.env.CLOUDFLARE_BUCKET_URL}/${storagePath}`;

    return {
      success: true,
      fileId,
      fileName: originalFileName,
      storagePath,
      publicUrl,
      mimeType,
      size: fileBuffer.length,
      uploadedAt: new Date(),
    };
  } catch (error) {
    console.error('Cloudflare upload failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate signed URL for file access (temporary download link)
 * @param {String} storagePath - File path in R2
 * @param {Number} expiresIn - Expiration time in seconds (default 3600)
 * @returns {Promise<String>} - Signed URL
 */
const generateSignedUrl = async (storagePath, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: storagePath,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    throw error;
  }
};

/**
 * Delete file from Cloudflare R2
 * @param {String} storagePath - File path in R2
 * @returns {Promise<Boolean>} - Deletion success status
 */
const deleteFile = async (storagePath) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: storagePath,
    });

    await s3Client.send(command);
    console.log(`✓ File deleted: ${storagePath}`);
    return true;
  } catch (error) {
    console.error('Cloudflare delete failed:', error);
    return false;
  }
};

/**
 * Get file metadata without downloading
 * @param {String} storagePath - File path in R2
 * @returns {Promise<Object>} - File metadata
 */
const getFileMetadata = async (storagePath) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: storagePath,
    });

    const response = await s3Client.send(command);
    
    return {
      size: response.ContentLength,
      mimeType: response.ContentType,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error('Failed to get file metadata:', error);
    return null;
  }
};

/**
 * Generate public file URL (without expiration)
 * @param {String} storagePath - File path in R2
 * @returns {String} - Public URL
 */
const getPublicUrl = (storagePath) => {
  return `${process.env.CLOUDFLARE_BUCKET_URL}/${storagePath}`;
};

/**
 * Check if file exists in R2
 * @param {String} storagePath - File path in R2
 * @returns {Promise<Boolean>} - File existence status
 */
const fileExists = async (storagePath) => {
  try {
    const metadata = await getFileMetadata(storagePath);
    return metadata !== null;
  } catch (error) {
    return false;
  }
};

module.exports = {
  uploadFile,
  generateSignedUrl,
  deleteFile,
  getFileMetadata,
  getPublicUrl,
  fileExists,
};
