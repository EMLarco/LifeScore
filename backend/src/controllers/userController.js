const pool = require('../config/database');

const upgradePremium = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const PREMIUM_COST = 500;

    const userResult = await pool.query('SELECT points FROM users WHERE id = $1', [userId]);
    const points = userResult.rows[0].points;

    if (points < PREMIUM_COST) {
      return res.status(400).json({ success: false, message: 'Puntos insuficientes' });
    }

    await pool.query('BEGIN');
    await pool.query(
      'UPDATE users SET is_premium = true, points = points - $1 WHERE id = $2',
      [PREMIUM_COST, userId]
    );
    await pool.query('COMMIT');

    res.status(200).json({ success: true, message: 'Usuario actualizado a premium' });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
};

module.exports = { upgradePremium };
