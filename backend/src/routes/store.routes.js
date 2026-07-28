const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const storeController = require('../controllers/storeController');

router.use(authMiddleware);
router.get('/', storeController.getItems);
router.get('/my-items', storeController.getMyItems);
router.get('/:itemId', storeController.getItemById);
router.post('/:itemId/purchase', storeController.purchaseItem);

module.exports = router;
