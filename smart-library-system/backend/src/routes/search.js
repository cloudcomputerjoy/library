const express = require('express');
const { supabase } = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    if (!q) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: 0,
        },
      });
    }

    if (type === 'categories') {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .order('name', { ascending: true })
        .range(offset, offset + parseInt(limit, 10) - 1);

      if (error) throw error;

      return res.json({
        success: true,
        data,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: data.length,
        },
      });
    }

    const { data, error, count } = await supabase
      .from('books')
      .select(
        `
        *,
        category: category_id (id, name),
        authors: book_authors (author: author_id (id, name))
      `,
        { count: 'exact' }
      )
      .or(`title.ilike.%${q}%,description.ilike.%${q}%,isbn.ilike.%${q}%`)
      .order('title', { ascending: true })
      .range(offset, offset + parseInt(limit, 10) - 1);

    if (error) throw error;

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: count,
        totalPages: Math.ceil((count || 0) / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
