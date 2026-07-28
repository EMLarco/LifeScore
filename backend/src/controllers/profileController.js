const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato no permitido. Usa JPG, PNG, GIF o WEBP.'));
    }
  },
});

const uploadAvatar = (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

const updateAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se subio ningun archivo' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, userId]);

    res.status(200).json({
      success: true,
      message: 'Avatar actualizado',
      data: { avatar_url: avatarUrl },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { avatar_url, banner_id, name, email, gender } = req.body;
    const userId = req.user.id;

    await pool.query(
      `UPDATE users SET
        avatar_url = COALESCE($1, avatar_url),
        banner_id = COALESCE($2, banner_id),
        name = COALESCE($3, name),
        email = COALESCE($4, email),
        gender = COALESCE($5, gender)
       WHERE id = $6`,
      [avatar_url, banner_id, name, email, gender, userId]
    );

    const updated = await pool.query(
      `SELECT id, email, name, total_xp, level, gender, points, daily_streak, is_premium, last_login, created_at, avatar_url, banner_id
       FROM users WHERE id = $1`,
      [userId]
    );
    res.status(200).json({ success: true, user: updated.rows[0] });
  } catch (error) {
    next(error);
  }
};

const getBanners = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM banners WHERE available = true ORDER BY points_cost ASC'
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const purchaseBanner = async (req, res, next) => {
  try {
    const { bannerId } = req.params;
    const userId = req.user.id;

    const userResult = await pool.query('SELECT points FROM users WHERE id = $1', [userId]);
    const userPoints = userResult.rows[0].points;

    const bannerResult = await pool.query(
      'SELECT * FROM banners WHERE id = $1 AND available = true',
      [bannerId]
    );
    if (bannerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Banner no disponible' });
    }
    const banner = bannerResult.rows[0];

    if (userPoints < banner.points_cost) {
      return res.status(400).json({ success: false, message: 'Puntos insuficientes' });
    }

    const alreadyOwned = await pool.query(
      'SELECT id FROM user_banners WHERE user_id = $1 AND banner_id = $2',
      [userId, bannerId]
    );
    if (alreadyOwned.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya posees este banner' });
    }

    await pool.query('BEGIN');
    await pool.query('UPDATE users SET points = points - $1 WHERE id = $2', [banner.points_cost, userId]);
    await pool.query('UPDATE users SET banner_id = $1 WHERE id = $2', [bannerId, userId]);
    await pool.query(
      'INSERT INTO user_banners (user_id, banner_id) VALUES ($1, $2)',
      [userId, bannerId]
    );
    await pool.query('COMMIT');

    res.status(200).json({ success: true, message: 'Banner adquirido' });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
};

const updateUsernameAndTag = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, tag } = req.body;

    if (!username || !tag) {
      return res.status(400).json({ success: false, message: 'Username y tag son requeridos' });
    }

    if (tag.length > 5) {
      return res.status(400).json({ success: false, message: 'El tag debe tener maximo 5 caracteres' });
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE (username = $1 OR tag = $2) AND id != $3',
      [username, tag, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username o tag ya estan en uso' });
    }

    const result = await pool.query(
      'UPDATE users SET username = $1, tag = $2 WHERE id = $3 RETURNING username, tag',
      [username, tag, userId]
    );
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

const exportUserData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userResult = await pool.query(
      'SELECT name, email, username, tag, level, points, total_xp, created_at FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    const habitsResult = await pool.query(
      'SELECT id, title, icon, color, created_at FROM habits WHERE user_id = $1 AND active = true',
      [userId]
    );
    const habits = habitsResult.rows;

    const logsResult = await pool.query(
      'SELECT id, habit_id, completed_at FROM habit_logs WHERE user_id = $1 ORDER BY completed_at DESC',
      [userId]
    );
    const logs = logsResult.rows;

    let csv = '=== DATOS DE LifeScore ===\n\n';
    csv += `Usuario: ${user.name}\n`;
    csv += `Email: ${user.email}\n`;
    csv += `Username: ${user.username}\n`;
    csv += `Tag: #${user.tag}\n`;
    csv += `Nivel: ${user.level}\n`;
    csv += `Puntos: ${user.points}\n`;
    csv += `XP Total: ${user.total_xp}\n`;
    csv += `Miembro desde: ${user.created_at}\n\n`;

    csv += '=== HABITOS ===\n';
    csv += 'ID,Titulo,Icono,Color,Creado\n';
    habits.forEach((h) => {
      csv += `${h.id},"${h.title}",${h.icon},${h.color},${h.created_at}\n`;
    });

    csv += '\n=== REGISTROS DE HABITOS ===\n';
    csv += 'ID,Habito ID,Fecha completado\n';
    logs.forEach((l) => {
      csv += `${l.id},${l.habit_id},${l.completed_at}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=LifeScore_Data_${user.username || 'user'}.csv`);
    res.status(200).send(csv);
  } catch (error) { next(error); }
};

const updateSlackWebhook = async (req, res, next) => {
  try {
    const { slack_webhook } = req.body;
    await pool.query('UPDATE users SET slack_webhook = $1 WHERE id = $2', [slack_webhook || null, req.user.id]);
    res.status(200).json({ success: true, message: 'Webhook de Slack actualizado' });
  } catch (error) { next(error); }
};

module.exports = { updateProfile, getBanners, purchaseBanner, updateUsernameAndTag, exportUserData, updateSlackWebhook, uploadAvatar, updateAvatar };
