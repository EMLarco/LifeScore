const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
let OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

const VALID_FREE_MODELS = [
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-001',
  'mistralai/mistral-7b-instruct',
  'meta-llama/llama-3.2-3b-instruct',
  'openrouter/optimus-alpha',
];

if (!VALID_FREE_MODELS.includes(OPENROUTER_MODEL)) {
  console.warn(`Modelo "${OPENROUTER_MODEL}" no esta en la lista de modelos gratuitos. Usando "openai/gpt-4o-mini".`);
  OPENROUTER_MODEL = 'openai/gpt-4o-mini';
}

const openRouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'LifeScore App',
    'Content-Type': 'application/json',
  },
});

const sendMessage = async (systemPrompt, userMessage, maxTokens = 500) => {
  try {
    const response = await openRouterClient.post('/chat/completions', {
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error en OpenRouter:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Error al comunicarse con la IA');
  }
};

const chatWithHistory = async (userMessage, history = [], systemPrompt = '') => {
  try {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    if (history.length > 0) {
      const recentHistory = history.slice(-10);
      messages.push(...recentHistory);
    }
    messages.push({ role: 'user', content: userMessage });

    const response = await openRouterClient.post('/chat/completions', {
      model: OPENROUTER_MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error en OpenRouter (chat):', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Error al comunicarse con la IA');
  }
};

const getAgentSuggestions = async (userData) => {
  const systemPrompt = `
    Eres "LifeScore Agent", un asistente personal de salud y productividad.
    Basado en la informacion del usuario, genera recomendaciones personalizadas en formato JSON.
    Responde UNICAMENTE con un objeto JSON valido.
  `;

  const userPrompt = `
    Informacion del usuario:
    - Nombre: ${userData.name}
    - Nivel: ${userData.level}
    - Puntos: ${userData.points}
    - Es premium?: ${userData.is_premium}
    - Habitos: ${userData.habits?.map(h => h.title).join(', ') || 'Ninguno'}
    - Horario: ${userData.schedule?.map(d => `${d.day}: ${d.startTime}-${d.endTime}`).join('; ') || 'No definido'}

    Genera un JSON con:
    {
      "exercise": "Recomendacion de ejercicio",
      "exerciseTime": "HH:MM",
      "reading": "Recomendacion de lectura",
      "readingTime": "HH:MM",
      "meals": "Sugerencia de comida",
      "mealTime": "HH:MM",
      "meditation": "Recomendacion de meditacion",
      "meditationTime": "HH:MM"
    }
  `;

  try {
    const response = await openRouterClient.post('/chat/completions', {
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.5,
    });

    const text = response.data.choices[0].message.content.trim();
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Error parseando JSON:', text);
      return {
        exercise: 'Realiza una caminata de 20 minutos.',
        exerciseTime: '10:00',
        reading: 'Lee 10 paginas de un libro.',
        readingTime: '13:00',
        meals: 'Prepara una ensalada saludable.',
        mealTime: '12:30',
        meditation: 'Tomate 5 minutos para respirar.',
        meditationTime: '08:30',
      };
    }
  } catch (error) {
    console.error('Error en getAgentSuggestions:', error);
    throw error;
  }
};

module.exports = {
  sendMessage,
  chatWithHistory,
  getAgentSuggestions,
};
