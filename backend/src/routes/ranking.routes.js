const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const rankingController = require('../controllers/rankingController');

router.get('/global', rankingController.getGlobalRanking);
router.get('/friends', authMiddleware, rankingController.getFriendsRanking);

module.exports = router;
