const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const paymentController = require('../controllers/paymentController');

router.post('/webhook', paymentController.handleWebhook);

router.get('/success', paymentController.captureOrder);
router.get('/cancel', paymentController.cancelOrder);

router.post('/create-order', authMiddleware, paymentController.createOrder);
router.get('/subscription/status', authMiddleware, paymentController.getSubscriptionStatus);
router.get('/history', authMiddleware, paymentController.getPaymentHistory);

router.get('/points/packages', authMiddleware, paymentController.getPointsPackages);
router.post('/buy-points', authMiddleware, paymentController.buyPoints);
router.get('/points-success', paymentController.capturePointsOrder);

module.exports = router;
