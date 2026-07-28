const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const friendsController = require('../controllers/friendsController');

router.use(authMiddleware);
router.get('/all', friendsController.getAllUsers);
router.get('/search', friendsController.searchUsers);
router.get('/', friendsController.getFriends);
router.get('/pending', friendsController.getPendingRequests);
router.post('/', friendsController.sendFriendRequest);
router.put('/:id/accept', friendsController.acceptFriendRequest);
router.put('/:id/reject', friendsController.rejectFriendRequest);
router.delete('/:id', friendsController.removeFriend);

module.exports = router;
