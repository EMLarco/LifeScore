const pool = require('../config/database');

const saveSubscription = async (userId, endpoint, keys) => {
  const result = await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, keys, created_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (endpoint)
     DO UPDATE SET user_id = $1, keys = $3, created_at = NOW()
     RETURNING *`,
    [userId, endpoint, keys]
  );
  return result.rows[0];
};

const getByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM push_subscriptions WHERE user_id = $1',
    [userId]
  );
  return result.rows;
};

const deleteByEndpoint = async (endpoint) => {
  await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
};

module.exports = {
  saveSubscription,
  getByUserId,
  deleteByEndpoint,
};