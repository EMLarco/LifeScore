const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const PushSubscription = require('../models/PushSubscription');

router.post('/subscribe', authMiddleware, async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos: endpoint y keys son requeridos',
      });
    }
    await PushSubscription.saveSubscription(req.user.id, endpoint, keys);
    res.status(201).json({
      success: true,
      message: 'Suscripción push guardada correctamente',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;