const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const achievementsController = require('../controllers/achievementsController');

router.use(authMiddleware);
router.get('/', achievementsController.getAchievements);

module.exports = router;
