const pool = require('../config/database');

const getGlobalRanking = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const result = await pool.query(`
      SELECT id, name, username, tag, level, points, total_xp
      FROM users
      ORDER BY points DESC
      LIMIT $1
    `, [limit]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

const getFriendsRanking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const result = await pool.query(`
      SELECT u.id, u.name, u.username, u.tag, u.level, u.points, u.total_xp
      FROM users u
      JOIN friends f ON (f.user_id = u.id OR f.friend_id = u.id)
      WHERE (f.user_id = $1 OR f.friend_id = $1)
        AND f.status = 'accepted'
        AND u.id != $1
      ORDER BY u.points DESC
      LIMIT $2
    `, [userId, limit]);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

module.exports = { getGlobalRanking, getFriendsRanking };
