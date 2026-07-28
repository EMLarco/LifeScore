const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const scheduleController = require('../controllers/scheduleController');

router.use(authMiddleware);
router.get('/', scheduleController.getSchedule);
router.put('/', scheduleController.updateSchedule);

module.exports = router;
