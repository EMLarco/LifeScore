const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const challengeController = require('../controllers/challengeController');

router.use(authMiddleware);
router.get('/', challengeController.getChallenges);
router.get('/stats', challengeController.getChallengeStats);
router.post('/:id/complete', challengeController.completeChallenge);

module.exports = router;
