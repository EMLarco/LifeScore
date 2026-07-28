const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Middlewares
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');

// Rutas
const authRoutes = require('./routes/auth.routes');
const habitsRoutes = require('./routes/habits.routes');
const pushRoutes = require('./routes/push.routes');
const gamificationRoutes = require('./routes/gamification.routes');
const rewardsRoutes = require('./routes/rewards.routes');
const profileRoutes = require('./routes/profile.routes');
const storeRoutes = require('./routes/store.routes');
const userRoutes = require('./routes/user.routes');
const calendarRoutes = require('./routes/calendar.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const agentRoutes = require('./routes/agent.routes');
const adminRoutes = require('./routes/admin.routes');
const challengeRoutes = require('./routes/challenge.routes');
const badgeRoutes = require('./routes/badge.routes');
const friendsRoutes = require('./routes/friends.routes');
const friendChallengesRoutes = require('./routes/friend-challenges.routes');
const achievementsRoutes = require('./routes/achievements.routes');
const paymentRoutes = require('./routes/payment.routes');
const twoFactorRoutes = require('./routes/twoFactor.routes');
const auditRoutes = require('./routes/audit.routes');
const rankingRoutes = require('./routes/ranking.routes');
const skinRoutes = require('./routes/skin.routes');
const sessionRoutes = require('./routes/session.routes');
const premiumChallengeRoutes = require('./routes/premium-challenges.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const transactionRoutes = require('./routes/transaction.routes');
const withdrawalRoutes = require('./routes/withdrawal.routes');

const app = express();

// Middlewares globales (orden secuencial - pág. 38)
app.use(helmet()); // Seguridad
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json()); // Parsear JSON
app.use(express.urlencoded({ extended: true }));

// Middleware Logger (pág. 39)
app.use(logger);

// Static files - uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/friend-challenges', friendChallengesRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/admin/audit', auditRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/skins', skinRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/premium-challenges', premiumChallengeRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/withdrawals', withdrawalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LifeScore API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// PayPal direct redirect fallback (sin prefijo /api)
const paymentController = require('./controllers/paymentController');
app.get('/success', paymentController.captureOrder);
app.get('/cancel', paymentController.cancelOrder);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
  });
});

// Middleware de manejo de errores (DEBE IR AL FINAL - pág. 46)
app.use(errorHandler);

module.exports = app;