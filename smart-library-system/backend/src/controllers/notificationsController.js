/**
 * Notifications Controller
 * Handles user notifications (due dates, fines, announcements, etc.)
 */

const { supabase } = require('../config/database');

/**
 * Get user's notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

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
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.body;

    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Notification marked as read',
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.body;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create notification (internal use)
 */
exports.createNotification = async (userId, data) => {
  try {
    const { title, message, type, relatedEntityId } = data;

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        related_entity_id: relatedEntityId,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Send due date reminder notifications
 * Called via cron job or admin endpoint
 */
exports.sendDueReminders = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Get books due in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(
        `
        id,
        user_id,
        due_date,
        book: book_id (id, title)
      `
      )
      .eq('transaction_type', 'issue')
      .is('returned_date', null)
      .lte('due_date', threeDaysFromNow.toISOString())
      .gte('due_date', new Date().toISOString());

    if (error) throw error;

    let notificationCount = 0;

    for (const transaction of transactions) {
      await exports.createNotification(transaction.user_id, {
        title: 'Book Due Soon',
        message: `Your book "${transaction.book.title}" is due on ${new Date(
          transaction.due_date
        ).toLocaleDateString()}`,
        type: 'due_reminder',
        relatedEntityId: transaction.id,
      });
      notificationCount++;
    }

    res.json({
      success: true,
      message: `Sent ${notificationCount} due date reminders`,
      count: notificationCount,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Send overdue notifications
 */
exports.sendOverdueNotifications = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(
        `
        id,
        user_id,
        due_date,
        fine_amount,
        book: book_id (id, title)
      `
      )
      .eq('transaction_type', 'issue')
      .is('returned_date', null)
      .lt('due_date', new Date().toISOString());

    if (error) throw error;

    let notificationCount = 0;

    for (const transaction of transactions) {
      const daysOverdue = Math.ceil(
        (new Date() - new Date(transaction.due_date)) / (1000 * 60 * 60 * 24)
      );

      await exports.createNotification(transaction.user_id, {
        title: 'Book Overdue',
        message: `Your book "${transaction.book.title}" is ${daysOverdue} days overdue. Fine: ₹${transaction.fine_amount}`,
        type: 'overdue',
        relatedEntityId: transaction.id,
      });
      notificationCount++;
    }

    res.json({
      success: true,
      message: `Sent ${notificationCount} overdue notifications`,
      count: notificationCount,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Send announcement to all users
 */
exports.sendAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { title, message, targetRole = 'all' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required',
      });
    }

    // Get target users
    let query = supabase.from('profiles').select('user_id');

    if (targetRole !== 'all') {
      query = query.eq('role', targetRole);
    }

    const { data: users, error: userError } = await query;

    if (userError) throw userError;

    let notificationCount = 0;

    for (const user of users) {
      await exports.createNotification(user.user_id, {
        title,
        message,
        type: 'announcement',
      });
      notificationCount++;
    }

    res.json({
      success: true,
      message: `Announcement sent to ${notificationCount} users`,
      count: notificationCount,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get notification preferences
 */
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // Return default preferences if not found
    const preferences = data || {
      user_id: userId,
      due_reminders: true,
      overdue_alerts: true,
      announcements: true,
      fine_alerts: true,
      email_notifications: true,
      push_notifications: true,
    };

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update notification preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const preferences = req.body;

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      // Update
      result = await supabase
        .from('notification_preferences')
        .update(preferences)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Insert
      result = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          ...preferences,
        })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    res.json({
      success: true,
      message: 'Preferences updated',
      data: result.data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
