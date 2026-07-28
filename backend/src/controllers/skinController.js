const pool = require('../config/database');
const { auditLog } = require('../services/auditService');

const getSkins = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const allSkins = await pool.query('SELECT * FROM skins ORDER BY points_cost');
    const userSkins = await pool.query(
      'SELECT skin_id, equipped FROM user_skins WHERE user_id = $1',
      [userId]
    );
    const userSkinMap = {};
    userSkins.rows.forEach((row) => {
      userSkinMap[row.skin_id] = row.equipped;
    });

    const result = allSkins.rows.map((skin) => ({
      ...skin,
      owned: userSkinMap[skin.id] !== undefined,
      equipped: userSkinMap[skin.id] === true,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

const buySkin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skinId } = req.params;

    const skinResult = await pool.query('SELECT * FROM skins WHERE id = $1', [skinId]);
    if (skinResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Skin no encontrada' });
    }
    const skin = skinResult.rows[0];

    const userResult = await pool.query('SELECT points FROM users WHERE id = $1', [userId]);
    const points = userResult.rows[0].points;

    if (points < skin.points_cost) {
      return res.status(400).json({ success: false, message: 'Puntos insuficientes' });
    }

    const existing = await pool.query(
      'SELECT * FROM user_skins WHERE user_id = $1 AND skin_id = $2',
      [userId, skinId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya tienes esta skin' });
    }

    await pool.query('BEGIN');
    await pool.query('UPDATE users SET points = points - $1 WHERE id = $2', [skin.points_cost, userId]);
    await pool.query(
      'INSERT INTO user_skins (user_id, skin_id, equipped) VALUES ($1, $2, true)',
      [userId, skinId]
    );
    await pool.query('COMMIT');

    await auditLog(userId, 'SKIN_PURCHASE', 'skin', parseInt(skinId), { name: skin.name, cost: skin.points_cost }, req);

    res.status(201).json({ success: true, message: 'Skin comprada y equipada' });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
};

const equipSkin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skinId } = req.params;

    const userSkin = await pool.query(
      'SELECT * FROM user_skins WHERE user_id = $1 AND skin_id = $2',
      [userId, skinId]
    );
    if (userSkin.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No posees esta skin' });
    }

    await pool.query('UPDATE user_skins SET equipped = false WHERE user_id = $1', [userId]);
    await pool.query(
      'UPDATE user_skins SET equipped = true WHERE user_id = $1 AND skin_id = $2',
      [userId, skinId]
    );

    res.status(200).json({ success: true, message: 'Skin equipada' });
  } catch (error) { next(error); }
};

module.exports = { getSkins, buySkin, equipSkin };
