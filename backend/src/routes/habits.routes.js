const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const authMiddleware = require('../middlewares/auth');
const { validate, habitValidation } = require('../middlewares/validation');

router.use(authMiddleware);

router.get('/', habitController.getHabits);
router.post('/', validate(habitValidation), habitController.createHabit);
router.put('/:id', validate(habitValidation), habitController.updateHabit);
router.delete('/:id', habitController.deleteHabit);
router.post('/:id/complete', habitController.completeHabit);

module.exports = router;