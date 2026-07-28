const pool = require('../config/database');

const generateAudit = async (req, res, next) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_premium = true) as premium_users,
        (SELECT COUNT(*) FROM habits WHERE active = true) as total_habits,
        (SELECT COUNT(*) FROM habit_logs) as total_completions,
        (SELECT COUNT(*) FROM achievements) as total_achievements,
        (SELECT COUNT(*) FROM challenges WHERE is_active = true) as total_challenges,
        (SELECT COUNT(*) FROM friends WHERE status = 'accepted') as total_friendships,
        (SELECT COALESCE(AVG(level), 0) FROM users) as avg_level,
        (SELECT COALESCE(AVG(points), 0) FROM users) as avg_points,
        (SELECT COUNT(*) FROM users WHERE two_factor_enabled = true) as users_with_2fa
    `);

    const users = await pool.query(`
      SELECT id, name, email, username, tag, level, points, total_xp, daily_streak,
             is_premium, is_admin, two_factor_enabled, created_at
      FROM users ORDER BY created_at DESC
    `);

    const activity = await pool.query(`
      SELECT hl.completed_at, u.name as user_name, u.username, h.title as habit_title
      FROM habit_logs hl
      JOIN users u ON hl.user_id = u.id
      JOIN habits h ON hl.habit_id = h.id
      ORDER BY hl.completed_at DESC
      LIMIT 50
    `);

    const topHabits = await pool.query(`
      SELECT h.title, COUNT(hl.id) as completions
      FROM habits h
      JOIN habit_logs hl ON h.id = hl.habit_id
      GROUP BY h.id
      ORDER BY completions DESC
      LIMIT 10
    `);

    const newUsersThisMonth = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);

    const todayActivity = await pool.query(`
      SELECT COUNT(*) as today_completions
      FROM habit_logs
      WHERE completed_at >= CURRENT_DATE
    `);

    let financialSummary = { total_income: 0, total_withdrawn: 0, total_paid_invoices: 0, total_paid_withdrawals: 0 };
    try {
      const fsResult = await pool.query(`
        SELECT
          (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'subscription' AND status = 'completed') as total_income,
          (SELECT COALESCE(SUM(amount_usd), 0) FROM withdrawals WHERE status = 'paid') as total_withdrawn,
          (SELECT COUNT(*) FROM transactions WHERE type = 'subscription' AND status = 'completed') as total_paid_invoices,
          (SELECT COUNT(*) FROM withdrawals WHERE status = 'paid') as total_paid_withdrawals
      `);
      financialSummary = fsResult.rows[0];
    } catch { /* tables may not exist yet */ }

    let subscriptions = { rows: [] };
    try {
      subscriptions = await pool.query(`
        SELECT s.*, u.name, u.email
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
        LIMIT 50
      `);
    } catch { /* table may not exist */ }

    let withdrawals = { rows: [] };
    try {
      withdrawals = await pool.query(`
        SELECT w.*, u.name, u.email
        FROM withdrawals w
        JOIN users u ON w.user_id = u.id
        ORDER BY w.created_at DESC
        LIMIT 50
      `);
    } catch { /* table may not exist */ }

    let auditLogs = { rows: [] };
    try {
      auditLogs = await pool.query(`
        SELECT al.*, u.name, u.email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 100
      `);
    } catch { /* table may not exist */ }

    const auditData = {
      generatedAt: new Date().toISOString(),
      stats: stats.rows[0],
      users: users.rows,
      activity: activity.rows,
      topHabits: topHabits.rows,
      newUsersThisMonth: parseInt(newUsersThisMonth.rows[0].count),
      todayActivity: parseInt(todayActivity.rows[0].today_completions),
      financialSummary,
      subscriptions: subscriptions.rows,
      withdrawals: withdrawals.rows,
      auditLogs: auditLogs.rows,
      appVersion: '1.0.0',
    };

    res.status(200).json({ success: true, data: auditData });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateAudit };
