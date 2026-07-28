const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const pool = require('../config/database');

const setup2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const secret = speakeasy.generateSecret({
      name: `LifeScore (${userResult.rows[0].email})`,
      length: 20,
    });

    await pool.query(
      `INSERT INTO two_factor_secrets (user_id, secret, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET secret = $2, created_at = NOW()`,
      [userId, secret.base32]
    );

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      data: { secret: secret.base32, qrCode },
    });
  } catch (error) {
    next(error);
  }
};

const verifyAndEnable2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    const secretResult = await pool.query(
      'SELECT secret FROM two_factor_secrets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    if (secretResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay secret para verificar. Configura 2FA primero.' });
    }
    const secret = secretResult.rows[0].secret;

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Codigo invalido' });
    }

    await pool.query(
      'UPDATE users SET totp_enabled = true, totp_secret = $1 WHERE id = $2',
      [secret, userId]
    );

    res.status(200).json({ success: true, message: '2FA activado correctamente' });
  } catch (error) {
    next(error);
  }
};

const disable2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    const result = await pool.query('SELECT totp_secret FROM users WHERE id = $1', [userId]);
    const secret = result.rows[0]?.totp_secret;
    if (!secret) {
      return res.status(400).json({ success: false, message: '2FA no esta activo' });
    }

    if (code) {
      const verified = speakeasy.totp.verify({
        secret, encoding: 'base32', token: code, window: 1,
      });
      if (!verified) {
        return res.status(400).json({ success: false, message: 'Codigo invalido para desactivar' });
      }
    }

    await pool.query('UPDATE users SET totp_enabled = false, totp_secret = NULL WHERE id = $1', [userId]);
    await pool.query('DELETE FROM two_factor_secrets WHERE user_id = $1', [userId]);

    res.status(200).json({ success: true, message: '2FA desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { setup2FA, verifyAndEnable2FA, disable2FA };
