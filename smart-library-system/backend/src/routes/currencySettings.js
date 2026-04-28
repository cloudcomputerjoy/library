/**
 * Currency Settings Routes
 */

const express = require('express');
const router = express.Router();
const CurrencySettingsController = require('../controllers/currencySettingsController');

/**
 * GET /settings
 * Get current currency settings
 */
router.get('/settings', CurrencySettingsController.getSettings);

/**
 * POST /settings
 * Update currency settings (Admin only)
 */
router.post('/settings', CurrencySettingsController.updateSettings);

/**
 * GET /currencies
 * Get list of available currencies
 */
router.get('/currencies', CurrencySettingsController.getAvailableCurrencies);

/**
 * POST /format
 * Format amount with current currency
 */
router.post('/format', CurrencySettingsController.formatCurrency);

module.exports = router;
