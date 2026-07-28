const pool = require('../config/database');
const { auditLog } = require('../services/auditService');

const POINTS_TO_USD_RATE = 0.0015;
const MIN_WITHDRAWAL_POINTS = 5000;
const MAX_WITHDRAWAL_POINTS = 100000;
const PLATFORM_FEE = 0.10;

const getWithdrawals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

const requestWithdrawal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { points } = req.body;

    if (!points || points < MIN_WITHDRAWAL_POINTS) {
      return res.status(400).json({
        success: false,
        message: `Minimo de retiro: ${MIN_WITHDRAWAL_POINTS} puntos ($${(MIN_WITHDRAWAL_POINTS * POINTS_TO_USD_RATE).toFixed(2)})`,
      });
    }

    if (points > MAX_WITHDRAWAL_POINTS) {
      return res.status(400).json({
        success: false,
        message: `Maximo por solicitud: ${MAX_WITHDRAWAL_POINTS} puntos ($${(MAX_WITHDRAWAL_POINTS * POINTS_TO_USD_RATE).toFixed(2)})`,
      });
    }

    if (points % 1000 !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Los puntos deben ser multiplos de 1000',
      });
    }

    const userResult = await pool.query('SELECT points FROM users WHERE id = $1', [userId]);
    const userPoints = userResult.rows[0]?.points || 0;
    if (userPoints < points) {
      return res.status(400).json({ success: false, message: 'No tienes suficientes puntos' });
    }

    const grossAmount = points * POINTS_TO_USD_RATE;
    const fee = grossAmount * PLATFORM_FEE;
    const netAmount = grossAmount - fee;

    await pool.query(
      `INSERT INTO withdrawals (user_id, points, amount_usd, status)
       VALUES ($1, $2, $3, 'pending')`,
      [userId, points, netAmount]
    );

    const insertResult = await pool.query('SELECT id FROM withdrawals WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userId]);
    await auditLog(userId, 'WITHDRAWAL_REQUEST', 'withdrawal', insertResult.rows[0]?.id, { points, net_amount: netAmount }, req);

    res.status(201).json({
      success: true,
      message: 'Solicitud de retiro enviada. Espera la aprobacion del administrador.',
      data: {
        points,
        gross_amount: grossAmount,
        fee,
        net_amount: netAmount,
      },
    });
  } catch (error) { next(error); }
};

const getAllWithdrawals = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT w.*, u.name, u.email, u.username
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
    `;
    const params = [];
    if (status && status !== 'all') {
      query += ' WHERE w.status = $1';
      params.push(status);
    }
    query += ' ORDER BY w.created_at DESC';
    const result = await pool.query(query, params);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

const approveWithdrawal = async (req, res, next) => {
  try {
    const { withdrawalId } = req.params;

    const wResult = await pool.query(
      'SELECT * FROM withdrawals WHERE id = $1 AND status = $2',
      [withdrawalId, 'pending']
    );
    if (wResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada o ya procesada' });
    }
    const withdrawal = wResult.rows[0];

    const userResult = await pool.query('SELECT points FROM users WHERE id = $1', [withdrawal.user_id]);
    if ((userResult.rows[0]?.points || 0) < withdrawal.points) {
      return res.status(400).json({ success: false, message: 'El usuario ya no tiene suficientes puntos' });
    }

    await pool.query('BEGIN');
    await pool.query(
      'UPDATE users SET points = points - $1 WHERE id = $2',
      [withdrawal.points, withdrawal.user_id]
    );
    await pool.query(
      'UPDATE withdrawals SET status = $1, updated_at = NOW() WHERE id = $2',
      ['approved', withdrawalId]
    );
    await pool.query('COMMIT');

    await auditLog(withdrawal.user_id, 'WITHDRAWAL_APPROVE', 'withdrawal', parseInt(withdrawalId), { points: withdrawal.points, amount_usd: withdrawal.amount_usd }, req);

    res.status(200).json({ success: true, message: 'Retiro aprobado. Se descontaron los puntos.' });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
};

const markAsPaid = async (req, res, next) => {
  try {
    const { withdrawalId } = req.params;
    const { transactionId } = req.body;

    await pool.query(
      `UPDATE withdrawals SET status = 'paid', notes = $1, updated_at = NOW() WHERE id = $2 AND status = 'approved'`,
      [transactionId ? `Transaccion: ${transactionId}` : null, withdrawalId]
    );
    res.status(200).json({ success: true, message: 'Retiro marcado como pagado' });
  } catch (error) { next(error); }
};

const rejectWithdrawal = async (req, res, next) => {
  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;

    await pool.query(
      `UPDATE withdrawals SET status = 'rejected', notes = $1, updated_at = NOW() WHERE id = $2 AND status = 'pending'`,
      [reason || 'Rechazado por el administrador', withdrawalId]
    );
    await auditLog(req.user.id, 'WITHDRAWAL_REJECT', 'withdrawal', parseInt(withdrawalId), { reason }, req);
    res.status(200).json({ success: true, message: 'Retiro rechazado' });
  } catch (error) { next(error); }
};

module.exports = {
  getWithdrawals,
  requestWithdrawal,
  getAllWithdrawals,
  approveWithdrawal,
  markAsPaid,
  rejectWithdrawal,
};
