const pool = require('../config/database');

const findByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM habits WHERE user_id = $1 AND active = true ORDER BY position ASC',
    [userId]
  );
  return result.rows;
};

const findByIdAndUser = async (habitId, userId) => {
  const result = await pool.query(
    'SELECT * FROM habits WHERE id = $1 AND user_id = $2 AND active = true',
    [habitId, userId]
  );
  return result.rows[0] || null;
};

const create = async (habitData) => {
  const { user_id, title, icon, color } = habitData;

  // Obtener la posición máxima actual para poner este al final
  const maxPosResult = await pool.query(
    'SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM habits WHERE user_id = $1',
    [user_id]
  );
  const position = maxPosResult.rows[0].next_pos;

  const result = await pool.query(
    `INSERT INTO habits (user_id, title, icon, color, position, active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING *`,
    [user_id, title, icon || '📋', color || '#2ECC71', position]
  );
  return result.rows[0];
};

const update = async (habitId, userId, updates) => {
  const { title, icon, color, position } = updates;
  const result = await pool.query(
    `UPDATE habits
     SET title = COALESCE($1, title),
         icon = COALESCE($2, icon),
         color = COALESCE($3, color),
         position = COALESCE($4, position)
     WHERE id = $5 AND user_id = $6
     RETURNING *`,
    [title, icon, color, position, habitId, userId]
  );
  return result.rows[0] || null;
};

const deleteById = async (habitId, userId) => {
  const result = await pool.query(
    'UPDATE habits SET active = false WHERE id = $1 AND user_id = $2 RETURNING id',
    [habitId, userId]
  );
  return result.rows[0] || null;
};

module.exports = {
  findByUserId,
  findByIdAndUser,
  create,
  update,
  deleteById,
};