const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const calendarController = require('../controllers/calendarController');

router.use(authMiddleware);
router.get('/', calendarController.getEvents);
router.post('/', calendarController.createEvent);
router.delete('/:id', calendarController.deleteEvent);

module.exports = router;
