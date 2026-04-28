/**
 * Issues API Service
 * All book issue, return, and transaction operations
 */

import { apiClient } from './api';

// ============================================================
// ISSUE BOOK OPERATIONS
// ============================================================

/**
 * Issue (borrow) a book
 * @param {string} bookId - Book ID
 * @param {string} copyId - Specific book copy ID (optional)
 * @returns {Promise<{issue, dueDate, finePerDay}>}
 */
export const issueBook = async (bookId, copyId = null) => {
  try {
    const response = await apiClient.post('/issues/issue-book', {
      bookId,
      copyId,
    });
    return response.data;
  } catch (error) {
    console.error('Error issuing book:', error);
    throw error;
  }
};

/**
 * Renew an issued book (extend due date)
 * @param {string} issueId - Issue ID
 * @returns {Promise<{issue, newDueDate}>}
 */
export const renewBook = async (issueId) => {
  try {
    const response = await apiClient.post(`/issues/${issueId}/renew`);
    return response.data;
  } catch (error) {
    console.error('Error renewing book:', error);
    throw error;
  }
};

// ============================================================
// RETURN BOOK OPERATIONS
// ============================================================

/**
 * Return a borrowed book
 * @param {string} issueId - Issue ID
 * @param {string} condition - Book condition (good, damaged, lost)
 * @returns {Promise<{return, fineAmount, receipt}>}
 */
export const returnBook = async (issueId, condition = 'good') => {
  try {
    const response = await apiClient.post('/issues/return-book', {
      issueId,
      condition,
    });
    return response.data;
  } catch (error) {
    console.error('Error returning book:', error);
    throw error;
  }
};

/**
 * Report a book as damaged or lost
 * @param {string} issueId - Issue ID
 * @param {string} condition - Condition: 'damaged' or 'lost'
 * @param {string} description - Description of damage/loss
 * @returns {Promise<{report, fineAmount}>}
 */
export const reportBookDamage = async (issueId, condition, description) => {
  try {
    const response = await apiClient.post(`/issues/${issueId}/report-damage`, {
      condition,
      description,
    });
    return response.data;
  } catch (error) {
    console.error('Error reporting damage:', error);
    throw error;
  }
};

// ============================================================
// VIEW BORROWING HISTORY & STATUS
// ============================================================

/**
 * Get currently borrowed books
 * @returns {Promise<Issue[]>}
 */
export const getBorrowedBooks = async () => {
  try {
    const response = await apiClient.get('/issues/active');
    return response.data.issues || [];
  } catch (error) {
    console.error('Error fetching borrowed books:', error);
    throw error;
  }
};

/**
 * Get borrowing history (past transactions)
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<{issues, totalCount, hasMore}>}
 */
export const getBorrowingHistory = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/issues/history', {
      params: { page, limit },
    });
    return {
      issues: response.data.issues || [],
      totalCount: response.data.totalCount || 0,
      hasMore: page < Math.ceil((response.data.totalCount || 0) / limit),
    };
  } catch (error) {
    console.error('Error fetching borrowing history:', error);
    throw error;
  }
};

/**
 * Get transaction history (all activities)
 * @param {string} type - Filter: 'issue', 'return', 'payment', or 'all'
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<{transactions, totalCount}>}
 */
export const getTransactionHistory = async (type = 'all', page = 1, limit = 15) => {
  try {
    const response = await apiClient.get('/users/transactions', {
      params: {
        type: type !== 'all' ? type : undefined,
        page,
        limit,
      },
    });
    return {
      transactions: response.data.transactions || [],
      totalCount: response.data.totalCount || 0,
    };
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
};

/**
 * Get overdue books
 * @returns {Promise<{overdueIssues, totalFine}>}
 */
export const getOverdueBooks = async () => {
  try {
    const response = await apiClient.get('/issues/overdue');
    return response.data;
  } catch (error) {
    console.error('Error fetching overdue books:', error);
    throw error;
  }
};

/**
 * Get issue details
 * @param {string} issueId - Issue ID
 * @returns {Promise<Issue>}
 */
export const getIssueDetail = async (issueId) => {
  try {
    const response = await apiClient.get(`/issues/${issueId}`);
    return response.data.issue;
  } catch (error) {
    console.error('Error fetching issue detail:', error);
    throw error;
  }
};

// ============================================================
// BATCH OPERATIONS
// ============================================================

/**
 * Return multiple books at once
 * @param {Array<{issueId, condition}>} returns - Array of returns
 * @returns {Promise<{returns, totalFine}>}
 */
export const returnMultipleBooks = async (returns) => {
  try {
    const response = await apiClient.post('/issues/batch-return', {
      returns,
    });
    return response.data;
  } catch (error) {
    console.error('Error returning multiple books:', error);
    throw error;
  }
};

/**
 * Issue multiple books via QR scanning
 * @param {Array<{bookId, copyId}>} books - Books to issue
 * @returns {Promise<{issues, successCount, failedCount}>}
 */
export const issueBulkBooks = async (books) => {
  try {
    const response = await apiClient.post('/issues/bulk-issue', {
      books,
    });
    return response.data;
  } catch (error) {
    console.error('Error issuing bulk books:', error);
    throw error;
  }
};

// ============================================================
// ISSUE STATISTICS
// ============================================================

/**
 * Get borrowing stats
 * @returns {Promise<{totalBorrowed, currentBorrowed, overdueCount, totalFine}>}
 */
export const getIssuingStats = async () => {
  try {
    const response = await apiClient.get('/issues/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching issuing stats:', error);
    throw error;
  }
};

// ============================================================
// ISSUANCE REQUEST OPERATIONS (Student-Admin Two-Step Flow)
// ============================================================

/**
 * Create an issuance request (Student scans QR → Biometric verification → Create request)
 * @param {string} bookId - Book ID
 * @param {string} qrCode - QR code scanned by student
 * @param {object} bookDetails - Book details
 * @returns {Promise<{success, requestId, message}>}
 */
export const createIssuanceRequest = async (bookId, qrCode, bookDetails, options = {}) => {
  const { requestType = 'issue', transactionId = null } = options;
  try {
    const response = await apiClient.post('/issues/create-request', {
      bookId,
      qrCode,
      bookTitle: bookDetails?.title,
      bookIsbn: bookDetails?.isbn,
      requestedAt: new Date().toISOString(),
      requestType,
      transactionId,
    });
    return {
      success: true,
      requestId: response.data.requestId,
      message: response.data.message || 'Request created successfully',
    };
  } catch (error) {
    console.error('Error creating issuance request:', error);
    throw error;
  }
};

export const createReturnRequest = async (bookId, qrCode, bookDetails, transactionId = null) =>
  createIssuanceRequest(bookId, qrCode, bookDetails, {
    requestType: 'return',
    transactionId,
  });

export const createReissueRequest = async (bookId, qrCode, bookDetails, transactionId) =>
  createIssuanceRequest(bookId, qrCode, bookDetails, {
    requestType: 'reissue',
    transactionId,
  });

/**
 * Get pending issuance requests for admin
 * @returns {Promise<Array<{requestId, studentId, studentName, bookId, bookTitle, bookIsbn, qrCode, createdAt, status}>>}
 */
export const getPendingIssuanceRequests = async () => {
  try {
    const response = await apiClient.get('/issues/pending-requests');
    return response.data.requests || [];
  } catch (error) {
    console.error('Error fetching pending issuance requests:', error);
    throw error;
  }
};

/**
 * Complete issuance request (Admin scans book QR → Book issued)
 * @param {string} requestId - Request ID to complete
 * @param {string} bookQrCode - QR code scanned by admin
 * @returns {Promise<{success, issueId, message}>}
 */
export const completeIssuanceRequest = async (requestId, bookQrCode) => {
  try {
    const response = await apiClient.post('/issues/complete-request', {
      requestId,
      bookQrCode,
      completedAt: new Date().toISOString(),
    });
    return {
      success: true,
      issueId: response.data.issueId,
      message: response.data.message || 'Book issued successfully',
    };
  } catch (error) {
    console.error('Error completing issuance request:', error);
    throw error;
  }
};

/**
 * Cancel an issuance request
 * @param {string} requestId - Request ID to cancel
 * @returns {Promise<{success, message}>}
 */
export const cancelIssuanceRequest = async (requestId) => {
  try {
    const response = await apiClient.post(`/issues/cancel-request`, {
      requestId,
    });
    return {
      success: true,
      message: response.data.message || 'Request cancelled',
    };
  } catch (error) {
    console.error('Error cancelling issuance request:', error);
    throw error;
  }
};

export default {
  issueBook,
  renewBook,
  returnBook,
  reportBookDamage,
  getBorrowedBooks,
  getBorrowingHistory,
  getTransactionHistory,
  getOverdueBooks,
  getIssueDetail,
  returnMultipleBooks,
  issueBulkBooks,
  getIssuingStats,
  createIssuanceRequest,
  createReturnRequest,
  createReissueRequest,
  getPendingIssuanceRequests,
  completeIssuanceRequest,
  cancelIssuanceRequest,
};
