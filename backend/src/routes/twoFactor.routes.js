const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const twoFactorController = require('../controllers/twoFactorController');

router.use(authMiddleware);
router.get('/setup', twoFactorController.setup2FA);
router.post('/verify', twoFactorController.verifyAndEnable2FA);
router.post('/disable', twoFactorController.disable2FA);

module.exports = router;
