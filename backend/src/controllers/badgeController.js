const pool = require('../config/database');

const getUserBadges = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT b.*, ub.unlocked_at
       FROM badges b
       JOIN user_badges ub ON b.key = ub.badge_key
       WHERE ub.user_id = $1
       ORDER BY ub.unlocked_at DESC`,
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserBadges };
