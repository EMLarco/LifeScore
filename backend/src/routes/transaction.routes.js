const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const transactionController = require('../controllers/transactionController');

router.use(authMiddleware);

router.get('/', transactionController.getTransactions);
router.post('/:transactionId/send-invoice', transactionController.sendInvoice);
router.get('/:transactionId/download', transactionController.downloadInvoice);

module.exports = router;
