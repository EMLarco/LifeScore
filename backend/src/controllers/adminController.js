const pool = require('../config/database');

const getStats = async (req, res, next) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const totalHabits = await pool.query('SELECT COUNT(*) FROM habits WHERE active = true');
    const totalCompleted = await pool.query('SELECT COUNT(*) FROM habit_logs');
    const totalPremium = await pool.query('SELECT COUNT(*) FROM users WHERE is_premium = true');

    const dailyLogs = await pool.query(`
      SELECT DATE(completed_at) as date, COUNT(*) as count
      FROM habit_logs
      WHERE completed_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `);

    const topUsers = await pool.query(`
      SELECT u.name, u.email, u.total_xp, u.level, COUNT(hl.id) as completed_count
      FROM users u
      LEFT JOIN habit_logs hl ON u.id = hl.user_id
      GROUP BY u.id
      ORDER BY completed_count DESC
      LIMIT 5
    `);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        totalHabits: parseInt(totalHabits.rows[0].count),
        totalCompleted: parseInt(totalCompleted.rows[0].count),
        totalPremium: parseInt(totalPremium.rows[0].count),
        dailyLogs: dailyLogs.rows,
        topUsers: topUsers.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, total_xp, level, points, is_premium, is_admin, created_at
       FROM users ORDER BY id`
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, is_premium, is_admin, level, points } = req.body;

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        is_premium = COALESCE($3, is_premium),
        is_admin = COALESCE($4, is_admin),
        level = COALESCE($5, level),
        points = COALESCE($6, points)
       WHERE id = $7
       RETURNING id, name, email, is_premium, is_admin, level, points`,
      [name, email, is_premium, is_admin, level, points, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'No puedes eliminarte a ti mismo' });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const togglePremium = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE users SET is_premium = NOT is_premium WHERE id = $1 RETURNING id, is_premium',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const getAllHabits = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT h.*, u.name as user_name
       FROM habits h
       JOIN users u ON h.user_id = u.id
       WHERE h.active = true
       ORDER BY h.created_at DESC`
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const deleteHabitAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE habits SET active = false WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getRewardsAdmin = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM rewards ORDER BY id');
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const createReward = async (req, res, next) => {
  try {
    const { name, description, points_cost, icon, is_premium_reward } = req.body;
    const result = await pool.query(
      `INSERT INTO rewards (name, description, points_cost, icon, is_premium_reward)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, points_cost, icon, is_premium_reward || false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const updateReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, points_cost, icon, is_premium_reward, available } = req.body;
    const result = await pool.query(
      `UPDATE rewards SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        points_cost = COALESCE($3, points_cost),
        icon = COALESCE($4, icon),
        is_premium_reward = COALESCE($5, is_premium_reward),
        available = COALESCE($6, available)
       WHERE id = $7 RETURNING *`,
      [name, description, points_cost, icon, is_premium_reward, available, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recompensa no encontrada' });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const deleteReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM rewards WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getAchievementsAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as user_name
       FROM achievements a
       JOIN users u ON a.user_id = u.id
       ORDER BY a.unlocked_at DESC`
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const revoke2FA = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    await pool.query(
      'UPDATE users SET two_factor_enabled = false, totp_secret = NULL WHERE id = $1',
      [userId]
    );
    res.status(200).json({ success: true, message: '2FA revocado exitosamente' });
  } catch (error) { next(error); }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT hl.completed_at, u.name, u.username, h.title
       FROM habit_logs hl
       JOIN users u ON hl.user_id = u.id
       JOIN habits h ON hl.habit_id = h.id
       ORDER BY hl.completed_at DESC
       LIMIT 20`
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

const getAllUsersAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, email, username, tag, level, points, total_xp, daily_streak,
             is_premium, is_admin, two_factor_enabled, created_at
      FROM users
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      query += ` AND (name ILIKE $1 OR email ILIKE $1 OR username ILIKE $1 OR tag ILIKE $1)`;
      params.push(`%${search}%`);
    }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = `SELECT COUNT(*) FROM users WHERE 1=1`;
    const countParams = [];
    if (search) {
      countQuery += ` AND (name ILIKE $1 OR email ILIKE $1 OR username ILIKE $1 OR tag ILIKE $1)`;
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
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  togglePremium,
  getAllHabits,
  deleteHabitAdmin,
  getRewardsAdmin,
  createReward,
  updateReward,
  deleteReward,
  getAchievementsAdmin,
  revoke2FA,
  getRecentActivity,
  getAllUsersAdmin,
};
