/**
 * RFID Controller
 * Handles RFID card registration, scanning, and transactions
 */

const { supabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Register RFID card for user
 */
exports.registerRFIDCard = async (req, res) => {
  try {
    const userId = req.userId;
    const { rfidTag, cardName = 'My Library Card' } = req.body;

    if (!rfidTag || rfidTag.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'RFID tag is required',
      });
    }

    // Check if RFID tag already registered
    const { data: existingCard } = await supabase
      .from('rfid_cards')
      .select('id')
      .eq('rfid_tag', rfidTag)
      .single();

    if (existingCard) {
      return res.status(400).json({
        success: false,
        message: 'This RFID tag is already registered',
      });
    }

    // Register card
    const { data: card, error: cardError } = await supabase
      .from('rfid_cards')
      .insert({
        user_id: userId,
        rfid_tag: rfidTag.toUpperCase(),
        card_name: cardName,
        is_active: true,
      })
      .select()
      .single();

    if (cardError) throw cardError;

    res.status(201).json({
      success: true,
      message: 'RFID card registered successfully',
      data: card,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user's RFID cards
 */
exports.getUserRFIDCards = async (req, res) => {
  try {
    const userId = req.userId;

    const { data: cards, error } = await supabase
      .from('rfid_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: cards,
      count: cards.length,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Deactivate RFID card
 */
exports.deactivateRFIDCard = async (req, res) => {
  try {
    const userId = req.userId;
    const { cardId } = req.body;

    // Verify card owner
    const { data: card, error: cardError } = await supabase
      .from('rfid_cards')
      .select('id')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (cardError || !card) {
      return res.status(403).json({
        success: false,
        message: 'Card not found or access denied',
      });
    }

    // Deactivate
    const { data: updatedCard, error: updateError } = await supabase
      .from('rfid_cards')
      .update({ is_active: false })
      .eq('id', cardId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'RFID card deactivated',
      data: updatedCard,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Scan RFID card
 */
exports.scanRFIDCard = async (req, res) => {
  try {
    const { rfidTag, action = 'issue' } = req.body;

    if (!rfidTag || rfidTag.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'RFID tag is required',
      });
    }

    // Find card
    const { data: card, error: cardError } = await supabase
      .from('rfid_cards')
      .select(
        `
        *,
        user: user_id (id, name, email, student_id, membership_status)
      `
      )
      .eq('rfid_tag', rfidTag.toUpperCase())
      .eq('is_active', true)
      .single();

    if (cardError || !card) {
      return res.status(404).json({
        success: false,
        message: 'RFID card not found or inactive',
      });
    }

    // Check membership status
    if (card.user.membership_status !== 'active') {
      return res.status(403).json({
        success: false,
        warning: 'User membership not active',
        user: card.user,
      });
    }

    res.json({
      success: true,
      message: 'RFID card scanned successfully',
      data: {
        card,
        user: card.user,
        action,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Process transaction via RFID + Book barcode
 */
exports.processRFIDTransaction = async (req, res) => {
  try {
    const { rfidTag, bookBarcode, action = 'issue' } = req.body;

    if (!rfidTag || !bookBarcode) {
      return res.status(400).json({
        success: false,
        message: 'Both RFID tag and book barcode are required',
      });
    }

    // Find RFID card and user
    const { data: card, error: cardError } = await supabase
      .from('rfid_cards')
      .select(
        `
        *,
        user: user_id (id, name, email, membership_status)
      `
      )
      .eq('rfid_tag', rfidTag.toUpperCase())
      .eq('is_active', true)
      .single();

    if (cardError || !card) {
      return res.status(404).json({
        success: false,
        message: 'RFID card not found',
      });
    }

    if (card.user.membership_status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'User membership not active',
      });
    }

    // Find book by barcode
    const { data: book, error: bookError } = await supabase
      .from('book_copies')
      .select(
        `
        *,
        book: book_id (id, title, isbn)
      `
      )
      .eq('barcode', bookBarcode.toUpperCase())
      .single();

    if (bookError || !book) {
      return res.status(404).json({
        success: false,
        message: 'Book barcode not found',
      });
    }

    let result;

    if (action === 'issue') {
      // Check if book is available
      if (book.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: `Book is currently ${book.status}`,
        });
      }

      // Check if user already has this book
      const { data: activeIssue } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', card.user.id)
        .eq('book_id', book.book_id)
        .eq('transaction_type', 'issue')
        .is('returned_date', null)
        .single();

      if (activeIssue) {
        return res.status(400).json({
          success: false,
          message: 'User already has this book issued',
        });
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      // Create transaction
      const { data: transaction, error: txnError } = await supabase
        .from('transactions')
        .insert({
          user_id: card.user.id,
          book_id: book.book_id,
          book_copy_id: book.id,
          transaction_type: 'issue',
          issued_date: new Date().toISOString(),
          due_date: dueDate.toISOString(),
          status: 'completed',
        })
        .select()
        .single();

      if (txnError) throw txnError;

      // Update book copy status
      await supabase
        .from('book_copies')
        .update({ status: 'issued' })
        .eq('id', book.id);

      result = {
        transaction,
        action: 'issue',
        message: `Book "${book.book.title}" issued to ${card.user.name}`,
        dueDate: dueDate.toISOString(),
      };
    } else if (action === 'return') {
      // Find active issue
      const { data: transaction, error: txnError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', card.user.id)
        .eq('book_id', book.book_id)
        .eq('transaction_type', 'issue')
        .is('returned_date', null)
        .single();

      if (txnError || !transaction) {
        return res.status(404).json({
          success: false,
          message: 'No active issue found for this book',
        });
      }

      // Calculate fine if overdue
      const returnDate = new Date();
      const dueDate = new Date(transaction.due_date);
      let fine = 0;

      if (returnDate > dueDate) {
        const daysOverdue = Math.ceil(
          (returnDate - dueDate) / (1000 * 60 * 60 * 24)
        );
        fine = daysOverdue * (parseFloat(process.env.DAILY_FINE_AMOUNT) || 10);
      }

      // Update transaction
      const { data: returnTransaction, error: returnError } = await supabase
        .from('transactions')
        .update({
          returned_date: returnDate.toISOString(),
          fine_amount: fine,
          status: 'completed',
        })
        .eq('id', transaction.id)
        .select()
        .single();

      if (returnError) throw returnError;

      // Update book copy status
      await supabase
        .from('book_copies')
        .update({ status: 'available' })
        .eq('id', book.id);

      // Create fine record if applicable
      if (fine > 0) {
        await supabase.from('fines').insert({
          user_id: card.user.id,
          transaction_id: transaction.id,
          amount: fine,
          reason: `Book returned overdue via RFID`,
          status: 'pending',
        });
      }

      result = {
        transaction: returnTransaction,
        action: 'return',
        fine,
        message: `Book "${book.book.title}" returned${fine > 0 ? ` with fine of ₹${fine}` : ''}`,
      };
    }

    // Log RFID transaction
    await supabase.from('rfid_logs').insert({
      rfid_card_id: card.id,
      book_copy_id: book.id,
      action,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get RFID transaction logs
 */
exports.getRFIDLogs = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, offset = 0 } = req.query;

    // Get user's RFID cards
    const { data: cards } = await supabase
      .from('rfid_cards')
      .select('id')
      .eq('user_id', userId);

    const cardIds = cards.map((c) => c.id);

    // Get logs for these cards
    const { data: logs, error, count } = await supabase
      .from('rfid_logs')
      .select(
        `
        *,
        bookCopy: book_copy_id (
          barcode,
          book: book_id (title, isbn)
        )
      `,
        { count: 'exact' }
      )
      .in('rfid_card_id', cardIds)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: logs,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get RFID statistics (admin)
 */
exports.getRFIDStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { data: stats } = await supabase
      .from('rfid_logs')
      .select('action', { count: 'exact' });

    const { data: activeCards } = await supabase
      .from('rfid_cards')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    const issueCount = stats.filter((s) => s.action === 'issue').length;
    const returnCount = stats.filter((s) => s.action === 'return').length;

    res.json({
      success: true,
      data: {
        totalRFIDCards: activeCards.length,
        totalTransactions: stats.length,
        issues: issueCount,
        returns: returnCount,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
