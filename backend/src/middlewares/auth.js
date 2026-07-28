const { verifyToken } = require('../utils/jwtHelper');
const pool = require('../config/database');

/**
 * Middleware de autenticacion JWT (pag. 39)
 * Verifica el token en el header Authorization: Bearer <token>
 * Si es valido, anade req.user y pasa al siguiente
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No se proporciono token de autenticacion',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    req.user = decoded;
    req.token = token;

    pool.query(
      'UPDATE sessions SET last_activity = NOW() WHERE user_id = $1 AND token = $2',
      [decoded.id, token]
    ).catch(() => {});

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalido',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error al verificar token',
    });
  }
};

module.exports = authMiddleware;