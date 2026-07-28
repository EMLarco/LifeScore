const pool = require('../config/database');

const getSchedule = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_schedule WHERE user_id = $1 ORDER BY day_of_week',
      [req.user.id]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const { schedule } = req.body;
    const userId = req.user.id;

    await pool.query('BEGIN');
    await pool.query('DELETE FROM user_schedule WHERE user_id = $1', [userId]);

    for (const item of schedule) {
      if (item.isDayOff) {
        await pool.query(
          'INSERT INTO user_schedule (user_id, day_of_week, is_day_off) VALUES ($1, $2, true)',
          [userId, item.dayOfWeek]
        );
      } else {
        await pool.query(
          'INSERT INTO user_schedule (user_id, day_of_week, start_time, end_time, is_day_off) VALUES ($1, $2, $3, $4, false)',
          [userId, item.dayOfWeek, item.startTime, item.endTime]
        );
      }
    }
    await pool.query('COMMIT');
    res.status(200).json({ success: true, message: 'Horario actualizado' });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
};

module.exports = { getSchedule, updateSchedule };
