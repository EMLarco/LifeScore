const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const invoiceController = require('../controllers/invoiceController');

router.use(authMiddleware);
router.post('/generate', invoiceController.generateInvoice);
router.get('/', invoiceController.getUserInvoices);
router.get('/:invoiceNumber/download', invoiceController.downloadInvoice);
router.get('/:invoiceId/download-pdf', invoiceController.downloadInvoiceById);
router.post('/:invoiceId/resend', invoiceController.resendInvoice);

module.exports = router;
