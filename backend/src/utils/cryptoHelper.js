const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Encripta una contraseña
 * @param {string} password - Texto plano
 * @returns {Promise<string>} Hash
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compara contraseña con hash
 * @param {string} password - Texto plano
 * @param {string} hash - Hash almacenado
 * @returns {Promise<boolean>}
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  comparePassword,
};