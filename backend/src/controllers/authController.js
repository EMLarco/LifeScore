const pool = require('../config/database');
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/cryptoHelper');
const { generateToken } = require('../utils/jwtHelper');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { send2FACodeEmail, sendWelcomeEmail } = require('../services/emailService');
const { getGoogleToken, getGoogleUserInfo } = require('../services/googleAuthService');
const { findOrCreateGoogleUser } = require('../services/userService');
const { auditLog } = require('../services/auditService');

const register = async (req, res, next) => {
  try {
    const { name, email, password, gender } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'El email ya esta registrado' });
    }

    const password_hash = await hashPassword(password);
    const newUser = await User.create({ name, email, password_hash, gender });
    const token = generateToken(newUser);

    sendWelcomeEmail(email, name).catch(() => {});

    await auditLog(newUser.id, 'USER_REGISTER', 'user', newUser.id, { email }, req);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser.id, name: newUser.name, email: newUser.email,
        level: newUser.level, total_xp: newUser.total_xp, gender: newUser.gender,
        points: newUser.points, daily_streak: newUser.daily_streak,
        is_premium: newUser.is_premium, is_admin: newUser.is_admin,
        username: newUser.username, tag: newUser.tag,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales invalidas' });
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Credenciales invalidas' });
    }

    if (user.totp_enabled) {
      const tempToken = generateToken({ id: user.id, email: user.email, requires2FA: true }, '5m');
      return res.status(200).json({
        success: false,
        requires_2fa: true,
        message: 'Se requiere verificacion en dos pasos',
        temp_token: tempToken,
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = user.last_login ? new Date(user.last_login).toISOString().split('T')[0] : null;
    let pointsBonus = 0;
    let newStreak = user.daily_streak || 0;

    if (lastLogin === today) {
      pointsBonus = 0;
    } else if (lastLogin === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
      newStreak = user.daily_streak + 1;
      pointsBonus = 5 + Math.min(newStreak * 2, 20);
    } else {
      newStreak = 1;
      pointsBonus = 5;
    }

    if (pointsBonus > 0) {
      await User.updateStreakAndPoints(user.id, newStreak, pointsBonus);
    }
    await User.updateLastLogin(user.id);

    const updatedUser = await User.findById(user.id);
    const token = generateToken(updatedUser);

    const userAgent = req.headers['user-agent'] || 'Desconocido';
    const ipAddress = req.ip || req.connection?.remoteAddress || '0.0.0.0';
    await pool.query(
      `INSERT INTO sessions (user_id, token, device_info, ip_address, last_activity)
       VALUES ($1, $2, $3, $4, NOW())`,
      [user.id, token, userAgent, ipAddress]
    ).catch(() => {});

    await auditLog(user.id, 'USER_LOGIN', 'user', user.id, { email, points_bonus: pointsBonus }, req);

    res.status(200).json({
      success: true,
      message: 'Inicio de sesion exitoso',
      user: {
        id: updatedUser.id, name: updatedUser.name, email: updatedUser.email,
        level: updatedUser.level, total_xp: updatedUser.total_xp, gender: updatedUser.gender,
        points: updatedUser.points, daily_streak: updatedUser.daily_streak,
        is_premium: updatedUser.is_premium, is_admin: updatedUser.is_admin,
        username: updatedUser.username, tag: updatedUser.tag,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const loginWith2FA = async (req, res, next) => {
  try {
    const { temp_token, code } = req.body;
    if (!temp_token || !code) {
      return res.status(400).json({ success: false, message: 'Token y codigo requeridos' });
    }

    const { verifyToken } = require('../utils/jwtHelper');
    const decoded = verifyToken(temp_token);
    if (!decoded.requires2FA) {
      return res.status(400).json({ success: false, message: 'Token invalido' });
    }

    const result = await pool.query('SELECT totp_secret FROM users WHERE id = $1', [decoded.id]);
    const secret = result.rows[0]?.totp_secret;
    if (!secret) {
      return res.status(400).json({ success: false, message: '2FA no configurado' });
    }

    const verified = speakeasy.totp.verify({
      secret, encoding: 'base32', token: code, window: 1,
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Codigo 2FA invalido' });
    }

    const user = await User.findById(decoded.id);
    const token = generateToken(user);

    const userAgent = req.headers['user-agent'] || 'Desconocido';
    const ipAddress = req.ip || req.connection?.remoteAddress || '0.0.0.0';
    await pool.query(
      `INSERT INTO sessions (user_id, token, device_info, ip_address, last_activity)
       VALUES ($1, $2, $3, $4, NOW())`,
      [decoded.id, token, userAgent, ipAddress]
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Verificacion exitosa',
      user: {
        id: user.id, name: user.name, email: user.email,
        level: user.level, total_xp: user.total_xp, gender: user.gender,
        points: user.points, daily_streak: user.daily_streak,
        is_premium: user.is_premium, is_admin: user.is_admin,
        username: user.username, tag: user.tag,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Codigo de Google requerido' });
    }

    const tokenData = await getGoogleToken(code);
    const userInfo = await getGoogleUserInfo(tokenData.access_token);
    const user = await findOrCreateGoogleUser({
      email: userInfo.email, name: userInfo.name,
      picture: userInfo.picture, googleId: userInfo.id,
    });

    const token = generateToken(user);

    const userAgent = req.headers['user-agent'] || 'Desconocido';
    const ipAddress = req.ip || req.connection?.remoteAddress || '0.0.0.0';
    await pool.query(
      `INSERT INTO sessions (user_id, token, device_info, ip_address, last_activity)
       VALUES ($1, $2, $3, $4, NOW())`,
      [user.id, token, userAgent, ipAddress]
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Inicio de sesion con Google exitoso',
      user: {
        id: user.id, name: user.name, email: user.email,
        username: user.username, tag: user.tag,
        level: user.level, points: user.points,
        is_premium: user.is_premium, is_admin: user.is_admin,
        gender: user.gender,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const enable2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const secret = speakeasy.generateSecret({
      name: `LifeScore (${req.user.email})`,
    });

    await pool.query('UPDATE users SET totp_secret = $1, totp_enabled = true WHERE id = $2', [secret.base32, userId]);

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      message: '2FA habilitado. Escanea el QR y verifica con un codigo.',
      data: { qrCode: qrCodeDataUrl, secret: secret.base32 },
    });
  } catch (error) {
    next(error);
  }
};

const verify2FA = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    const result = await pool.query('SELECT totp_secret FROM users WHERE id = $1', [userId]);
    const secret = result.rows[0]?.totp_secret;
    if (!secret) {
      return res.status(400).json({ success: false, message: '2FA no habilitado' });
    }

    const verified = speakeasy.totp.verify({
      secret, encoding: 'base32', token: code, window: 1,
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Codigo 2FA invalido' });
    }

    res.status(200).json({ success: true, message: '2FA verificado correctamente' });
  } catch (error) {
    next(error);
  }
};

const disable2FA = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    const result = await pool.query('SELECT totp_secret FROM users WHERE id = $1', [userId]);
    const secret = result.rows[0]?.totp_secret;
    if (!secret) {
      return res.status(400).json({ success: false, message: '2FA no habilitado' });
    }

    const verified = speakeasy.totp.verify({
      secret, encoding: 'base32', token: code, window: 1,
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Codigo invalido para desactivar 2FA' });
    }

    await pool.query('UPDATE users SET totp_secret = NULL, totp_enabled = false WHERE id = $1', [userId]);

    res.status(200).json({ success: true, message: '2FA desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};

const send2FACode = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const result = await pool.query('SELECT totp_secret FROM users WHERE id = $1', [user.id]);
    const secret = result.rows[0]?.totp_secret;
    if (!secret) {
      return res.status(400).json({ success: false, message: '2FA no habilitado' });
    }

    const code = speakeasy.totp({ secret, encoding: 'base32' });
    await send2FACodeEmail(user.email, user.name, code);

    res.status(200).json({ success: true, message: 'Codigo 2FA enviado a tu correo' });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'La contrasena actual es incorrecta' });
    }

    const password_hash = await hashPassword(newPassword);
    await User.updatePassword(user.id, password_hash);

    res.status(200).json({ success: true, message: 'Contrasena actualizada correctamente' });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const stats = await User.getStats(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        ...user,
        habits_count: parseInt(stats.habits_count) || 0,
        max_streak: parseInt(stats.max_streak) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register, login, loginWith2FA, googleLogin,
  enable2FA, verify2FA, disable2FA, send2FACode,
  changePassword, getProfile,
};
