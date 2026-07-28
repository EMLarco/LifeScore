const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const agentController = require('../controllers/agentController');

router.use(authMiddleware);

router.use(async (req, res, next) => {
  try {
    const pool = require('../config/database');
    const result = await pool.query('SELECT is_premium FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows[0]?.is_premium) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Esta funcion es solo para usuarios premium.',
      });
    }
    next();
  } catch (error) {
    next(error);
  }
});

router.get('/suggestions', agentController.getSuggestions);
router.post('/chat', agentController.chat);

module.exports = router;
