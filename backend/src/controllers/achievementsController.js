const pool = require('../config/database');

const getAchievements = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 36));
    const offset = (page - 1) * limit;

    const unlockedResult = await pool.query(
      'SELECT achievement_day, unlocked_at FROM user_daily_achievements WHERE user_id = $1',
      [userId]
    );
    const unlockedMap = {};
    unlockedResult.rows.forEach((r) => {
      unlockedMap[r.achievement_day] = r.unlocked_at;
    });

    const streakResult = await pool.query('SELECT daily_streak FROM users WHERE id = $1', [userId]);
    const currentStreak = parseInt(streakResult.rows[0]?.daily_streak) || 0;

    let newlyUnlocked = [];
    for (let day = 1; day <= Math.min(currentStreak, 365); day++) {
      if (!unlockedMap[day]) {
        await pool.query(
          `INSERT INTO user_daily_achievements (user_id, achievement_day)
           VALUES ($1, $2) ON CONFLICT (user_id, achievement_day) DO NOTHING`,
          [userId, day]
        );
        newlyUnlocked.push(day);
        unlockedMap[day] = new Date();
      }
    }

    const dbResult = await pool.query('SELECT * FROM daily_achievements ORDER BY day_of_year');
    const allFromDb = new Map(dbResult.rows.map((a) => [a.day_of_year, a]));

    const allAchievements = [];
    for (let day = 1; day <= 365; day++) {
      const dbAch = allFromDb.get(day);
      allAchievements.push({
        day_of_year: day,
        name: dbAch?.name || `Dia ${day}`,
        description: dbAch?.description || `Logro del dia ${day}`,
        icon: dbAch?.icon || 'IconCheck',
        color: dbAch?.color || '#7C3AED',
        unlocked: !!unlockedMap[day],
        unlocked_at: unlockedMap[day] || null,
      });
    }

    const total = allAchievements.length;
    const paginated = allAchievements.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      data: {
        achievements: paginated,
        total,
        unlocked_count: unlockedResult.rows.length + newlyUnlocked.length,
        current_streak: currentStreak,
        newly_unlocked: newlyUnlocked,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAchievements };
