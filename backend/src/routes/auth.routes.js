const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, registerValidation, loginValidation } = require('../middlewares/validation');
const authMiddleware = require('../middlewares/auth');

router.post('/register', validate(registerValidation), authController.register);
router.post('/login', validate(loginValidation), authController.login);
router.post('/login-2fa', authController.loginWith2FA);
router.post('/google-login', authController.googleLogin);
router.post('/send-2fa-code', authController.send2FACode);

router.get('/profile', authMiddleware, authController.getProfile);
router.post('/change-password', authMiddleware, authController.changePassword);
router.post('/enable-2fa', authMiddleware, authController.enable2FA);
router.post('/verify-2fa', authMiddleware, authController.verify2FA);
router.post('/disable-2fa', authMiddleware, authController.disable2FA);

module.exports = router;
