const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const premiumChallengeController = require('../controllers/premiumChallengeController');

router.use(authMiddleware);
router.get('/', premiumChallengeController.getPremiumChallenges);
router.post('/:challengeId/complete', premiumChallengeController.completePremiumChallenge);

module.exports = router;
