const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const userController = require('../controllers/userController');

router.use(authMiddleware);
router.post('/upgrade-premium', userController.upgradePremium);

module.exports = router;
