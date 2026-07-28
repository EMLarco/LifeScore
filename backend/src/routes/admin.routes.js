const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');
const adminController = require('../controllers/adminController');

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stats', adminController.getStats);
router.get('/activity', adminController.getRecentActivity);
router.get('/users', adminController.getAllUsersAdmin);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/toggle-premium', adminController.togglePremium);
router.post('/users/:userId/revoke-2fa', adminController.revoke2FA);

router.get('/habits', adminController.getAllHabits);
router.delete('/habits/:id', adminController.deleteHabitAdmin);

router.get('/rewards', adminController.getRewardsAdmin);
router.post('/rewards', adminController.createReward);
router.put('/rewards/:id', adminController.updateReward);
router.delete('/rewards/:id', adminController.deleteReward);

router.get('/achievements', adminController.getAchievementsAdmin);

module.exports = router;
