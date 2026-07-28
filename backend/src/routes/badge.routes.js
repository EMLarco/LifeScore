const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const badgeController = require('../controllers/badgeController');

router.use(authMiddleware);
router.get('/', badgeController.getUserBadges);

module.exports = router;
