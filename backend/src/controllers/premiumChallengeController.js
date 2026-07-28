const pool = require('../config/database');

const getPremiumChallenges = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const challenges = await pool.query(
      'SELECT * FROM premium_challenges WHERE is_active = true ORDER BY required_level ASC'
    );

    const completed = await pool.query(
      'SELECT challenge_id FROM user_premium_challenges WHERE user_id = $1',
      [userId]
    );

    const completedIds = new Set(completed.rows.map((r) => r.challenge_id));

    const data = challenges.rows.map((c) => ({
      ...c,
      is_completed: completedIds.has(c.id),
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const completePremiumChallenge = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { challengeId } = req.params;

    const challenge = await pool.query(
      'SELECT * FROM premium_challenges WHERE id = $1 AND is_active = true',
      [challengeId]
    );

    if (challenge.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reto premium no encontrado' });
    }

    const alreadyCompleted = await pool.query(
      'SELECT id FROM user_premium_challenges WHERE user_id = $1 AND challenge_id = $2',
      [userId, challengeId]
    );

    if (alreadyCompleted.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya completaste este reto' });
    }

    const ch = challenge.rows[0];

    const userLevel = await pool.query(
      'SELECT level FROM users WHERE id = $1',
      [userId]
    );

    if (userLevel.rows.length === 0 || userLevel.rows[0].level < ch.required_level) {
      return res.status(403).json({
        success: false,
        message: `Nivel requerido: ${ch.required_level}. Tu nivel actual no es suficiente.`,
      });
    }

    await pool.query(
      'INSERT INTO user_premium_challenges (user_id, challenge_id) VALUES ($1, $2)',
      [userId, challengeId]
    );

    await pool.query(
      'UPDATE users SET xp = xp + $1 WHERE id = $2',
      [ch.xp_reward, userId]
    );

    if (ch.badge_key) {
      await pool.query(
        `INSERT INTO achievements (user_id, badge_key, unlocked_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT DO NOTHING`,
        [userId, ch.badge_key]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Reto completado',
      data: { xp: ch.xp_reward, badge: ch.badge_key },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPremiumChallenges, completePremiumChallenge };
