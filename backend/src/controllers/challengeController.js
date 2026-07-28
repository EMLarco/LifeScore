const pool = require('../config/database');
const dayjs = require('dayjs');
const weekOfYear = require('dayjs/plugin/weekOfYear');
dayjs.extend(weekOfYear);
const { auditLog } = require('../services/auditService');

const getPeriodStart = (type) => {
  const now = dayjs();
  if (type === 'daily') return now.startOf('day').format('YYYY-MM-DD');
  if (type === 'weekly') return now.startOf('week').format('YYYY-MM-DD');
  if (type === 'monthly') return now.startOf('month').format('YYYY-MM-DD');
  return now.startOf('day').format('YYYY-MM-DD');
};

const getDaysRemaining = (type) => {
  const now = dayjs();
  if (type === 'daily') return 1;
  if (type === 'weekly') return 7 - now.diff(now.startOf('week'), 'day');
  if (type === 'monthly') return now.daysInMonth() - now.date() + 1;
  return 1;
};

const getChallenges = async (req, res, next) => {
  try {
    const { type } = req.query;
    const userId = req.user.id;

    if (!type || !['daily', 'weekly', 'monthly'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Tipo de reto invalido' });
    }

    const periodStart = getPeriodStart(type);

    const challengesResult = await pool.query(
      'SELECT * FROM challenges WHERE type = $1 AND is_active = true ORDER BY difficulty, points_reward ASC',
      [type]
    );

    const completedResult = await pool.query(
      'SELECT challenge_id FROM user_challenges WHERE user_id = $1 AND period_start = $2',
      [userId, periodStart]
    );
    const completedIds = completedResult.rows.map((row) => row.challenge_id);

    const challenges = challengesResult.rows.map((challenge) => ({
      ...challenge,
      completed: completedIds.includes(challenge.id),
      period_start: periodStart,
      days_remaining: getDaysRemaining(type),
    }));

    res.status(200).json({ success: true, data: challenges });
  } catch (error) {
    next(error);
  }
};

const completeChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const challengeResult = await pool.query(
      'SELECT * FROM challenges WHERE id = $1 AND is_active = true',
      [id]
    );
    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reto no encontrado' });
    }
    const challenge = challengeResult.rows[0];
    const periodStart = getPeriodStart(challenge.type);

    const existing = await pool.query(
      'SELECT * FROM user_challenges WHERE user_id = $1 AND challenge_id = $2 AND period_start = $3',
      [userId, id, periodStart]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya completaste este reto en este periodo' });
    }

    await pool.query('BEGIN');

    await pool.query(
      'INSERT INTO user_challenges (user_id, challenge_id, period_start) VALUES ($1, $2, $3)',
      [userId, id, periodStart]
    );

    const updatedUser = await pool.query(
      'UPDATE users SET points = points + $1 WHERE id = $2 RETURNING points',
      [challenge.points_reward, userId]
    );

    let badgeUnlocked = null;
    if (challenge.badge_key) {
      const badgeResult = await pool.query(
        `INSERT INTO user_badges (user_id, badge_key, unlocked_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id, badge_key) DO NOTHING
         RETURNING *`,
        [userId, challenge.badge_key]
      );
      if (badgeResult.rows.length > 0) {
        badgeUnlocked = challenge.badge_key;
      }
    }

    await pool.query('COMMIT');

    await auditLog(userId, 'CHALLENGE_COMPLETE', 'challenge', parseInt(id), { title: challenge.title, points_reward: challenge.points_reward, badge_key: badgeUnlocked }, req);

    res.status(200).json({
      success: true,
      message: 'Reto completado',
      data: {
        points_reward: challenge.points_reward,
        new_points: updatedUser.rows[0].points,
        badge_unlocked: badgeUnlocked,
      },
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
};

const getChallengeStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM user_challenges WHERE user_id = $1',
      [userId]
    );

    const byTypeResult = await pool.query(
      `SELECT c.type, COUNT(uc.id) as count
       FROM user_challenges uc
       JOIN challenges c ON uc.challenge_id = c.id
       WHERE uc.user_id = $1
       GROUP BY c.type`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        total: parseInt(totalResult.rows[0]?.total) || 0,
        by_type: byTypeResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

const checkSecretMissions = async (userId) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const hour = today.getHours();

    if (dayOfWeek === 0) {
      const count = await pool.query(
        'SELECT COUNT(*) as count FROM habit_logs WHERE user_id = $1 AND DATE(completed_at) = CURRENT_DATE',
        [userId]
      );
      if (parseInt(count.rows[0].count) >= 5) {
        await pool.query(
          'INSERT INTO achievements (user_id, achievement_key) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, 'SUNDAY_FIVE']
        );
      }
    }

    if (hour >= 5 && hour < 6) {
      await pool.query(
        'INSERT INTO achievements (user_id, achievement_key) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, 'EARLY_BIRD_EXTREME']
      );
    }

    const streak = await pool.query(
      'SELECT daily_streak FROM users WHERE id = $1',
      [userId]
    );
    if (streak.rows[0]?.daily_streak >= 10) {
      await pool.query(
        'INSERT INTO achievements (user_id, achievement_key) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, 'STREAK_10']
      );
    }
  } catch {
    // Secret missions should not crash the main flow
  }
};

module.exports = { getChallenges, completeChallenge, getChallengeStats, checkSecretMissions };
