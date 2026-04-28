/**
 * Payment Gateway Service - bKash & Nagad Integration
 * Production-ready payment processing
 */

import axios from 'axios';
import crypto from 'crypto';

// ============================================
// BKASH SERVICE
// ============================================

class BKashService {
  constructor(config) {
    this.appKey = config.appKey;
    this.appSecret = config.appSecret;
    this.username = config.username;
    this.password = config.password;
    this.baseUrl = config.mode === 'production' 
      ? 'https://api.bkash.com' 
      : 'https://sandbox.bkash.com';
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Generate authorization token
   */
  async getToken() {
    try {
      // Check if token is still valid
      if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.token;
      }

      const response = await axios.post(`${this.baseUrl}/checkout/token/request`, {
        app_key: this.appKey,
        app_secret: this.appSecret,
      }, {
        headers: {
          'username': this.username,
          'password': this.password,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.statusCode === '0000') {
        this.token = response.data.id_token;
        // Token valid for 60 minutes
        this.tokenExpiry = Date.now() + (55 * 60 * 1000);
        return this.token;
      }

      throw new Error(`Failed to get bKash token: ${response.data.statusMessage}`);
    } catch (error) {
      console.error('bKash token error:', error);
      throw error;
    }
  }

  /**
   * Create payment request
   */
  async createPayment(amount, orderId, description, callbackUrl) {
    try {
      const token = await this.getToken();

      const response = await axios.post(`${this.baseUrl}/checkout/payment/create`, {
        amount: amount.toString(),
        currency: 'BDT',
        orderID: orderId,
        intent: 'sale',
        mode: '0011',
        payerReference: orderId,
        merchantInvoiceNumber: orderId,
        callbackURL: callbackUrl,
      }, {
        headers: {
          'authorization': token,
          'X-APP-Key': this.appKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.statusCode === '0000') {
        return {
          success: true,
          paymentId: response.data.paymentID,
          url: response.data.bkashURL,
        };
      }

      throw new Error(`Create payment failed: ${response.data.statusMessage}`);
    } catch (error) {
      console.error('bKash create payment error:', error);
      throw error;
    }
  }

  /**
   * Execute payment
   */
  async executePayment(paymentId) {
    try {
      const token = await this.getToken();

      const response = await axios.post(`${this.baseUrl}/checkout/payment/execute`, {
        paymentID: paymentId,
      }, {
        headers: {
          'authorization': token,
          'X-APP-Key': this.appKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.statusCode === '0000') {
        return {
          success: true,
          transactionId: response.data.trxID,
          status: response.data.transactionStatus,
          amount: response.data.amount,
          payer: response.data.reference,
        };
      }

      throw new Error(`Execute payment failed: ${response.data.statusMessage}`);
    } catch (error) {
      console.error('bKash execute payment error:', error);
      throw error;
    }
  }

  /**
   * Query transaction status
   */
  async queryTransaction(transactionId) {
    try {
      const token = await this.getToken();

      const response = await axios.get(
        `${this.baseUrl}/checkout/payment/status/${transactionId}`,
        {
          headers: {
            'authorization': token,
            'X-APP-Key': this.appKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.statusCode === '0000') {
        return {
          success: true,
          status: response.data.transactionStatus,
          amount: response.data.amount,
          date: response.data.transactionDate,
        };
      }

      throw new Error(`Query transaction failed: ${response.data.statusMessage}`);
    } catch (error) {
      console.error('bKash query transaction error:', error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(transactionId, amount, reason) {
    try {
      const token = await this.getToken();

      const response = await axios.post(`${this.baseUrl}/checkout/payment/refund`, {
        paymentID: transactionId,
        amount: amount.toString(),
        reason: reason,
        sku: 'library-fine-refund',
      }, {
        headers: {
          'authorization': token,
          'X-APP-Key': this.appKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.statusCode === '0000') {
        return {
          success: true,
          refundId: response.data.refundTrxID,
          status: response.data.transactionStatus,
        };
      }

      throw new Error(`Refund failed: ${response.data.statusMessage}`);
    } catch (error) {
      console.error('bKash refund error:', error);
      throw error;
    }
  }
}

// ============================================
// NAGAD SERVICE
// ============================================

class NagadService {
  constructor(config) {
    this.merchantId = config.merchantId;
    this.publicKey = config.publicKey;
    this.privateKey = config.privateKey;
    this.baseUrl = config.mode === 'production'
      ? 'https://api.nagad.com.bd'
      : 'https://sandbox.nagad.com.bd';
  }

  /**
   * Generate request signature
   */
  generateSignature(data) {
    const message = JSON.stringify(data);
    const signature = crypto
      .createSign('sha256')
      .update(message)
      .sign(this.privateKey, 'base64');
    return signature;
  }

  /**
   * Create payment request
   */
  async createPayment(amount, orderId, description, callbackUrl, customerPhone) {
    try {
      const payload = {
        merchant_id: this.merchantId,
        order_id: orderId,
        amount: (amount * 100).toString(), // Amount in paisa
        currency: 'BDT',
        description: description,
        callback_url: callbackUrl,
        customer_phone: customerPhone,
        timestamp: Math.floor(Date.now() / 1000),
      };

      const signature = this.generateSignature(payload);

      const response = await axios.post(`${this.baseUrl}/api/v1/checkout/initialize`, payload, {
        headers: {
          'Signature': signature,
          'merchant_id': this.merchantId,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status === 'INITIATED') {
        return {
          success: true,
          sessionId: response.data.session_id,
          url: response.data.payment_url,
        };
      }

      throw new Error(`Create payment failed: ${response.data.message}`);
    } catch (error) {
      console.error('Nagad create payment error:', error);
      throw error;
    }
  }

  /**
   * Complete payment
   */
  async completePayment(sessionId) {
    try {
      const payload = {
        merchant_id: this.merchantId,
        session_id: sessionId,
        timestamp: Math.floor(Date.now() / 1000),
      };

      const signature = this.generateSignature(payload);

      const response = await axios.post(
        `${this.baseUrl}/api/v1/checkout/complete`,
        payload,
        {
          headers: {
            'Signature': signature,
            'merchant_id': this.merchantId,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'COMPLETED') {
        return {
          success: true,
          transactionId: response.data.transaction_id,
          status: response.data.status,
          amount: response.data.amount / 100, // Convert from paisa
        };
      }

      throw new Error(`Complete payment failed: ${response.data.message}`);
    } catch (error) {
      console.error('Nagad complete payment error:', error);
      throw error;
    }
  }

  /**
   * Verify transaction
   */
  async verifyTransaction(transactionId) {
    try {
      const payload = {
        merchant_id: this.merchantId,
        transaction_id: transactionId,
        timestamp: Math.floor(Date.now() / 1000),
      };

      const signature = this.generateSignature(payload);

      const response = await axios.get(
        `${this.baseUrl}/api/v1/transaction/verify`,
        {
          headers: {
            'Signature': signature,
            'merchant_id': this.merchantId,
            'Content-Type': 'application/json',
          },
          data: payload,
        }
      );

      if (response.data.status === 'VERIFIED') {
        return {
          success: true,
          status: response.data.status,
          amount: response.data.amount / 100,
        };
      }

      throw new Error('Transaction verification failed');
    } catch (error) {
      console.error('Nagad verify transaction error:', error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(transactionId, amount, reason) {
    try {
      const payload = {
        merchant_id: this.merchantId,
        transaction_id: transactionId,
        amount: (amount * 100).toString(),
        reason: reason,
        timestamp: Math.floor(Date.now() / 1000),
      };

      const signature = this.generateSignature(payload);

      const response = await axios.post(
        `${this.baseUrl}/api/v1/refund`,
        payload,
        {
          headers: {
            'Signature': signature,
            'merchant_id': this.merchantId,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'REFUNDED') {
        return {
          success: true,
          refundId: response.data.refund_id,
          status: response.data.status,
        };
      }

      throw new Error(`Refund failed: ${response.data.message}`);
    } catch (error) {
      console.error('Nagad refund error:', error);
      throw error;
    }
  }
}

export { BKashService, NagadService };
