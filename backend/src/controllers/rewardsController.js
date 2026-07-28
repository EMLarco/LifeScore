const pool = require('../config/database');

const getAvailableRewards = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM rewards WHERE available = true ORDER BY points_cost ASC');
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getUserRewards = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT r.*, ur.redeemed_at
       FROM user_rewards ur
       JOIN rewards r ON ur.reward_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const redeemReward = async (req, res, next) => {
  try {
    const { rewardId } = req.params;
    const userId = req.user.id;

    const rewardResult = await pool.query('SELECT * FROM rewards WHERE id = $1 AND available = true', [rewardId]);
    if (rewardResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recompensa no disponible' });
    }
    const reward = rewardResult.rows[0];

    const userResult = await pool.query('SELECT points, is_premium FROM users WHERE id = $1', [userId]);
    const userPoints = userResult.rows[0]?.points || 0;
    const isPremium = userResult.rows[0]?.is_premium || false;

    if (userPoints < reward.points_cost) {
      return res.status(400).json({ success: false, message: 'Puntos insuficientes' });
    }

    if (reward.is_premium_reward && !isPremium) {
      return res.status(403).json({ success: false, message: 'Se requiere membresia premium' });
    }

    await pool.query('BEGIN');
    await pool.query('UPDATE users SET points = points - $1 WHERE id = $2', [reward.points_cost, userId]);
    await pool.query(
      'INSERT INTO user_rewards (user_id, reward_id) VALUES ($1, $2)',
      [userId, rewardId]
    );
    await pool.query('COMMIT');

    res.status(200).json({ success: true, message: 'Recompensa canjeada exitosamente' });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
};

module.exports = { getAvailableRewards, getUserRewards, redeemReward };
