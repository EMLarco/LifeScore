const pool = require('../config/database');

const getEvents = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM calendar_events WHERE user_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date, start_time',
      [userId, start, end]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const { title, description, type, startTime, endTime, date } = req.body;
    const userId = req.user.id;
    const result = await pool.query(
      `INSERT INTO calendar_events (user_id, title, description, type, start_time, end_time, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, title, description || '', type || 'other', startTime, endTime, date]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await pool.query(
      'DELETE FROM calendar_events WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { getEvents, createEvent, deleteEvent };
