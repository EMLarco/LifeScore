const pool = require('../config/database');

const getItems = async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM store_items WHERE available = true';
    const params = [];
    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }
    query += ' ORDER BY points_cost ASC';
    const result = await pool.query(query, params);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const getItemById = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const result = await pool.query(
      'SELECT * FROM store_items WHERE id = $1 AND available = true',
      [itemId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item no encontrado' });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const purchaseItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const userResult = await pool.query('SELECT points FROM users WHERE id = $1', [userId]);
    const userPoints = userResult.rows[0].points;

    const itemResult = await pool.query(
      'SELECT * FROM store_items WHERE id = $1 AND available = true',
      [itemId]
    );
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item no disponible' });
    }
    const item = itemResult.rows[0];

    if (userPoints < item.points_cost) {
      return res.status(400).json({ success: false, message: 'Puntos insuficientes' });
    }

    const alreadyOwned = await pool.query(
      'SELECT id FROM user_items WHERE user_id = $1 AND item_id = $2',
      [userId, itemId]
    );
    if (alreadyOwned.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya posees este item' });
    }

    await pool.query('BEGIN');
    await pool.query('UPDATE users SET points = points - $1 WHERE id = $2', [item.points_cost, userId]);
    await pool.query(
      'INSERT INTO user_items (user_id, item_id, purchased_at) VALUES ($1, $2, NOW())',
      [userId, itemId]
    );
    if (item.category === 'banner') {
      await pool.query('UPDATE users SET banner_id = $1 WHERE id = $2', [itemId, userId]);
    }
    if (item.category === 'avatar') {
      await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [item.image_url, userId]);
    }
    await pool.query('COMMIT');

    res.status(200).json({ success: true, message: 'Item adquirido' });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
};

const getMyItems = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT si.*, ui.purchased_at
       FROM user_items ui
       JOIN store_items si ON ui.item_id = si.id
       WHERE ui.user_id = $1
       ORDER BY ui.purchased_at DESC`,
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

module.exports = { getItems, getItemById, purchaseItem, getMyItems };
