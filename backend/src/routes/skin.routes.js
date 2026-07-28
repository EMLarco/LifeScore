const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const skinController = require('../controllers/skinController');

router.use(authMiddleware);
router.get('/', skinController.getSkins);
router.post('/:skinId/buy', skinController.buySkin);
router.post('/:skinId/equip', skinController.equipSkin);

module.exports = router;
