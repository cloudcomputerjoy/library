/**
 * File Handling Utilities
 * Format file sizes, handle file types, manage uploads
 */

/**
 * Format bytes to human-readable size
 * Example: 1024 → "1 KB"
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
};

/**
 * Get file icon based on type
 */
export const getFileIcon = (filename) => {
  const ext = getFileExtension(filename);
  
  const iconMap = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📄',
    xls: '📊',
    xlsx: '📊',
    ppt: '🎯',
    pptx: '🎯',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    zip: '📦',
    rar: '📦',
  };
  
  return iconMap[ext] || '📎';
};

/**
 * Validate if file is PDF
 */
export const isPDFFile = (filename) => {
  return getFileExtension(filename).toLowerCase() === 'pdf';
};

/**
 * Validate file size
 * maxBytes default: 50MB = 52428800 bytes
 */
export const validateFileSize = (bytes, maxBytes = 52428800) => {
  if (bytes > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(maxBytes)}`,
    };
  }
  
  return { valid: true };
};

/**
 * Validate file type
 */
export const validateFileType = (filename, allowedTypes = ['pdf']) => {
  const ext = getFileExtension(filename).toLowerCase();
  
  if (!allowedTypes.includes(ext)) {
    return {
      valid: false,
      error: `File type .${ext} not allowed. Allowed: ${allowedTypes.join(', ')}`,
    };
  }
  
  return { valid: true };
};

/**
 * Validate both size and type
 */
export const validateFile = (filename, bytes, options = {}) => {
  const { maxBytes = 52428800, allowedTypes = ['pdf'] } = options;
  
  const typeValidation = validateFileType(filename, allowedTypes);
  if (!typeValidation.valid) return typeValidation;
  
  const sizeValidation = validateFileSize(bytes, maxBytes);
  if (!sizeValidation.valid) return sizeValidation;
  
  return { valid: true };
};

/**
 * Calculate number of pages (estimate based on file size)
 * Rough estimate: ~100 pages per 100KB for PDFs
 */
export const estimatePageCount = (filename, bytes) => {
  if (!isPDFFile(filename)) return null;
  
  // Rough estimate: ~100 pages per 100KB
  // 1 page ≈ 1KB for text-heavy PDFs
  const estimatedPages = Math.max(1, Math.ceil(bytes / 1024));
  
  return estimatedPages;
};

/**
 * Calculate print cost
 * Default: ₹2 per page B&W, ₹5 per page Color
 */
export const calculatePrintCost = (pageCount, isColor = false) => {
  if (!pageCount || pageCount < 0) return 0;
  
  const costPerPage = isColor ? 5 : 2;
  return pageCount * costPerPage;
};

/**
 * Format page range
 * Example: "pages 1-20"
 */
export const formatPageRange = (pages) => {
  if (!pages) return 'All pages';
  
  if (Array.isArray(pages)) {
    return `pages ${pages[0]}-${pages[1]}`;
  }
  
  return `page ${pages}`;
};

/**
 * Get file status badge color
 */
export const getFileStatusColor = (status) => {
  const colorMap = {
    pending: '#fbc02d',
    uploading: '#2196f3',
    completed: '#388e3c',
    failed: '#d32f2f',
    deleted: '#9e9e9e',
  };
  
  return colorMap[status] || '#757575';
};

/**
 * Get file status text
 */
export const getFileStatusText = (status, expiresAt) => {
  if (status === 'completed' && expiresAt) {
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const remainingMs = expiryTime - now;
    
    if (remainingMs <= 0) return 'Expired';
    
    const minutes = Math.floor(remainingMs / (1000 * 60));
    if (minutes < 1) return 'Expiring soon';
    if (minutes < 5) return `Expiring in ${minutes} min`;
    
    return 'Ready';
  }
  
  const textMap = {
    pending: 'Pending',
    uploading: 'Uploading...',
    completed: 'Ready',
    failed: 'Failed',
    deleted: 'Deleted',
  };
  
  return textMap[status] || 'Unknown';
};

/**
 * Generate unique filename with timestamp
 * Example: "document_2024_01_15_143022.pdf"
 */
export const generateUniqueFilename = (originalFilename) => {
  if (!originalFilename) return null;
  
  const ext = getFileExtension(originalFilename);
  const name = originalFilename.replace(`.${ext}`, '');
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
  
  return `${name}_${timestamp}.${ext}`;
};

/**
 * Get file info summary
 */
export const getFileSummary = (file) => {
  return {
    name: file.name,
    size: formatFileSize(file.size),
    type: getFileExtension(file.name),
    icon: getFileIcon(file.name),
    pages: estimatePageCount(file.name, file.size),
    cost: calculatePrintCost(estimatePageCount(file.name, file.size)),
  };
};

export default {
  formatFileSize,
  getFileExtension,
  getFileIcon,
  isPDFFile,
  validateFileSize,
  validateFileType,
  validateFile,
  estimatePageCount,
  calculatePrintCost,
  formatPageRange,
  getFileStatusColor,
  getFileStatusText,
  generateUniqueFilename,
  getFileSummary,
};
