const pool = require('../config/database');

const getSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const currentToken = req.token || null;

    const result = await pool.query(
      'SELECT id, device_info, ip_address, created_at, last_activity, token FROM sessions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const sessions = result.rows.map((session) => ({
      id: session.id,
      device_info: session.device_info,
      ip_address: session.ip_address,
      created_at: session.created_at,
      last_activity: session.last_activity,
      is_current: currentToken && session.token === currentToken,
    }));

    res.status(200).json({ success: true, data: sessions });
  } catch (error) { next(error); }
};

const revokeSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    await pool.query('DELETE FROM sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    res.status(200).json({ success: true, message: 'Sesion cerrada' });
  } catch (error) { next(error); }
};

const revokeAllSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    res.status(200).json({ success: true, message: 'Todas las sesiones cerradas' });
  } catch (error) { next(error); }
};

module.exports = { getSessions, revokeSession, revokeAllSessions };
