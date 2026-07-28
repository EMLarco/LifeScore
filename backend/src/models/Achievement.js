const pool = require('../config/database');

const findByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM achievements WHERE user_id = $1',
    [userId]
  );
  return result.rows;
};

const create = async (userId, achievementKey) => {
  const result = await pool.query(
    `INSERT INTO achievements (user_id, achievement_key, unlocked_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, achievement_key) DO NOTHING
     RETURNING *`,
    [userId, achievementKey]
  );
  return result.rows[0] || null;
};

const getUnlockedKeys = async (userId) => {
  const result = await pool.query(
    'SELECT achievement_key FROM achievements WHERE user_id = $1',
    [userId]
  );
  return result.rows.map(row => row.achievement_key);
};

module.exports = {
  findByUserId,
  create,
  getUnlockedKeys,
};