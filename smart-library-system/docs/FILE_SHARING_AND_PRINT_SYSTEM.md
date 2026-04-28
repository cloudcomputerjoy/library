# 📄 File Sharing & Print Management System

## 🗂️ File Sharing Architecture

### Features
- Student file uploads (PDF, DOC, etc.)
- Auto-deletion after 30 minutes
- Page count tracking
- Print integration
- Admin approval for printing
- Collection receipt tracking

---

## 🔑 Backend Service Implementation

### File: `src/services/fileService.js`

```javascript
const supabase = require('../config/supabase');
const cloudflareService = require('./cloudflareService');
const notificationService = require('./notificationService');
const Queue = require('bull');
require('dotenv').config();

// Redis queue for file deletion jobs
const fileDeleteQueue = new Queue('file-delete', process.env.REDIS_URL);

class FileService {
  // Upload file
  async uploadFile(userId, file, metadata) {
    try {
      // Validate file
      const maxSizeBytes = 100 * 1024 * 1024; // 100 MB
      if (file.size > maxSizeBytes) {
        throw new Error('File size exceeds 100 MB limit');
      }
      
      const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'];
      
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('File type not allowed');
      }
      
      // Upload to Cloudflare R2
      const uploadResult = await cloudflareService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      
      // Get page count (for PDFs)
      let pageCount = null;
      if (file.mimetype === 'application/pdf') {
        pageCount = await this.getPageCount(file.buffer);
      }
      
      // Calculate auto-delete time (30 minutes from now)
      const autoDeleteAt = new Date(Date.now() + 30 * 60 * 1000);
      
      // Save metadata to database
      const { data: fileShare, error } = await supabase
        .from('file_shares')
        .insert([{
          uploader_id: userId,
          file_name: file.originalname,
          file_url: uploadResult.fileUrl,
          file_type: file.mimetype.split('/')[1],
          file_size_bytes: file.size,
          description: metadata.description || '',
          subject: metadata.subject || '',
          tags: metadata.tags || [],
          page_count: pageCount,
          is_public: metadata.is_public !== false,
          shared_with: metadata.shared_with || [],
          cloudflare_file_id: uploadResult.etag,
          auto_delete_at: autoDeleteAt.toISOString()
        }])
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Schedule deletion job
      await fileDeleteQueue.add(
        { fileShareId: fileShare.id, fileUrl: uploadResult.fileUrl },
        { delay: 30 * 60 * 1000 } // 30 minutes
      );
      
      return {
        success: true,
        message: 'File uploaded successfully',
        file_share: {
          ...fileShare,
          will_delete_at: autoDeleteAt.toISOString(),
          auto_delete_in_minutes: 30
        }
      };
    } catch (err) {
      console.error('File Upload Error:', err);
      throw err;
    }
  }
  
  // Get all file shares
  async getAllFileShares(filters = {}) {
    try {
      let query = supabase
        .from('file_shares')
        .select('*, users:uploader_id(first_name, last_name, student_id)', { count: 'exact' })
        .eq('is_deleted', false);
      
      // Filter by subject
      if (filters.subject) {
        query = query.ilike('subject', `%${filters.subject}%`);
      }
      
      // Filter by uploader
      if (filters.uploader_id) {
        query = query.eq('uploader_id', filters.uploader_id);
      }
      
      // Filter public only for non-admin
      if (filters.excludePrivate) {
        query = query.eq('is_public', true);
      }
      
      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }
      
      // Sorting
      const sortField = filters.sort === 'newest' ? 'created_at' : 'download_count';
      const ascending = filters.sort === 'newest' ? false : true;
      
      query = query
        .order(sortField, { ascending })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);
      
      const { data, count, error } = await query;
      
      if (error) throw error;
      
      return {
        total: count,
        files: data,
        offset: filters.offset || 0,
        limit: filters.limit || 20
      };
    } catch (err) {
      console.error('Get File Shares Error:', err);
      throw err;
    }
  }
  
  // Get file details
  async getFileDetails(fileShareId) {
    try {
      const { data, error } = await supabase
        .from('file_shares')
        .select('*, users:uploader_id(*)')
        .eq('id', fileShareId)
        .eq('is_deleted', false)
        .single();
      
      if (error) throw new Error('File not found');
      
      return data;
    } catch (err) {
      console.error('Get File Details Error:', err);
      throw err;
    }
  }
  
  // Record file download
  async recordDownload(fileShareId, downloaderId) {
    try {
      // Increment download count
      await supabase.rpc('increment_file_downloads', {
        file_id: fileShareId
      });
      
      // Record download action
      const { error } = await supabase
        .from('file_downloads')
        .insert([{
          file_share_id: fileShareId,
          downloader_id: downloaderId,
          action_type: 'download',
          status: 'pending'
        }]);
      
      if (error) throw error;
      
      return { success: true };
    } catch (err) {
      console.error('Record Download Error:', err);
      throw err;
    }
  }
  
  // Manual delete file (before auto-delete)
  async deleteFile(fileShareId, userId) {
    try {
      // Verify ownership
      const { data: fileShare } = await supabase
        .from('file_shares')
        .select('*')
        .eq('id', fileShareId)
        .single();
      
      if (fileShare.uploader_id !== userId) {
        throw new Error('You do not have permission to delete this file');
      }
      
      // Mark as deleted
      const { error } = await supabase
        .from('file_shares')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', fileShareId);
      
      if (error) throw error;
      
      // Delete from Cloudflare
      try {
        await cloudflareService.deleteFile(fileShare.cloudflare_file_id);
      } catch (cfErr) {
        console.error('Cloudflare delete failed:', cfErr);
      }
      
      // Remove scheduled deletion job if exists
      const jobs = await fileDeleteQueue.getJobs(['delayed']);
      const job = jobs.find(j => j.data.fileShareId === fileShareId);
      if (job) {
        await job.remove();
      }
      
      return { success: true, message: 'File deleted successfully' };
    } catch (err) {
      console.error('Delete File Error:', err);
      throw err;
    }
  }
  
  // Auto-delete via scheduled job
  async autoDeleteExpiredFiles() {
    try {
      const now = new Date().toISOString();
      
      // Get all files past auto-delete time
      const { data: expiredFiles, error } = await supabase
        .from('file_shares')
        .select('*')
        .lte('auto_delete_at', now)
        .eq('is_deleted', false);
      
      if (error) throw error;
      
      for (const file of expiredFiles) {
        try {
          // Delete from Cloudflare
          await cloudflareService.deleteFile(file.cloudflare_file_id);
          
          // Mark as deleted in database
          await supabase
            .from('file_shares')
            .update({
              is_deleted: true,
              deleted_at: now
            })
            .eq('id', file.id);
          
          // Notify uploader
          await notificationService.sendNotification(
            file.uploader_id,
            {
              title: 'File Deleted',
              message: `Your file "${file.file_name}" has been automatically deleted after 30 minutes`,
              type: 'file_deleted',
              channel: 'in_app'
            }
          );
          
          console.log(`File auto-deleted: ${file.id}`);
        } catch (err) {
          console.error(`Failed to auto-delete file ${file.id}:`, err);
        }
      }
      
      return { deletedCount: expiredFiles.length };
    } catch (err) {
      console.error('Auto-delete Error:', err);
      throw err;
    }
  }
  
  // Estimate page count from PDF
  async getPageCount(pdfBuffer) {
    try {
      // Simple PDF page detection (count /Page objects)
      const pdfText = pdfBuffer.toString('binary');
      const pageMatches = pdfText.match(/\/Type\s*\/Page(?!s)/g);
      return pageMatches ? pageMatches.length : 1;
    } catch (err) {
      console.error('Page count error:', err);
      return null;
    }
  }
  
  // Get file share statistics (for analytics)
  async getFileShareStats(userId) {
    try {
      const { data, error } = await supabase
        .from('file_shares')
        .select('id, download_count')
        .eq('uploader_id', userId)
        .eq('is_deleted', false);
      
      if (error) throw error;
      
      const totalDownloads = data.reduce((sum, f) => sum + f.download_count, 0);
      
      return {
        total_files_uploaded: data.length,
        total_downloads: totalDownloads,
        average_downloads_per_file: data.length > 0 ? totalDownloads / data.length : 0
      };
    } catch (err) {
      console.error('File stats error:', err);
      throw err;
    }
  }
}

module.exports = new FileService();
```

### File: `src/jobs/autoDeleteFiles.js`

```javascript
const fileService = require('../services/fileService');

// Schedule this job to run every 5 minutes
async function autoDeleteExpiredFiles() {
  try {
    console.log('Running auto-delete job...');
    const result = await fileService.autoDeleteExpiredFiles();
    console.log(`Auto-delete complete: ${result.deletedCount} files deleted`);
  } catch (err) {
    console.error('Auto-delete job failed:', err);
  }
}

// Use schedule: node-schedule or cron
// Every 5 minutes
// const schedule = require('node-schedule');
// schedule.scheduleJob('*/5 * * * *', autoDeleteExpiredFiles);

module.exports = { autoDeleteExpiredFiles };
```

### File: `src/routes/fileShares.js`

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileController = require('../controllers/fileController');
const { authenticate } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// Upload file
router.post('/upload', authenticate, upload.single('file'), fileController.uploadFile);

// Get all files
router.get('/', authenticate, fileController.getAllFileShares);

// Get file details
router.get('/:file_id', authenticate, fileController.getFileDetails);

// Download file
router.get('/:file_id/download', authenticate, fileController.downloadFile);

// Delete file (manual)
router.delete('/:file_id', authenticate, fileController.deleteFile);

// Get user's file share stats
router.get('/stats/my-stats', authenticate, fileController.getFileShareStats);

module.exports = router;
```

---

# 🖨️ Print Management System

## Backend Service

### File: `src/services/printService.js`

```javascript
const supabase = require('../config/supabase');
const notificationService = require('./notificationService');
require('dotenv').config();

class PrintService {
  // Create print job
  async createPrintJob(fileShareId, userId, printDetails) {
    try {
      // Get file details
      const { data: fileShare } = await supabase
        .from('file_shares')
        .select('*')
        .eq('id', fileShareId)
        .single();
      
      if (!fileShare) {
        throw new Error('File not found');
      }
      
      // Calculate cost (assuming 0.05 per page)
      const costPerPage = 0.05;
      const totalPages = printDetails.total_pages || fileShare.page_count || 1;
      const copies = printDetails.copies || 1;
      const cost = (totalPages * copies * costPerPage).toFixed(2);
      
      // Create print job
      const { data: printJob, error } = await supabase
        .from('print_jobs')
        .insert([{
          file_share_id: fileShareId,
          initiated_by: userId,
          total_pages: totalPages,
          copies: copies,
          page_range: printDetails.page_range || `1-${totalPages}`,
          priority: printDetails.priority || 'normal',
          status: 'queued',
          cost: cost
        }])
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Notify admins
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');
      
      for (const admin of admins) {
        await notificationService.sendNotification(
          admin.id,
          {
            title: 'New Print Request',
            message: `${fileShare.file_name} - ${totalPages} pages, ${copies} copies`,
            type: 'print_request',
            channel: 'in_app'
          }
        );
      }
      
      return {
        success: true,
        message: 'Print job created',
        print_job: {
          ...printJob,
          estimated_ready_time: new Date(Date.now() + 30 * 60 * 1000) // 30 min estimate
        }
      };
    } catch (err) {
      console.error('Create Print Job Error:', err);
      throw err;
    }
  }
  
  // Get print jobs for user
  async getUserPrintJobs(userId, filters = {}) {
    try {
      let query = supabase
        .from('print_jobs')
        .select('*, file_shares(file_name, file_type)', { count: 'exact' })
        .eq('initiated_by', userId);
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, count, error } = await query;
      
      if (error) throw error;
      
      return { data, total: count };
    } catch (err) {
      console.error('Get User Print Jobs Error:', err);
      throw err;
    }
  }
  
  // Get all print jobs (Admin)
  async getAllPrintJobs(filters = {}) {
    try {
      let query = supabase
        .from('print_jobs')
        .select('*, file_shares(file_name), users:initiated_by(first_name, last_name)', { count: 'exact' });
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { data, total: count };
    } catch (err) {
      console.error('Get All Print Jobs Error:', err);
      throw err;
    }
  }
  
  // Approve print job (Admin)
  async approvePrintJob(printJobId, adminId, printerAssignment) {
    try {
      const { error } = await supabase
        .from('print_jobs')
        .update({
          status: 'approved',
          admin_id: adminId,
          printer_id: printerAssignment,
          start_time: new Date().toISOString()
        })
        .eq('id', printJobId);
      
      if (error) throw error;
      
      // Get print job details
      const { data: printJob } = await supabase
        .from('print_jobs')
        .select('*')
        .eq('id', printJobId)
        .single();
      
      // Notify user
      await notificationService.sendNotification(
        printJob.initiated_by,
        {
          title: 'Print Approved',
          message: `Your print job has been approved and is being processed`,
          type: 'print_approved',
          channel: 'in_app'
        }
      );
      
      return { success: true, message: 'Print job approved' };
    } catch (err) {
      console.error('Approve Print Job Error:', err);
      throw err;
    }
  }
  
  // Mark print job as ready
  async markPrintReady(printJobId) {
    try {
      const completionTime = new Date().toISOString();
      
      const { data: printJob, error } = await supabase
        .from('print_jobs')
        .update({
          status: 'ready',
          completion_time: completionTime
        })
        .eq('id', printJobId)
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Notify user via Socket.IO
      const io = require('../app').get('io');
      io.to(`user_${printJob.initiated_by}`).emit('print_ready', {
        job_id: printJobId,
        message: 'Your print is ready for collection',
        collection_point: 'Library Counter'
      });
      
      // Also send notification
      await notificationService.sendNotification(
        printJob.initiated_by,
        {
          title: 'Print Ready',
          message: 'Your print is ready for collection at library counter',
          type: 'print_ready',
          channel: 'push'
        }
      );
      
      return { success: true, message: 'Print marked as ready' };
    } catch (err) {
      console.error('Mark Print Ready Error:', err);
      throw err;
    }
  }
  
  // Record collection (with receipt)
  async recordCollection(printJobId, collectedBy) {
    try {
      const collectionTime = new Date().toISOString();
      
      const { data: printJob, error } = await supabase
        .from('print_jobs')
        .update({
          status: 'collected',
          collected_by: collectedBy,
          collected_at: collectionTime
        })
        .eq('id', printJobId)
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Get file details for receipt
      const { data: file } = await supabase
        .from('file_shares')
        .select('file_name')
        .eq('id', printJob.file_share_id)
        .single();
      
      // Generate receipt
      const receipt = {
        job_id: printJobId,
        file_name: file.file_name,
        total_pages: printJob.total_pages,
        copies: printJob.copies,
        cost: printJob.cost,
        collected_at: collectionTime,
        collected_by: collectedBy
      };
      
      return {
        success: true,
        message: 'Collection recorded',
        receipt
      };
    } catch (err) {
      console.error('Record Collection Error:', err);
      throw err;
    }
  }
  
  // Reject print job (Admin)
  async rejectPrintJob(printJobId, adminId, reason) {
    try {
      const { data: printJob, error } = await supabase
        .from('print_jobs')
        .update({
          status: 'failed',
          admin_id: adminId,
          notes: `Rejected: ${reason}`
        })
        .eq('id', printJobId)
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Refund cost
      // Logic to handle refund/credit
      
      // Notify user
      await notificationService.sendNotification(
        printJob.initiated_by,
        {
          title: 'Print Request Rejected',
          message: `Your print request has been rejected. Reason: ${reason}`,
          type: 'print_rejected',
          channel: 'in_app'
        }
      );
      
      return { success: true, message: 'Print job rejected' };
    } catch (err) {
      console.error('Reject Print Job Error:', err);
      throw err;
    }
  }
}

module.exports = new PrintService();
```

### File: `src/routes/printJobs.js` (Add to routes if needed)

```javascript
const express = require('express');
const router = express.Router();
const printController = require('../controllers/printController');
const { authenticate, authorize } = require('../middleware/auth');

// Create print job (User)
router.post('/', authenticate, printController.createPrintJob);

// Get user's print jobs
router.get('/my-jobs', authenticate, printController.getUserPrintJobs);

// Get print job details
router.get('/:print_job_id', authenticate, printController.getPrintJobDetails);

// Get all print jobs (Admin)
router.get('/', authenticate, authorize('admin', 'librarian'), printController.getAllPrintJobs);

// Approve print job (Admin)
router.patch('/:print_job_id/approve', authenticate, authorize('admin'), printController.approvePrintJob);

// Mark as ready (Admin/Librarian)
router.patch('/:print_job_id/ready', authenticate, authorize('admin', 'librarian'), printController.markPrintReady);

// Record collection
router.patch('/:print_job_id/collected', authenticate, authorize('librarian'), printController.recordCollection);

// Reject print job (Admin)
router.patch('/:print_job_id/reject', authenticate, authorize('admin'), printController.rejectPrintJob);

module.exports = router;
```

---

## 📱 Mobile Implementation

### File: `src/screens/files/FileUploadScreen.js`

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { forms } from '../../redux/slices';

const FileUploadScreen = ({ navigation }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    tags: [],
    is_public: true
  });
  
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword'],
        copyToCacheDirectory: true
      });
      
      if (!result.cancelled) {
        setSelectedFile(result.assets[0]);
        Alert.alert('Success', `Selected: ${result.assets[0].name}`);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }
    
    if (!formData.subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }
    
    setLoading(true);
    try {
      const fileData = await FileSystem.readAsStringAsync(
        selectedFile.uri,
        { encoding: FileSystem.EncodingType.Base64 }
      );
      
      const formPayload = new FormData();
      formPayload.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType
      });
      formPayload.append('subject', formData.subject);
      formPayload.append('description', formData.description);
      formPayload.append('tags', JSON.stringify(formData.tags));
      formPayload.append('is_public', formData.is_public);
      
      const response = await fetch('http://localhost:3000/api/v1/file-shares/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formPayload
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', `File uploaded! Will auto-delete in 30 minutes`);
        navigation.goBack();
      } else {
        Alert.alert('Error', data.error.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Upload failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TouchableOpacity
        onPress={pickDocument}
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          marginBottom: 20
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
          {selectedFile ? `Selected: ${selectedFile.name}` : 'Choose File'}
        </Text>
      </TouchableOpacity>
      
      {/* Form fields for subject, description, etc. */}
      
      <TouchableOpacity
        onPress={handleUpload}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#888' : '#34C759',
          padding: 15,
          borderRadius: 8,
          marginTop: 20
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
          {loading ? 'Uploading...' : 'Upload File'}
        </Text>
      </TouchableOpacity>
      
      <Text style={{ marginTop: 10, color: '#666', fontSize: 12 }}>
        ⏱️ Files auto-delete after 30 minutes
      </Text>
    </View>
  );
};

export default FileUploadScreen;
```

---

## 📊 Print Job Status Workflow

```
User Request (queued)
    ↓
Admin Approves (approved) → Admin Rejects (failed)
    ↓
Printer Processes (printing)
    ↓
Ready for Collection (ready)
    ↓
Student Collects (collected)
    ↓
Receipt Generated
```

---

## 🔄 Scheduled Tasks

### Daily Auto-Delete Job
```bash
# Runs every 5 minutes
node src/jobs/autoDeleteFiles.js
```

### Print Queue Monitoring
```bash
# Admin dashboard shows:
# - Queued jobs count
# - Current printing jobs
# - Ready for collection count
```

