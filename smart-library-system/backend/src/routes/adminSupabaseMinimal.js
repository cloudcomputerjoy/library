// Admin Routes - Supabase Integration (MINIMAL)
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminControllerSupabase-v2');

// ============================================
// DASHBOARD ROUTES
// ============================================
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/live-feed', adminController.getLiveFeed);
router.get('/dashboard/analytics', adminController.getAnalytics);

// ============================================
// USER MANAGEMENT ROUTES
// ============================================
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/bulk-import', adminController.bulkImportUsers);

// ============================================
// ATTENDANCE ROUTES
// ============================================
router.get('/attendance', adminController.getAttendance);

module.exports = router;
