const pool = require('../config/database');

const findByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT id, email, name, total_xp, level, gender, points, daily_streak, is_premium, last_login, created_at, avatar_url, banner_id, is_admin, username, tag, google_id, totp_enabled
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const generateTag = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let tag = '';
  for (let i = 0; i < 5; i++) tag += chars[Math.floor(Math.random() * chars.length)];
  return tag;
};

const generateUsername = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
};

const create = async (userData) => {
  const { name, email, password_hash, gender } = userData;
  const username = generateUsername(name);
  const tag = generateTag();
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, total_xp, level, gender, points, daily_streak, username, tag)
     VALUES ($1, $2, $3, 0, 1, $4, 0, 0, $5, $6)
     RETURNING id, email, name, total_xp, level, gender, points, daily_streak, is_premium, created_at, username, tag`,
    [name, email, password_hash, gender || 'other', username, tag]
  );
  return result.rows[0];
};

const updateXpAndLevel = async (userId, newTotalXp, newLevel) => {
  await pool.query(
    'UPDATE users SET total_xp = $1, level = $2 WHERE id = $3',
    [newTotalXp, newLevel, userId]
  );
};

const updateStreakAndPoints = async (userId, streak, pointsToAdd) => {
  await pool.query(
    'UPDATE users SET daily_streak = $1, points = points + $2 WHERE id = $3',
    [streak, pointsToAdd, userId]
  );
};

const updateLastLogin = async (userId) => {
  await pool.query(
    'UPDATE users SET last_login = CURRENT_DATE WHERE id = $1',
    [userId]
  );
};

const getPointsAndStreak = async (userId) => {
  const result = await pool.query(
    'SELECT points, daily_streak, is_premium FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || { points: 0, daily_streak: 0, is_premium: false };
};

const getStats = async (userId) => {
  const result = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM habits WHERE user_id = $1 AND active = true) as habits_count,
      (SELECT COALESCE(MAX(streak), 0) FROM (
        SELECT COUNT(*) as streak FROM habit_logs
        WHERE user_id = $1
        GROUP BY DATE(completed_at)
        ORDER BY DATE(completed_at) DESC
        LIMIT 30
      ) as streaks) as max_streak
    `,
    [userId]
  );
  return result.rows[0] || { habits_count: 0, max_streak: 0 };
};

const updatePassword = async (userId, passwordHash) => {
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
};

const updateProfile = async (userId, data) => {
  const { name, email, gender } = data;
  const result = await pool.query(
    'UPDATE users SET name = $1, email = $2, gender = $3 WHERE id = $4 RETURNING id, name, email, gender',
    [name, email, gender, userId]
  );
  return result.rows[0];
};

const findByUsernameAndTag = async (username, tag) => {
  const result = await pool.query(
    'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND tag = $2',
    [username, tag]
  );
  return result.rows[0] || null;
};

module.exports = {
  findByEmail,
  findById,
  create,
  updateXpAndLevel,
  updateStreakAndPoints,
  updateLastLogin,
  getPointsAndStreak,
  getStats,
  updatePassword,
  updateProfile,
  findByUsernameAndTag,
};