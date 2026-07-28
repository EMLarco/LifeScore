const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const {
  calculateXPGain,
  calculateLevel,
  hasLeveledUp,
  checkAchievements,
} = require('../services/gamificationLogic');
const { sendToUser } = require('../services/pushNotification');
const { sendSlackNotification } = require('../services/slackService');
const { auditLog } = require('../services/auditService');

const getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.findByUserId(req.user.id);
    res.status(200).json({ success: true, data: habits });
  } catch (error) {
    next(error);
  }
};

const createHabit = async (req, res, next) => {
  try {
    const { title, icon, color } = req.body;
    const habit = await Habit.create({
      user_id: req.user.id,
      title,
      icon: icon || '📋',
      color: color || '#2ECC71',
    });

    // Verificar logro "Primer Hábito"
    const userStats = await User.getStats(req.user.id);
    const unlockedKeys = await Achievement.getUnlockedKeys(req.user.id);
    const newAchievements = checkAchievements(
      { ...userStats, level: req.user.level },
      unlockedKeys
    );

    for (const key of newAchievements) {
      await Achievement.create(req.user.id, key);
    }

    if (newAchievements.length > 0) {
      const names = newAchievements.map(k => {
        const found = require('../services/gamificationLogic').ACHIEVEMENTS.find(a => a.key === k);
        return found ? `${found.icon} ${found.name}` : k;
      }).join(', ');
      await sendToUser(req.user.id, '🏆 ¡Logro desbloqueado!', `Has conseguido: ${names}`);
    }

    res.status(201).json({
      success: true,
      message: 'Hábito creado exitosamente',
      data: habit,
      achievements: newAchievements,
    });
  } catch (error) {
    next(error);
  }
};

const updateHabit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, icon, color, position } = req.body;

    const updated = await Habit.update(id, req.user.id, { title, icon, color, position });
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Hábito no encontrado o no te pertenece',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hábito actualizado',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const deleteHabit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Habit.deleteById(id, req.user.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Hábito no encontrado o no te pertenece',
      });
    }

    res.status(204).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const completeHabit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const habit = await Habit.findByIdAndUser(id, userId);
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Hábito no encontrado o no te pertenece',
      });
    }

    const alreadyCompleted = await HabitLog.isCompletedToday(id, userId);
    if (alreadyCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Ya completaste este hábito hoy',
      });
    }

    await HabitLog.createLog(id, userId);
    const streak = await HabitLog.getStreak(id, userId);
    const xpGained = calculateXPGain(streak);

    const user = await User.findById(userId);
    const newTotalXp = user.total_xp + xpGained;
    const newLevel = calculateLevel(newTotalXp);
    const leveledUp = hasLeveledUp(user.level, newLevel);

    await User.updateXpAndLevel(userId, newTotalXp, newLevel);

    // === NUEVO: Bonus de puntos por completar hábito ===
    const userPointsBonus = Math.floor(xpGained / 5); // 1 punto por cada 5 XP
    await User.updateStreakAndPoints(userId, streak, userPointsBonus);

    // Calcular total de completados
    const totalCompletedQuery = await require('../config/database').query(
      'SELECT COUNT(*) as total FROM habit_logs WHERE user_id = $1',
      [userId]
    );
    const totalCompleted = parseInt(totalCompletedQuery.rows[0]?.total) || 0;

    // Verificar logros
    const userStats = {
      habits_count: (await User.getStats(userId)).habits_count,
      max_streak: (await User.getStats(userId)).max_streak,
      level: newLevel,
      total_completed: totalCompleted,
    };
    const unlockedKeys = await Achievement.getUnlockedKeys(userId);
    const newAchievements = checkAchievements(userStats, unlockedKeys);

    for (const key of newAchievements) {
      await Achievement.create(userId, key);
    }

    // Notificaciones push
    if (leveledUp) {
      await sendToUser(
        userId,
        `🎉 ¡Subiste al Nivel ${newLevel}!`,
        `Has ganado ${xpGained} XP al completar "${habit.title}". ¡Sigue así!`
      );
    } else {
      await sendToUser(
        userId,
        `✅ Completaste "${habit.title}"`,
        `+${xpGained} XP · Racha actual: ${streak} días 🔥`
      );
    }

    if (newAchievements.length > 0) {
      const names = newAchievements.map(k => {
        const found = require('../services/gamificationLogic').ACHIEVEMENTS.find(a => a.key === k);
        return found ? `${found.icon} ${found.name}` : k;
      }).join(', ');
      await sendToUser(userId, '🏆 ¡Nuevo logro!', `Has desbloqueado: ${names}`);
    }

    // Notificacion Slack
    try {
      const db = require('../config/database');
      const slackResult = await db.query('SELECT slack_webhook FROM users WHERE id = $1', [userId]);
      if (slackResult.rows[0]?.slack_webhook) {
        await sendSlackNotification(
          slackResult.rows[0].slack_webhook,
          `✅ Has completado "${habit.title}" +${xpGained} XP 🔥 Racha: ${streak}`
        );
      }
    } catch {
      // Silent fail for Slack
    }

    await auditLog(userId, 'HABIT_COMPLETE', 'habit', parseInt(id), { title: habit.title, xp_gained: xpGained, points_bonus: userPointsBonus }, req);

    // Verificar misiones secretas
    try {
      const { checkSecretMissions } = require('./challengeController');
      await checkSecretMissions(userId);
    } catch {
      // Silent fail for secret missions
    }

    res.status(200).json({
      success: true,
      message: '¡Hábito completado!',
      data: {
        habit: habit.title,
        xp_gained: xpGained,
        points_bonus: userPointsBonus,
        new_total_xp: newTotalXp,
        new_level: newLevel,
        leveled_up: leveledUp,
        streak: streak,
        achievements: newAchievements,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
};