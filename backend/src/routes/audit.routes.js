const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');
const auditController = require('../controllers/auditController');

router.use(authMiddleware);
router.use(adminMiddleware);
router.get('/', auditController.generateAudit);

module.exports = router;
