const pool = require('../config/database');

const createLog = async (habitId, userId) => {
  const result = await pool.query(
    `INSERT INTO habit_logs (habit_id, user_id, completed_at)
     VALUES ($1, $2, NOW())
     RETURNING *`,
    [habitId, userId]
  );
  return result.rows[0];
};

const isCompletedToday = async (habitId, userId) => {
  const result = await pool.query(
    `SELECT * FROM habit_logs
     WHERE habit_id = $1 AND user_id = $2
       AND DATE(completed_at) = CURRENT_DATE`,
    [habitId, userId]
  );
  return result.rows.length > 0;
};

const getStreak = async (habitId, userId) => {
  // Obtener días consecutivos hasta hoy
  const result = await pool.query(
    `WITH RECURSIVE streak_days AS (
       SELECT DATE(completed_at) as day
       FROM habit_logs
       WHERE habit_id = $1 AND user_id = $2
         AND DATE(completed_at) <= CURRENT_DATE
       GROUP BY DATE(completed_at)
       ORDER BY day DESC
       LIMIT 365
     ),
     numbered AS (
       SELECT day,
              ROW_NUMBER() OVER (ORDER BY day DESC) as rn
       FROM streak_days
     )
     SELECT COALESCE(
       (SELECT COUNT(*)
        FROM numbered
        WHERE day = CURRENT_DATE - (rn - 1)::integer
          AND rn <= 365
       ), 0) as streak
    `,
    [habitId, userId]
  );
  return parseInt(result.rows[0]?.streak) || 0;
};

const getMonthlyLogs = async (userId, year, month) => {
  const result = await pool.query(
    `SELECT DATE(completed_at) as date, COUNT(*) as count
     FROM habit_logs
     WHERE user_id = $1
       AND EXTRACT(YEAR FROM completed_at) = $2
       AND EXTRACT(MONTH FROM completed_at) = $3
     GROUP BY DATE(completed_at)
     ORDER BY DATE(completed_at) ASC`,
    [userId, year, month]
  );
  return result.rows;
};

const getGlobalStreak = async (userId) => {
  // Rachas globales: días en los que completó AL MENOS un hábito
  const result = await pool.query(
    `WITH RECURSIVE streak_days AS (
       SELECT DISTINCT DATE(completed_at) as day
       FROM habit_logs
       WHERE user_id = $1
         AND DATE(completed_at) <= CURRENT_DATE
       ORDER BY day DESC
       LIMIT 365
     ),
     numbered AS (
       SELECT day,
              ROW_NUMBER() OVER (ORDER BY day DESC) as rn
       FROM streak_days
     )
     SELECT COALESCE(
       (SELECT COUNT(*)
        FROM numbered
        WHERE day = CURRENT_DATE - (rn - 1)::integer
          AND rn <= 365
       ), 0) as streak
    `,
    [userId]
  );
  return parseInt(result.rows[0]?.streak) || 0;
};

module.exports = {
  createLog,
  isCompletedToday,
  getStreak,
  getMonthlyLogs,
  getGlobalStreak,
};