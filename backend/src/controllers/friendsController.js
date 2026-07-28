const pool = require('../config/database');

const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Minimo 2 caracteres' });
    }

    const result = await pool.query(
      `SELECT id, name, username, tag, level, avatar_url, is_premium
       FROM users
       WHERE (LOWER(username) LIKE LOWER($1) OR LOWER(tag) LIKE LOWER($2))
       AND id != $3
       LIMIT 20`,
      [`%${q}%`, `%${q}%`, userId]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const sendFriendRequest = async (req, res, next) => {
  try {
    const { friend_id } = req.body;
    const userId = req.user.id;

    if (userId === friend_id) {
      return res.status(400).json({ success: false, message: 'No puedes agregarte a ti mismo' });
    }

    const friendExists = await pool.query('SELECT id FROM users WHERE id = $1', [friend_id]);
    if (friendExists.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const existing = await pool.query(
      `SELECT id, status FROM friends
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, friend_id]
    );

    if (existing.rows.length > 0) {
      const status = existing.rows[0].status;
      if (status === 'accepted') {
        return res.status(400).json({ success: false, message: 'Ya son amigos' });
      }
      if (status === 'pending') {
        return res.status(400).json({ success: false, message: 'Solicitud ya enviada' });
      }
    }

    await pool.query(
      'INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, $3)',
      [userId, friend_id, 'pending']
    );

    res.status(201).json({ success: true, message: 'Solicitud enviada' });
  } catch (error) {
    next(error);
  }
};

const getPendingRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT f.id, f.created_at, u.id as user_id, u.name, u.username, u.tag, u.level, u.avatar_url
       FROM friends f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_id = $1 AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getFriends = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT u.id, u.name, u.username, u.tag, u.level, u.avatar_url, u.is_premium, f.created_at as friends_since
       FROM friends f
       JOIN users u ON (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END) = u.id
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const acceptFriendRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const request = await pool.query(
      'SELECT * FROM friends WHERE id = $1 AND friend_id = $2 AND status = $3',
      [id, userId, 'pending']
    );

    if (request.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }

    await pool.query('UPDATE friends SET status = $1 WHERE id = $2', ['accepted', id]);
    res.status(200).json({ success: true, message: 'Solicitud aceptada' });
  } catch (error) {
    next(error);
  }
};

const rejectFriendRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const request = await pool.query(
      'SELECT * FROM friends WHERE id = $1 AND friend_id = $2 AND status = $3',
      [id, userId, 'pending']
    );

    if (request.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }

    await pool.query('DELETE FROM friends WHERE id = $1', [id]);
    res.status(200).json({ success: true, message: 'Solicitud rechazada' });
  } catch (error) {
    next(error);
  }
};

const removeFriend = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM friends WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)) AND status = $3',
      [userId, id, 'accepted']
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Amigo no encontrado' });
    }

    res.status(200).json({ success: true, message: 'Amigo eliminado' });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, username, tag, level, points
      FROM users
      WHERE id != $1
    `;
    const params = [userId];
    if (search) {
      query += ` AND (name ILIKE $2 OR username ILIKE $2 OR tag ILIKE $2)`;
      params.push(`%${search}%`);
    }
    query += ` ORDER BY name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = `SELECT COUNT(*) FROM users WHERE id != $1`;
    const countParams = [userId];
    if (search) {
      countQuery += ` AND (name ILIKE $2 OR username ILIKE $2 OR tag ILIKE $2)`;
      countParams.push(`%${search}%`);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) { next(error); }
};

module.exports = {
  searchUsers,
  sendFriendRequest,
  getPendingRequests,
  getFriends,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getAllUsers,
};
