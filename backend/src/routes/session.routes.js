const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const sessionController = require('../controllers/sessionController');

router.use(authMiddleware);
router.get('/', sessionController.getSessions);
router.delete('/:sessionId', sessionController.revokeSession);
router.delete('/', sessionController.revokeAllSessions);

module.exports = router;
