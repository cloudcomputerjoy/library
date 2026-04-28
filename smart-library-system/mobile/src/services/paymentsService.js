/**
 * Payments API Service
 * All payment and fine-related operations
 */

import { apiClient } from './api';

// ============================================================
// FINE MANAGEMENT
// ============================================================

/**
 * Get user's fines
 * @returns {Promise<{fines, totalAmount, breakdown}>}
 */
export const getUserFines = async () => {
  try {
    const response = await apiClient.get('/payments/fines');
    return response.data;
  } catch (error) {
    console.error('Error fetching user fines:', error);
    throw error;
  }
};

/**
 * Get fine details for a specific issue
 * @param {string} issueId - Issue ID
 * @returns {Promise<{fine, calculationDetails}>}
 */
export const getFinDetail = async (issueId) => {
  try {
    const response = await apiClient.get(`/payments/fines/${issueId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching fine detail:', error);
    throw error;
  }
};

/**
 * Waive a fine (admin only)
 * @param {string} fineId - Fine ID
 * @param {string} reason - Reason for waiving
 * @returns {Promise<{fine, status}>}
 */
export const waiveFine = async (fineId, reason) => {
  try {
    const response = await apiClient.post(`/payments/fines/${fineId}/waive`, {
      reason,
    });
    return response.data;
  } catch (error) {
    console.error('Error waiving fine:', error);
    throw error;
  }
};

// ============================================================
// PAYMENT PROCESSING
// ============================================================

/**
 * Initialize payment for fines
 * @param {Array<string>} fineIds - Fine IDs to pay
 * @param {string} method - Payment method (bKash, Nagad, card, etc.)
 * @returns {Promise<{transactionId, amount, paymentUrl}>}
 */
export const initiatePayment = async (fineIds, method = 'bKash') => {
  try {
    const response = await apiClient.post('/payments/initiate', {
      fineIds,
      method,
    });
    return response.data;
  } catch (error) {
    console.error('Error initiating payment:', error);
    throw error;
  }
};

/**
 * Verify payment after completion
 * @param {string} transactionId - Transaction ID
 * @param {string} provider - Payment provider
 * @param {string} providerTransactionId - Provider's transaction ID
 * @returns {Promise<{payment, receipt, finesCleared}>}
 */
export const verifyPayment = async (transactionId, provider, providerTransactionId) => {
  try {
    const response = await apiClient.post('/payments/verify', {
      transactionId,
      provider,
      providerTransactionId,
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

/**
 * Get payment history
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<{payments, totalCount}>}
 */
export const getPaymentHistory = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/payments/history', {
      params: { page, limit },
    });
    return {
      payments: response.data.payments || [],
      totalCount: response.data.totalCount || 0,
    };
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};

/**
 * Get payment receipt
 * @param {string} paymentId - Payment ID
 * @returns {Promise<{receipt, downloadUrl}>}
 */
export const getReceipt = async (paymentId) => {
  try {
    const response = await apiClient.get(`/payments/${paymentId}/receipt`);
    return response.data;
  } catch (error) {
    console.error('Error fetching receipt:', error);
    throw error;
  }
};

/**
 * Download receipt as PDF
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Blob>}
 */
export const downloadReceiptPDF = async (paymentId) => {
  try {
    const response = await apiClient.get(`/payments/${paymentId}/receipt/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading receipt:', error);
    throw error;
  }
};

// ============================================================
// SUBSCRIPTION & PREMIUM
// ============================================================

/**
 * Get subscription status
 * @returns {Promise<{subscription, status, expiryDate}>}
 */
export const getSubscriptionStatus = async () => {
  try {
    const response = await apiClient.get('/payments/subscription');
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    throw error;
  }
};

/**
 * Upgrade to premium subscription
 * @param {string} plan - Plan type (monthly, yearly)
 * @returns {Promise<{transactionId, paymentUrl, planDetails}>}
 */
export const upgradeToPremium = async (plan = 'monthly') => {
  try {
    const response = await apiClient.post('/payments/upgrade-premium', {
      plan,
    });
    return response.data;
  } catch (error) {
    console.error('Error upgrading to premium:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 * @returns {Promise<{status}>}
 */
export const cancelSubscription = async () => {
  try {
    const response = await apiClient.post('/payments/cancel-subscription');
    return response.data;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

// ============================================================
// PAYMENT METHODS
// ============================================================

/**
 * Get available payment methods
 * @returns {Promise<PaymentMethod[]>}
 */
export const getPaymentMethods = async () => {
  try {
    const response = await apiClient.get('/payments/methods');
    return response.data.methods || [];
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};

/**
 * Add payment method
 * @param {Object} methodData - Payment method details
 * @returns {Promise<{method}>}
 */
export const addPaymentMethod = async (methodData) => {
  try {
    const response = await apiClient.post('/payments/methods', methodData);
    return response.data;
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
};

/**
 * Remove payment method
 * @param {string} methodId - Payment method ID
 * @returns {Promise<{success}>}
 */
export const removePaymentMethod = async (methodId) => {
  try {
    await apiClient.delete(`/payments/methods/${methodId}`);
    return { success: true };
  } catch (error) {
    console.error('Error removing payment method:', error);
    throw error;
  }
};

// ============================================================
// STATISTICS
// ============================================================

/**
 * Get payment statistics
 * @returns {Promise<{totalSpent, thisMonth, totalTransactions}>}
 */
export const getPaymentStats = async () => {
  try {
    const response = await apiClient.get('/payments/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    throw error;
  }
};

export default {
  getUserFines,
  getFinDetail,
  waiveFine,
  initiatePayment,
  verifyPayment,
  getPaymentHistory,
  getReceipt,
  downloadReceiptPDF,
  getSubscriptionStatus,
  upgradeToPremium,
  cancelSubscription,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  getPaymentStats,
};
