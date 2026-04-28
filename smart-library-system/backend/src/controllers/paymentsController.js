/**
 * Payments Controller
 * Handles payment processing and fine management
 */

const { supabase } = require('../config/database');
const fcmService = require('../services/fcmService');

/**
 * Get user's outstanding fines
 */
exports.getOutstandingFines = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: fines, error } = await supabase
      .from('fines')
      .select(
        `
        *,
        transaction: transaction_id (
          id,
          issued_date,
          due_date,
          returned_date,
          book: book_id (id, title, isbn)
        )
      `
      )
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalAmount = fines.reduce((sum, fine) => sum + fine.amount, 0);

    res.json({
      success: true,
      data: fines,
      summary: {
        count: fines.length,
        totalAmount,
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
 * Process fine payment
 * In production, this would integrate with payment gateway
 */
exports.payFines = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, fineIds, paymentMethod = 'online', transactionRef } = req.body;

    if (!fineIds || fineIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one fine must be selected',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount',
      });
    }

    // Verify fines belong to user and are pending
    const { data: fines, error: fetchError } = await supabase
      .from('fines')
      .select('id, amount')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .in('id', fineIds);

    if (fetchError) throw fetchError;

    if (fines.length !== fineIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some fines not found or already paid',
      });
    }

    // Verify total amount matches
    const totalFinesAmount = fines.reduce((sum, fine) => sum + fine.amount, 0);
    if (Math.abs(amount - totalFinesAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Payment amount must equal ${totalFinesAmount}`,
      });
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount,
        payment_method: paymentMethod,
        payment_reference: transactionRef,
        transaction_type: 'fine_payment',
        status: 'success',
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Mark fines as paid and link to payment
    const { error: updateError } = await supabase
      .from('fines')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        payment_id: payment.id,
      })
      .in('id', fineIds);

    if (updateError) throw updateError;

    // Send FCM notification about payment
    try {
      await fcmService.sendNotificationToUser(
        userId,
        {
          title: '💰 Fine Payment Received',
          body: `Your fine payment of ₹${amount} has been processed successfully`
        },
        {
          type: 'fine_payment',
          amount: amount.toString(),
          fines_paid: fineIds.length.toString(),
          payment_id: payment.id,
          transaction_ref: transactionRef
        }
      );
      console.log(`✅ Fine payment notification sent to user ${userId}`);
    } catch (notificationError) {
      console.error('⚠️ Failed to send FCM notification:', notificationError.message);
      // Continue even if notification fails
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        payment,
        finesPaid: fineIds.length,
        amountPaid: amount,
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
 * Get payment history
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data,
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
 * Get payment summary for user
 */
exports.getPaymentSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all payments
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('user_id', userId)
      .eq('status', 'success');

    if (paymentError) throw paymentError;

    // Get all fines
    const { data: fines, error: fineError } = await supabase
      .from('fines')
      .select('amount, status');

    if (fineError) throw fineError;

    const summary = {
      totalPaid: payments.reduce((sum, p) => sum + p.amount, 0),
      paymentCount: payments.length,
      totalFines: fines.reduce((sum, f) => sum + f.amount, 0),
      paidFines: fines
        .filter((f) => f.status === 'paid')
        .reduce((sum, f) => sum + f.amount, 0),
      pendingFines: fines
        .filter((f) => f.status === 'pending')
        .reduce((sum, f) => sum + f.amount, 0),
      outstandingFines: fines.filter((f) => f.status === 'pending').length,
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Waive a fine (admin only)
 */
exports.waiveFine = async (req, res) => {
  try {
    // Check if user is admin/librarian (middleware should validate)
    if (req.user.role !== 'librarian' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only librarians can waive fines',
      });
    }

    const { fineId, reason = '' } = req.body;

    const { data: fine, error: fineError } = await supabase
      .from('fines')
      .update({
        status: 'waived',
        waived_date: new Date().toISOString(),
        waive_reason: reason,
      })
      .eq('id', fineId)
      .select()
      .single();

    if (fineError) throw fineError;

    res.json({
      success: true,
      message: 'Fine waived successfully',
      data: fine,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get dashboard statistics (admin)
 */
exports.getPaymentStats = async (req, res) => {
  try {
    if (req.user.role !== 'librarian' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Total revenue
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'success');

    // Outstanding fines
    const { data: outstandingFines } = await supabase
      .from('fines')
      .select('amount')
      .eq('status', 'pending');

    // Overdue books
    const { data: overdueTransactions } = await supabase
      .from('transactions')
      .select('id, fine_amount')
      .lt('due_date', new Date().toISOString())
      .is('returned_date', null);

    const stats = {
      totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      paymentCount: payments.length,
      outstandingAmount: outstandingFines.reduce((sum, f) => sum + f.amount, 0),
      outstandingCount: outstandingFines.length,
      overdueBooks: overdueTransactions.length,
      overdueTotal: overdueTransactions.reduce(
        (sum, t) => sum + (t.fine_amount || 0),
        0
      ),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
