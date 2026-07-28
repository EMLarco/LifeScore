const pool = require('../config/database');
const User = require('../models/User');
const { hashPassword } = require('../utils/cryptoHelper');

const findOrCreateGoogleUser = async (googleUser) => {
  const { email, name, picture, googleId } = googleUser;

  let user = await User.findByEmail(email);
  if (user) {
    if (!user.google_id) {
      await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
    }
    if (picture && !user.avatar_url) {
      await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [picture, user.id]);
    }
    return await User.findById(user.id);
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let tag = '';
  for (let i = 0; i < 5; i++) tag += chars[Math.floor(Math.random() * chars.length)];
  const username = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
  const passwordHash = await hashPassword(Math.random().toString(36).slice(-8) + 'G!');

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, google_id, avatar_url, username, tag, total_xp, level, points, daily_streak)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 1, 0, 0)
     RETURNING id, email, name, username, tag, level, points, is_premium, is_admin, gender`,
    [name, email, passwordHash, googleId, picture, username, tag]
  );
  return result.rows[0];
};

module.exports = { findOrCreateGoogleUser };
