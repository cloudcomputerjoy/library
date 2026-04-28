/**
 * Currency Settings Controller
 * Manages currency configuration for the library system
 */

const { supabase } = require('../config/supabaseClient');

class CurrencySettingsController {
  /**
   * Get current currency settings
   */
  static async getSettings(req, res) {
    try {
      const { data, error } = await supabase
        .from('library_settings')
        .select('*')
        .eq('setting_key', 'currency_config')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Default settings
      const defaultSettings = {
        setting_key: 'currency_config',
        currency_code: 'INR',
        currency_symbol: '₹',
        currency_name: 'Indian Rupee',
        fine_rate_per_day: 10,
        language: 'en',
        timezone: 'Asia/Kolkata'
      };

      const settings = data || defaultSettings;

      return res.status(200).json({
        success: true,
        settings: settings
      });
    } catch (err) {
      console.error('Get settings error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to get currency settings'
      });
    }
  }

  /**
   * Update currency settings (Admin only)
   */
  static async updateSettings(req, res) {
    try {
      const {
        currency_code,
        currency_symbol,
        currency_name,
        fine_rate_per_day,
        language,
        timezone
      } = req.body;

      // Validate inputs
      if (!currency_code || !currency_symbol) {
        return res.status(400).json({
          success: false,
          message: 'Currency code and symbol are required'
        });
      }

      if (fine_rate_per_day && fine_rate_per_day < 0) {
        return res.status(400).json({
          success: false,
          message: 'Fine rate cannot be negative'
        });
      }

      const settings = {
        setting_key: 'currency_config',
        currency_code: currency_code.toUpperCase(),
        currency_symbol: currency_symbol,
        currency_name: currency_name || currency_code,
        fine_rate_per_day: fine_rate_per_day || 10,
        language: language || 'en',
        timezone: timezone || 'Asia/Kolkata',
        updated_at: new Date().toISOString(),
        updated_by: req.user?.id || 'admin'
      };

      // Upsert settings
      const { data, error } = await supabase
        .from('library_settings')
        .upsert([settings], { onConflict: 'setting_key' })
        .select();

      if (error) throw error;

      // Log audit
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          action: 'update_currency_settings',
          user_id: req.user?.id || 'admin',
          details: {
            old_currency: null, // Could track old values
            new_currency: currency_code,
            fine_rate: fine_rate_per_day
          }
        });

      if (auditError) console.error('Audit log error:', auditError);

      return res.status(200).json({
        success: true,
        message: 'Currency settings updated successfully',
        settings: settings
      });
    } catch (err) {
      console.error('Update settings error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to update currency settings'
      });
    }
  }

  /**
   * Get available currencies
   */
  static async getAvailableCurrencies(req, res) {
    try {
      const currencies = [
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
        { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
        { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
        { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
        { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
        { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
        { code: 'THB', symbol: '฿', name: 'Thai Baht' },
        { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
        { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
        { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
        { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
        { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
        { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
        { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
        { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
        { code: 'KRW', symbol: '₩', name: 'South Korean Won' }
      ];

      return res.status(200).json({
        success: true,
        currencies: currencies
      });
    } catch (err) {
      console.error('Get currencies error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to get available currencies'
      });
    }
  }

  /**
   * Format amount with currency
   */
  static async formatCurrency(req, res) {
    try {
      const { amount } = req.body;

      if (amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Amount is required'
        });
      }

      // Get current settings
      const { data: settings } = await supabase
        .from('library_settings')
        .select('*')
        .eq('setting_key', 'currency_config')
        .single();

      const config = settings || {
        currency_symbol: '₹',
        fine_rate_per_day: 10
      };

      const formatted = `${config.currency_symbol}${amount.toFixed(2)}`;

      return res.status(200).json({
        success: true,
        formatted: formatted,
        symbol: config.currency_symbol,
        amount: amount
      });
    } catch (err) {
      console.error('Format currency error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to format currency'
      });
    }
  }
}

module.exports = CurrencySettingsController;
