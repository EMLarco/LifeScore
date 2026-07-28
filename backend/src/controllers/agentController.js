const { getAgentSuggestions, chatWithHistory } = require('../services/openrouterService');
const pool = require('../config/database');

const getUserContext = async (userId) => {
  const userResult = await pool.query(
    'SELECT name, level, points, is_premium FROM users WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0];

  const habitsResult = await pool.query(
    'SELECT title FROM habits WHERE user_id = $1 AND active = true',
    [userId]
  );

  const scheduleResult = await pool.query(
    `SELECT day_of_week, start_time, end_time
     FROM user_schedule
     WHERE user_id = $1 AND is_day_off = false
     ORDER BY day_of_week`,
    [userId]
  );
  const schedule = scheduleResult.rows.map((row) => ({
    day: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'][row.day_of_week - 1],
    startTime: row.start_time,
    endTime: row.end_time,
  }));

  return { user, habits: habitsResult.rows, schedule };
};

const getSuggestions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { user, habits, schedule } = await getUserContext(userId);

    const suggestions = await getAgentSuggestions({
      name: user.name,
      level: user.level,
      points: user.points,
      is_premium: user.is_premium,
      habits,
      schedule,
    });

    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
};

const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacio' });
    }

    const userId = req.user.id;
    const { user, habits, schedule } = await getUserContext(userId);

    const systemPrompt = `
      Eres "LifeScore Agent", un asistente personal de salud y productividad.
      Ayudas a los usuarios a mejorar sus habitos, organizar su dia y mantener un estilo de vida saludable.

      Informacion del usuario:
      - Nombre: ${user.name}
      - Nivel: ${user.level}
      - Puntos: ${user.points}
      - Habitos actuales: ${habits.map((h) => h.title).join(', ') || 'Ninguno'}
      - Horario semanal: ${schedule.map((d) => `${d.day}: ${d.startTime}-${d.endTime}`).join('; ') || 'No definido'}

      Responde de manera conversacional, amigable y util. Ofrece consejos practicos y motivacion.
      Manten respuestas concisas (maximo 150 palabras) y en espanol.
    `;

    const reply = await chatWithHistory(message, [], systemPrompt);

    res.status(200).json({ success: true, data: { reply } });
  } catch (error) {
    console.error('Error en chat:', error.message || error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al procesar el mensaje',
    });
  }
};

module.exports = { getSuggestions, chat };
