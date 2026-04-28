/**
 * Storage Service - Cloudflare R2 Integration
 * Production-ready file storage for PDFs and images
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

class CloudflareR2Service {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.initClient();
  }

  /**
   * Initialize S3 client for Cloudflare R2
   */
  initClient() {
    if (!this.config.accountId || !this.config.accessKeyId || !this.config.accessKeySecret || !this.config.bucketName) {
      console.warn('Cloudflare R2 configuration incomplete');
      return;
    }

    this.client = new S3Client({
      region: 'us-east-1',
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.accessKeySecret,
      },
    });
  }

  /**
   * Upload file to R2
   */
  async uploadFile(filePath, fileKey, contentType) {
    try {
      if (!this.client) {
        throw new Error('Cloudflare R2 not configured');
      }

      const fileContent = fs.readFileSync(filePath);

      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileKey,
        Body: fileContent,
        ContentType: contentType,
        CacheControl: 'max-age=3600',
      });

      const result = await this.client.send(command);

      const publicUrl = this.config.publicUrl
        ? `${this.config.publicUrl}/${fileKey}`
        : `https://${this.config.bucketName}.${this.config.accountId}.r2.cloudflarestorage.com/${fileKey}`;

      return {
        success: true,
        key: fileKey,
        url: publicUrl,
        etag: result.ETag,
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      throw error;
    }
  }

  /**
   * Upload file from buffer
   */
  async uploadBuffer(buffer, fileKey, contentType) {
    try {
      if (!this.client) {
        throw new Error('Cloudflare R2 not configured');
      }

      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileKey,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'max-age=3600',
      });

      const result = await this.client.send(command);

      const publicUrl = this.config.publicUrl
        ? `${this.config.publicUrl}/${fileKey}`
        : `https://${this.config.bucketName}.${this.config.accountId}.r2.cloudflarestorage.com/${fileKey}`;

      return {
        success: true,
        key: fileKey,
        url: publicUrl,
        etag: result.ETag,
      };
    } catch (error) {
      console.error('R2 buffer upload error:', error);
      throw error;
    }
  }

  /**
   * Download file from R2
   */
  async downloadFile(fileKey, outputPath) {
    try {
      if (!this.client) {
        throw new Error('Cloudflare R2 not configured');
      }

      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileKey,
      });

      const response = await this.client.send(command);
      const buffer = await response.Body.transformToByteArray();

      fs.writeFileSync(outputPath, buffer);

      return {
        success: true,
        filePath: outputPath,
        size: buffer.length,
      };
    } catch (error) {
      console.error('R2 download error:', error);
      throw error;
    }
  }

  /**
   * Delete file from R2
   */
  async deleteFile(fileKey) {
    try {
      if (!this.client) {
        throw new Error('Cloudflare R2 not configured');
      }

      const command = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileKey,
      });

      await this.client.send(command);

      return {
        success: true,
        message: `File ${fileKey} deleted successfully`,
      };
    } catch (error) {
      console.error('R2 delete error:', error);
      throw error;
    }
  }

  /**
   * Get signed URL for direct access
   */
  async getSignedUrl(fileKey, expiresIn = 3600) {
    try {
      if (!this.client) {
        throw new Error('Cloudflare R2 not configured');
      }

      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileKey,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });

      return {
        success: true,
        url: url,
        expiresIn: expiresIn,
      };
    } catch (error) {
      console.error('R2 signed URL error:', error);
      throw error;
    }
  }

  /**
   * List files in bucket
   */
  async listFiles(prefix = '', maxKeys = 100) {
    try {
      if (!this.client) {
        throw new Error('Cloudflare R2 not configured');
      }

      const command = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.client.send(command);

      const files = (response.Contents || []).map(file => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        eTag: file.ETag,
      }));

      return {
        success: true,
        files: files,
        count: files.length,
      };
    } catch (error) {
      console.error('R2 list error:', error);
      throw error;
    }
  }

  /**
   * Upload book PDF
   */
  async uploadBookPDF(bookId, pdfPath, fileName) {
    try {
      const fileKey = `books/${bookId}/${fileName}`;
      return await this.uploadFile(pdfPath, fileKey, 'application/pdf');
    } catch (error) {
      console.error('Upload book PDF error:', error);
      throw error;
    }
  }

  /**
   * Upload book cover image
   */
  async uploadBookCover(bookId, imagePath, fileName) {
    try {
      const ext = path.extname(fileName).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
      const fileKey = `books/${bookId}/cover${ext}`;
      
      return await this.uploadFile(imagePath, fileKey, contentType);
    } catch (error) {
      console.error('Upload book cover error:', error);
      throw error;
    }
  }

  /**
   * Upload document (report, invoice, etc)
   */
  async uploadDocument(documentType, documentId, filePath, fileName) {
    try {
      const ext = path.extname(fileName).toLowerCase();
      const contentType = ext === '.pdf' ? 'application/pdf' : 'text/plain';
      const fileKey = `documents/${documentType}/${documentId}/${fileName}`;
      
      return await this.uploadFile(filePath, fileKey, contentType);
    } catch (error) {
      console.error('Upload document error:', error);
      throw error;
    }
  }

  /**
   * Test connection
   */
  async testConnection() {
    try {
      if (!this.client) {
        throw new Error('Cloudflare R2 not configured');
      }

      const command = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        MaxKeys: 1,
      });

      await this.client.send(command);

      return {
        success: true,
        message: 'Cloudflare R2 connection successful',
        bucket: this.config.bucketName,
      };
    } catch (error) {
      console.error('R2 connection test error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default CloudflareR2Service;
