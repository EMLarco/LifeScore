const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware);
router.get('/stats', gamificationController.getStats);

module.exports = router;