const User = require('../models/User');
const HabitLog = require('../models/HabitLog');
const Achievement = require('../models/Achievement');
const { ACHIEVEMENTS } = require('../services/gamificationLogic');

const getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const stats = await User.getStats(userId);
    const globalStreak = await HabitLog.getGlobalStreak(userId);
    const achievements = await Achievement.findByUserId(userId);

    // Logros con información completa
    const achievementDetails = ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: achievements.some(ach => ach.achievement_key === a.key),
      unlocked_at: achievements.find(ach => ach.achievement_key === a.key)?.unlocked_at || null,
    }));

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user,
          habits_count: parseInt(stats.habits_count) || 0,
          max_streak: parseInt(stats.max_streak) || 0,
          global_streak: globalStreak,
        },
        achievements: achievementDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
};