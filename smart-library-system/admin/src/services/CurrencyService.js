/**
 * Currency Service
 * Centralized currency configuration and formatting
 */

import axios from 'axios';

class CurrencyService {
  constructor() {
    this.config = null;
    this.currencies = [];
    this.listeners = [];
    this.API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  /**
   * Initialize currency settings
   */
  async initialize() {
    try {
      const response = await axios.get(`${this.API_URL}/api/currency/settings`);
      if (response.data.success) {
        this.config = response.data.settings;
        this.notifyListeners();
      }
    } catch (err) {
      console.error('Failed to initialize currency:', err);
      // Use defaults
      this.config = {
        currency_code: 'INR',
        currency_symbol: '₹',
        currency_name: 'Indian Rupee',
        fine_rate_per_day: 10
      };
    }
  }

  /**
   * Get current currency config
   */
  getConfig() {
    return this.config || {
      currency_code: 'INR',
      currency_symbol: '₹',
      currency_name: 'Indian Rupee',
      fine_rate_per_day: 10
    };
  }

  /**
   * Get currency symbol
   */
  getSymbol() {
    return this.config?.currency_symbol || '₹';
  }

  /**
   * Get fine rate per day
   */
  getFineRate() {
    return this.config?.fine_rate_per_day || 10;
  }

  /**
   * Get currency code
   */
  getCode() {
    return this.config?.currency_code || 'INR';
  }

  /**
   * Format amount with currency
   */
  format(amount) {
    if (!amount && amount !== 0) return this.getSymbol() + '0.00';
    return `${this.getSymbol()}${parseFloat(amount).toFixed(2)}`;
  }

  /**
   * Calculate fine for days overdue
   */
  calculateFine(daysOverdue) {
    if (daysOverdue <= 0) return 0;
    return daysOverdue * this.getFineRate();
  }

  /**
   * Format fine amount
   */
  formatFine(daysOverdue) {
    const amount = this.calculateFine(daysOverdue);
    return this.format(amount);
  }

  /**
   * Get available currencies
   */
  async getAvailableCurrencies() {
    if (this.currencies.length > 0) {
      return this.currencies;
    }

    try {
      const response = await axios.get(`${this.API_URL}/api/currency/currencies`);
      if (response.data.success) {
        this.currencies = response.data.currencies;
        return this.currencies;
      }
    } catch (err) {
      console.error('Failed to get currencies:', err);
      return [];
    }
  }

  /**
   * Update currency settings
   */
  async updateSettings(settings) {
    try {
      const response = await axios.post(
        `${this.API_URL}/api/currency/settings`,
        settings
      );

      if (response.data.success) {
        this.config = response.data.settings;
        this.notifyListeners();
        return true;
      }
    } catch (err) {
      console.error('Failed to update currency settings:', err);
      throw err;
    }
  }

  /**
   * Add change listener
   */
  addChangeListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove change listener
   */
  removeChangeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  /**
   * Notify all listeners of change
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.config);
      } catch (err) {
        console.error('Error in currency listener:', err);
      }
    });
  }

  /**
   * Get currency display info
   */
  getDisplayInfo() {
    return {
      code: this.getCode(),
      symbol: this.getSymbol(),
      name: this.config?.currency_name || this.getCode(),
      fineRatePerDay: this.getFineRate()
    };
  }
}

// Singleton instance
let instance = null;

export const getCurrencyService = () => {
  if (!instance) {
    instance = new CurrencyService();
  }
  return instance;
};

export default CurrencyService;
