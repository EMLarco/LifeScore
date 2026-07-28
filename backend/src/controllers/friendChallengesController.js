const pool = require('../config/database');
const dayjs = require('dayjs');

const getActiveChallenges = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT fc.*,
        c.name as challenger_name, c.username as challenger_username, c.tag as challenger_tag, c.avatar_url as challenger_avatar,
        d.name as challenged_name, d.username as challenged_username, d.tag as challenged_tag, d.avatar_url as challenged_avatar
       FROM friend_challenges fc
       JOIN users c ON fc.challenger_id = c.id
       JOIN users d ON fc.challenged_id = d.id
       WHERE (fc.challenger_id = $1 OR fc.challenged_id = $1)
       AND fc.status IN ('pending', 'accepted')
       AND fc.expires_at > NOW()
       ORDER BY fc.created_at DESC`,
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const createChallenge = async (req, res, next) => {
  try {
    const { challenged_id, title, description, points_wagered, challenge_id } = req.body;
    const userId = req.user.id;

    if (userId === challenged_id) {
      return res.status(400).json({ success: false, message: 'No puedes retarte a ti mismo' });
    }

    const friendship = await pool.query(
      `SELECT id FROM friends
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
       AND status = 'accepted'`,
      [userId, challenged_id]
    );

    if (friendship.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Solo puedes retar a tus amigos' });
    }

    const userPoints = await pool.query('SELECT points FROM users WHERE id = $1', [userId]);
    if (userPoints.rows[0].points < (points_wagered || 50)) {
      return res.status(400).json({ success: false, message: 'No tienes suficientes puntos' });
    }

    const expiresAt = dayjs().add(24, 'hour').toISOString();

    const result = await pool.query(
      `INSERT INTO friend_challenges (challenger_id, challenged_id, challenge_id, title, description, points_wagered, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING *`,
      [userId, challenged_id, challenge_id || null, title, description || '', points_wagered || 50, expiresAt]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const acceptChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const challenge = await pool.query(
      'SELECT * FROM friend_challenges WHERE id = $1 AND challenged_id = $2 AND status = $3',
      [id, userId, 'pending']
    );

    if (challenge.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Desafio no encontrado' });
    }

    if (dayjs(challenge.rows[0].expires_at).isBefore(dayjs())) {
      return res.status(400).json({ success: false, message: 'El desafio ha expirado' });
    }

    await pool.query('UPDATE friend_challenges SET status = $1 WHERE id = $2', ['accepted', id]);
    res.status(200).json({ success: true, message: 'Desafio aceptado' });
  } catch (error) {
    next(error);
  }
};

const completeChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const challenge = await pool.query(
      'SELECT * FROM friend_challenges WHERE id = $1 AND (challenger_id = $2 OR challenged_id = $2) AND status = $3',
      [id, userId, 'accepted']
    );

    if (challenge.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Desafio no encontrado o no aceptado' });
    }

    const fc = challenge.rows[0];
    const isChallenger = fc.challenger_id === userId;

    await pool.query(
      `UPDATE friend_challenges
       SET ${isChallenger ? 'challenger_completed' : 'challenged_completed'} = TRUE
       WHERE id = $1`,
      [id]
    );

    const updated = await pool.query('SELECT * FROM friend_challenges WHERE id = $1', [id]);
    const updatedFc = updated.rows[0];

    if (updatedFc.challenger_completed && updatedFc.challenged_completed) {
      const winnerId = updatedFc.challenger_id;
      await pool.query('BEGIN');
      await pool.query(
        'UPDATE friend_challenges SET status = $1, winner_id = $2, completed_at = NOW() WHERE id = $3',
        ['completed', winnerId, id]
      );
      await pool.query('UPDATE users SET points = points + $1 WHERE id = $2', [updatedFc.points_wagered * 2, winnerId]);
      await pool.query(
        'UPDATE users SET points = GREATEST(points - $1, 0) WHERE id = $2',
        [updatedFc.points_wagered, updatedFc.challenged_id === winnerId ? updatedFc.challenger_id : updatedFc.challenged_id]
      );
      await pool.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Ambos completaron. Ganador: ' + winnerId,
        data: { winner_id: winnerId, both_completed: true },
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Completado. Esperando al oponente',
        data: { both_completed: false },
      });
    }
  } catch (error) {
    await pool.query('ROLLBACK').catch(() => {});
    next(error);
  }
};

module.exports = { getActiveChallenges, createChallenge, acceptChallenge, completeChallenge };
