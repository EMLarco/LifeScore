-- Tabla de retos diarios
CREATE TABLE IF NOT EXISTS daily_challenges (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  points_reward INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de retos completados por usuario
CREATE TABLE IF NOT EXISTS user_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  challenge_id INTEGER REFERENCES daily_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, challenge_id, date)
);

-- Insertar retos de ejemplo
INSERT INTO daily_challenges (title, description, points_reward) VALUES
  ('Racha matutina', 'Completa al menos 2 habitos antes de las 10:00 AM', 15),
  ('Dia productivo', 'Completa todos tus habitos activos hoy', 25),
  ('Aprendizaje diario', 'Completa el habito de lectura', 10),
  ('Mindfulness', 'Completa el habito de meditacion', 10),
  ('Super racha', 'Completa 5 habitos en total hoy', 20),
  ('Madrugador', 'Completa 1 habito antes de las 8:00 AM', 15),
  ('Enfoque total', 'Completa 3 habitos seguidos sin pausa', 15);
