const express = require('express');
const { authenticateToken, requireLibrarian } = require('../middleware/auth');
const paymentsController = require('../controllers/paymentsController');

const router = express.Router();

router.get('/fines/outstanding', authenticateToken, paymentsController.getOutstandingFines);
router.post('/pay-fines', authenticateToken, paymentsController.payFines);
router.get('/history', authenticateToken, paymentsController.getPaymentHistory);
router.get('/summary', authenticateToken, paymentsController.getPaymentSummary);
router.post('/waive', authenticateToken, requireLibrarian, paymentsController.waiveFine);
router.get('/stats', authenticateToken, requireLibrarian, paymentsController.getPaymentStats);

module.exports = router;
