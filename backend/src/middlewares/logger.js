/**
 * Middleware Logger (pág. 39)
 * Registra método, URL, código de estado y duración de cada petición
 */
const logger = (req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Inicio`);

  // Escuchar cuando la respuesta termine
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

module.exports = logger;