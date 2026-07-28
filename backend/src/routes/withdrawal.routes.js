const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');
const withdrawalController = require('../controllers/withdrawalController');

router.use(authMiddleware);
router.get('/', withdrawalController.getWithdrawals);
router.post('/', withdrawalController.requestWithdrawal);

router.get('/admin', adminMiddleware, withdrawalController.getAllWithdrawals);
router.put('/admin/:withdrawalId/approve', adminMiddleware, withdrawalController.approveWithdrawal);
router.put('/admin/:withdrawalId/pay', adminMiddleware, withdrawalController.markAsPaid);
router.put('/admin/:withdrawalId/reject', adminMiddleware, withdrawalController.rejectWithdrawal);

module.exports = router;
