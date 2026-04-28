// Settings Controller - Supabase Integration

const { supabase, getAll, getById, create, update, logAdminAction, } = require('../config/supabase-new');

// ============================================
// SETTINGS MANAGEMENT  
// ============================================

/**
 * GET /api/admin/settings
 * Get all settings
 */
const getAllSettings = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('setting_key', { ascending: true });

    if (error) throw error;

    // Convert to key-value object
    const settings = {};
    data?.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value;
    });

    return res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get all settings error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
    });
  }
};

/**
 * GET /api/admin/settings/:key
 * Get specific setting
 */
const getSetting = async (req, res, next) => {
  try {
    const { key } = req.params;

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('setting_key', key)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found',
      });
    }

    return res.json({
      success: true,
      data: {
        key: data.setting_key,
        value: data.setting_value,
        type: data.setting_type,
      },
    });
  } catch (error) {
    console.error('Get setting error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch setting',
    });
  }
};

/**
 * PUT /api/admin/settings/:key
 * Update specific setting
 */
const updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'value is required',
      });
    }

    // Get existing setting first
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('setting_key', key)
      .single();

    let setting;

    if (existing) {
      // Update existing
      setting = await update('settings', existing.id, {
        setting_value: value,
        updated_by: req.user.id,
      });
    } else {
      // Create new
      setting = await create('settings', {
        setting_key: key,
        setting_value: value,
        setting_type: typeof value === 'number' ? 'number' : 'string',
        updated_by: req.user.id,
      });
    }

    await logAdminAction(
      req.user.id,
      'update',
      'setting',
      key,
      { key, value }
    );

    return res.json({
      success: true,
      data: setting,
      message: 'Setting updated successfully',
    });
  } catch (error) {
    console.error('Update setting error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update setting',
    });
  }
};

/**
 * POST /api/admin/settings/batch
 * Update multiple settings at once
 */
const updateBatchSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        error: 'settings must be an array',
      });
    }

    const updates = [];
    const creations = [];

    // Prepare updates and creations
    for (const setting of settings) {
      const { key, value } = setting;

      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('setting_key', key)
        .single();

      if (existing) {
        updates.push({
          id: existing.id,
          setting_value: value,
          updated_by: req.user.id,
        });
      } else {
        creations.push({
          setting_key: key,
          setting_value: value,
          setting_type: typeof value === 'number' ? 'number' : 'string',
          updated_by: req.user.id,
        });
      }
    }

    // Execute updates and creations
    if (updates.length > 0) {
      await supabase.from('settings').upsert(updates);
    }

    if (creations.length > 0) {
      await supabase.from('settings').insert(creations);
    }

    await logAdminAction(
      req.user.id,
      'update',
      'setting',
      null,
      { batch_count: settings.length }
    );

    return res.json({
      success: true,
      message: `${settings.length} settings updated successfully`,
    });
  } catch (error) {
    console.error('Batch update settings error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update settings',
    });
  }
};

/**
 * GET /api/admin/settings/fine-rules
 * Get fine configuration
 */
const getFineRules = async (req, res, next) => {
  try {
    const keys = [
      'late_return_fine_per_day',
      'damage_fine',
      'lost_book_fine',
      'max_fine_limit',
    ];

    const { data, error } = await supabase
      .from('settings')
      .select('setting_key, setting_value')
      .in('setting_key', keys);

    if (error) throw error;

    const rules = {};
    data?.forEach(setting => {
      rules[setting.setting_key] = parseFloat(setting.setting_value);
    });

    return res.json({
      success: true,
      data: {
        lateReturnPerDay: rules.late_return_fine_per_day || 5,
        damageFine: rules.damage_fine || 100,
        lostBookFine: rules.lost_book_fine || 500,
        maxFineLimit: rules.max_fine_limit || 1000,
      },
    });
  } catch (error) {
    console.error('Get fine rules error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch fine rules',
    });
  }
};

/**
 * PUT /api/admin/settings/fine-rules
 * Update fine rules
 */
const updateFineRules = async (req, res, next) => {
  try {
    const { lateReturnPerDay, damageFine, lostBookFine, maxFineLimit } = req.body;

    const updates = [];

    if (lateReturnPerDay !== undefined) {
      updates.push({ key: 'late_return_fine_per_day', value: lateReturnPerDay });
    }
    if (damageFine !== undefined) {
      updates.push({ key: 'damage_fine', value: damageFine });
    }
    if (lostBookFine !== undefined) {
      updates.push({ key: 'lost_book_fine', value: lostBookFine });
    }
    if (maxFineLimit !== undefined) {
      updates.push({ key: 'max_fine_limit', value: maxFineLimit });
    }

    for (const { key, value } of updates) {
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('setting_key', key)
        .single();

      if (existing) {
        await update('settings', existing.id, { setting_value: value });
      } else {
        await create('settings', {
          setting_key: key,
          setting_value: value,
          setting_type: 'number',
        });
      }
    }

    await logAdminAction(
      req.user.id,
      'update',
      'setting',
      null,
      { type: 'fine_rules', updates }
    );

    return res.json({
      success: true,
      message: 'Fine rules updated successfully',
    });
  } catch (error) {
    console.error('Update fine rules error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update fine rules',
    });
  }
};

/**
 * GET /api/admin/settings/library-info
 * Get library information settings
 */
const getLibraryInfo = async (req, res, next) => {
  try {
    const keys = [
      'library_name',
      'library_open_time',
      'library_close_time',
      'max_books_per_student',
    ];

    const { data, error } = await supabase
      .from('settings')
      .select('setting_key, setting_value')
      .in('setting_key', keys);

    if (error) throw error;

    const info = {};
    data?.forEach(setting => {
      info[setting.setting_key] = setting.setting_value;
    });

    return res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error('Get library info error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch library info',
    });
  }
};

module.exports = {
  getAllSettings,
  getSetting,
  updateSetting,
  updateBatchSettings,
  getFineRules,
  updateFineRules,
  getLibraryInfo,
};
