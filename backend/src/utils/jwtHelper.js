const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/jwt');

/**
 * Genera un JWT para el usuario
 * @param {object} user - { id, email, name, level }
 * @returns {string} Token firmado
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    level: user.level || 1,
    is_admin: user.is_admin || false,
  };
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verifica un JWT
 * @param {string} token
 * @returns {object} Payload decodificado
 * @throws {Error} Si es inválido o expirado
 */
const verifyToken = (token) => {
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
};