/**
 * Categories Management Routes
 * CRUD operations for book categories
 */

const express = require('express');
const { supabase } = require('../config/database');
const { authenticateToken, requireLibrarian } = require('../middleware/auth');
const {
  APIError,
  ValidationError,
  NotFoundError,
  asyncHandler,
} = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /categories
 * List all categories
 * Public endpoint
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
  
      if (error) {
        console.warn('⚠️ Supabase categories error (table may not exist):', error.message);
        return res.status(200).json({ success: true, data: [], categories: [] });
      }
  
      res.json({
        success: true,
        data: data || [],
        categories: data || [], // Added for mobile app compatibility
      });
    } catch (err) {
      console.warn('⚠️ Categories fetch exception:', err.message);
      res.status(200).json({ success: true, data: [], categories: [] });
    }
  })
);

/**
 * GET /categories/:id
 * Get single category details
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      throw new NotFoundError('Category');
    }

    res.json({
      success: true,
      data,
    });
  })
);

/**
 * POST /categories
 * Create new category (Librarian/Admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { name, description, color, icon } = req.body;

    // Validation
    if (!name || !name.trim()) {
      throw new ValidationError('Category name is required');
    }

    // Check if category already exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name.trim())
      .single();

    if (existing) {
      throw new ValidationError(`Category "${name}" already exists`);
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert([
        {
          name: name.trim(),
          description: description || null,
          color: color || '#808080',
          icon: icon || null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new APIError(`Failed to create category: ${error.message}`, 400);
    }

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  })
);

/**
 * PUT /categories/:id
 * Update category (Librarian/Admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { name, description, color, icon } = req.body;

    if (!name || !name.trim()) {
      throw new ValidationError('Category name is required');
    }

    const { data: category, error } = await supabase
      .from('categories')
      .update({
        name: name.trim(),
        description: description || null,
        color: color || null,
        icon: icon || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !category) {
      throw new NotFoundError('Category');
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  })
);

/**
 * DELETE /categories/:id
 * Delete category (Librarian/Admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    // Check if category is in use
    const { data: booksUsingCategory } = await supabase
      .from('books')
      .select('id')
      .eq('category_id', req.params.id)
      .limit(1);

    if (booksUsingCategory && booksUsingCategory.length > 0) {
      throw new ValidationError('Cannot delete category that is in use by books');
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  })
);

module.exports = router;
