const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const profileController = require('../controllers/profileController');

router.use(authMiddleware);
router.put('/', profileController.updateProfile);
router.post('/avatar', profileController.uploadAvatar, profileController.updateAvatar);
router.put('/username-tag', profileController.updateUsernameAndTag);
router.get('/export', profileController.exportUserData);
router.get('/banners', profileController.getBanners);
router.post('/banners/:bannerId/purchase', profileController.purchaseBanner);
router.put('/slack-webhook', profileController.updateSlackWebhook);

module.exports = router;
