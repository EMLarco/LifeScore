const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getAgentSuggestions = async (userData) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
    Eres un asistente personal de salud y productividad llamado "LifeScore Agent".

    Basado en la siguiente informacion del usuario, genera recomendaciones personalizadas y realistas para mejorar sus habitos diarios.

    Informacion del usuario:
    - Nombre: ${userData.name}
    - Nivel: ${userData.level}
    - Puntos: ${userData.points}
    - Es premium?: ${userData.is_premium}
    - Habitos actuales: ${userData.habits?.map((h) => h.title).join(', ') || 'Ninguno registrado.'}
    - Horario semanal (dias laborales, de Lunes a Viernes):
      ${userData.schedule?.map((day) => `- ${day.day}: ${day.startTime} - ${day.endTime}`).join('\n') || 'No ha definido un horario.'}

    Tu tarea es proporcionar recomendaciones en cuatro areas:
    1. Ejercicio fisico (sugerencia y hora ideal).
    2. Lectura / aprendizaje (sugerencia y hora ideal).
    3. Alimentacion / comida saludable (sugerencia y hora ideal).
    4. Meditacion / pausa mental (sugerencia y hora ideal).

    IMPORTANTE: Si el usuario es premium, las recomendaciones deben ser mas detalladas, ambiciosas y personalizadas. Si no es premium, puedes dar sugerencias mas generales.

    Responde UNICAMENTE con un objeto JSON valido con la siguiente estructura:
    {
      "exercise": "Recomendacion de ejercicio",
      "exerciseTime": "Hora sugerida (HH:MM)",
      "reading": "Recomendacion de lectura",
      "readingTime": "Hora sugerida (HH:MM)",
      "meals": "Sugerencia de comida",
      "mealTime": "Hora sugerida (HH:MM)",
      "meditation": "Recomendacion de meditacion",
      "meditationTime": "Hora sugerida (HH:MM)"
    }
  `;

  const fallbackResponse = {
    exercise: 'Realiza una caminata de 20 minutos.',
    exerciseTime: '10:00',
    reading: 'Lee 10 paginas de un libro que te inspire.',
    readingTime: '13:00',
    meals: 'Prepara una ensalada con proteina y verduras.',
    mealTime: '12:30',
    meditation: 'Tomate 5 minutos para respirar profundamente.',
    meditationTime: '08:30',
  };

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    try {
      return JSON.parse(responseText);
    } catch (_parseError) {
      return fallbackResponse;
    }
  } catch (_error) {
    return fallbackResponse;
  }
};

const chatWithAgent = async (userMessage, chatHistory, userData) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const systemInstruction = `
    Eres "LifeScore Agent", un asistente personal de salud y productividad.
    Tu objetivo es ayudar al usuario a mejorar sus habitos diarios (ejercicio, alimentacion, lectura, meditacion) basandote en su informacion personal.

    Informacion del usuario:
    - Nombre: ${userData.name}
    - Nivel: ${userData.level}
    - Puntos: ${userData.points}
    - Premium?: ${userData.is_premium}
    - Habitos actuales: ${userData.habits?.map((h) => h.title).join(', ') || 'Ninguno.'}
    - Horario semanal: ${userData.schedule?.map((d) => `${d.day}: ${d.startTime}-${d.endTime}`).join('; ') || 'No definido.'}

    Reglas importantes:
    1. Responde de forma amigable, motivadora y personalizada.
    2. Si el usuario es premium, dale recomendaciones mas detalladas y avanzadas.
    3. Si te preguntan sobre algo fuera de tu ambito (salud, habitos, productividad), redirige amablemente.
    4. Manten un tono positivo y alentador.
    5. Si no sabes algo, no inventes; sugiere que consulte a un profesional.
    6. Responde en espanol.
  `;

  const history = [
    { role: 'user', parts: [{ text: systemInstruction }] },
    { role: 'model', parts: [{ text: 'Entendido. Estoy listo para ayudar.' }] },
  ];

  if (chatHistory && chatHistory.length > 0) {
    for (const msg of chatHistory) {
      if (msg.role === 'user' || msg.role === 'model') {
        history.push({
          role: msg.role,
          parts: [{ text: msg.content }],
        });
      }
    }
  }

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (error) {
    console.error('Error en chatWithAgent:', error.message);
    if (error.message.includes('429') || error.message.includes('quota')) {
      return 'Lo siento, el servicio de IA esta temporalmente saturado. Intenta de nuevo en unos minutos.';
    }
    return 'Hubo un error al conectar con el asistente. Por favor, intenta de nuevo.';
  }
};

module.exports = { getAgentSuggestions, chatWithAgent };
