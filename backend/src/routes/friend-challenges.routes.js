const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const friendChallengesController = require('../controllers/friendChallengesController');

router.use(authMiddleware);
router.get('/', friendChallengesController.getActiveChallenges);
router.post('/', friendChallengesController.createChallenge);
router.put('/:id/accept', friendChallengesController.acceptChallenge);
router.put('/:id/complete', friendChallengesController.completeChallenge);

module.exports = router;
