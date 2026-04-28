/**
 * Shelves/Racks Management Routes
 * CRUD operations for library shelves and storage locations
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
 * GET /shelves
 * List all shelves/racks
 * Public endpoint
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      let query = supabase
        .from('shelves')
        .select('*')
        .order('rack_number', { ascending: true });
  
      const { data, error } = await query;
  
      if (error) {
        console.warn('⚠️ Supabase shelves error (table may not exist):', error.message);
        return res.status(200).json({ success: true, data: [] });
      }
  
      res.json({
        success: true,
        data: data || [],
      });
    } catch (err) {
      console.warn('⚠️ Shelves fetch exception:', err.message);
      res.status(200).json({ success: true, data: [] });
    }
  })
);

/**
 * GET /shelves/:id
 * Get single shelf details
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('shelves')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      throw new NotFoundError('Shelf');
    }

    res.json({
      success: true,
      data,
    });
  })
);

/**
 * POST /shelves
 * Create new shelf (Librarian/Admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const {
      name,
      rack_number,
      description,
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      throw new ValidationError('Shelf name is required');
    }

    if (!rack_number || !rack_number.trim()) {
      throw new ValidationError('Rack number is required');
    }

    // Check if rack_number already exists
    const { data: existing } = await supabase
      .from('shelves')
      .select('id')
      .eq('rack_number', rack_number)
      .single();

    if (existing) {
      throw new ValidationError(`Rack number ${rack_number} already exists`);
    }

    const { data: shelf, error } = await supabase
      .from('shelves')
      .insert([
        {
          name: name.trim(),
          rack_number: rack_number.trim(),
          description: description || null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new APIError(`Failed to create shelf: ${error.message}`, 400);
    }

    res.status(201).json({
      success: true,
      message: 'Shelf created successfully',
      data: shelf,
    });
  })
);

/**
 * PUT /shelves/:id
 * Update shelf (Librarian/Admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      name,
      rack_number,
      floor_number,
      section,
      capacity,
      description,
    } = req.body;

    // Check if shelf exists
    const { data: existing } = await supabase
      .from('shelves')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      throw new NotFoundError('Shelf');
    }

    // Check if new rack_number already exists on another shelf
    if (rack_number) {
      const { data: duplicate } = await supabase
        .from('shelves')
        .select('id')
        .eq('rack_number', rack_number)
        .neq('id', id)
        .single();

      if (duplicate) {
        throw new ValidationError(`Rack number ${rack_number} already exists`);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (rack_number !== undefined) updateData.rack_number = rack_number;
    if (description !== undefined) updateData.description = description;
    updateData.updated_at = new Date().toISOString();

    const { data: shelf, error } = await supabase
      .from('shelves')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      message: 'Shelf updated successfully',
      data: shelf,
    });
  })
);

/**
 * DELETE /shelves/:id
 * Delete shelf (Librarian/Admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireLibrarian,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if shelf exists
    const { data: existing } = await supabase
      .from('shelves')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      throw new NotFoundError('Shelf');
    }

    // Check if shelf has any books
    const { data: books } = await supabase
      .from('books')
      .select('id')
      .contains('shelves', [id]);

    if (books && books.length > 0) {
      throw new ValidationError(
        `Cannot delete shelf with ${books.length} book(s). Please reassign books first.`
      );
    }

    const { error } = await supabase
      .from('shelves')
      .delete()
      .eq('id', id);

    if (error) {
      throw new APIError(error.message);
    }

    res.json({
      success: true,
      message: 'Shelf deleted successfully',
    });
  })
);

/**
 * GET /shelves/capacity/overview
 * Get shelf books overview
 */
router.get(
  '/capacity/overview',
  asyncHandler(async (req, res) => {
    const { data: shelves, error } = await supabase
      .from('shelves')
      .select('*');

    if (error) {
      throw new APIError(error.message);
    }

    // Count books on each shelf
    const shelvesWithCount = await Promise.all(
      shelves.map(async (shelf) => {
        const { count } = await supabase
          .from('books')
          .select('id', { count: 'exact' })
          .contains('shelves', [shelf.id]);

        return {
          ...shelf,
          booksCount: count || 0,
        };
      })
    );

    res.json({
      success: true,
      data: shelvesWithCount,
    });
  })
);

module.exports = router;
