const pool = require('../config/database');

const auditLog = async (userId, action, entityType, entityId = null, details = {}, req = null) => {
  try {
    const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
    const userAgent = req?.headers?.['user-agent'] || null;
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entityType, entityId, JSON.stringify(details), ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Error registrando auditoria:', error.message);
  }
};

module.exports = { auditLog };
