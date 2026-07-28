const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const rewardsController = require('../controllers/rewardsController');

router.use(authMiddleware);
router.get('/', rewardsController.getAvailableRewards);
router.get('/mine', rewardsController.getUserRewards);
router.post('/:rewardId/redeem', rewardsController.redeemReward);

module.exports = router;
