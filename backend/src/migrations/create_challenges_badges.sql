-- Eliminar tablas anteriores si existen
DROP TABLE IF EXISTS user_challenges CASCADE;
DROP TABLE IF EXISTS daily_challenges CASCADE;

-- Tabla de retos (diarios, semanales, mensuales)
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  points_reward INTEGER NOT NULL DEFAULT 10,
  cooldown_days INTEGER DEFAULT 1,
  badge_key VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO challenges (title, description, type, difficulty, points_reward, cooldown_days, badge_key) VALUES
  ('Racha matutina', 'Completa al menos 2 habitos antes de las 10:00 AM', 'daily', 'medium', 15, 1, 'early_bird'),
  ('Enfoque total', 'Completa 3 habitos seguidos sin pausa', 'daily', 'hard', 20, 1, 'focused'),
  ('Dia productivo', 'Completa todos tus habitos activos hoy', 'daily', 'hard', 25, 1, 'productive_day'),
  ('Super racha', 'Completa habitos 5 dias consecutivos', 'weekly', 'expert', 50, 7, 'super_streak'),
  ('Semana de aprendizaje', 'Completa el habito de lectura al menos 3 veces', 'weekly', 'medium', 30, 7, 'learning_week'),
  ('Semana de mindfulness', 'Completa el habito de meditacion al menos 4 veces', 'weekly', 'medium', 30, 7, 'mindful_week'),
  ('Leyenda mensual', 'Completa todos los habitos 20 dias del mes', 'monthly', 'expert', 100, 30, 'monthly_legend'),
  ('Explosion de productividad', 'Completa 100 habitos en el mes', 'monthly', 'hard', 80, 30, 'productivity_blast'),
  ('Maestro de habitos', 'Completa al menos 5 habitos diferentes cada semana', 'monthly', 'expert', 120, 30, 'habit_master');

-- Tabla de insignias
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7) DEFAULT '#7C3AED',
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO badges (key, name, description, icon, color) VALUES
  ('early_bird', 'Madrugador', 'Completa habitos antes de las 10 AM', 'IconSun', '#F59E0B'),
  ('focused', 'Enfoque total', 'Completa 3 habitos seguidos', 'IconTarget', '#7C3AED'),
  ('productive_day', 'Dia productivo', 'Completa todos los habitos del dia', 'IconCheck', '#2ECC71'),
  ('super_streak', 'Super racha', '5 dias consecutivos de habitos', 'IconFlame', '#EF4444'),
  ('learning_week', 'Semana de aprendizaje', 'Lee 3 veces en la semana', 'IconBook', '#3B82F6'),
  ('mindful_week', 'Semana de mindfulness', 'Medita 4 veces en la semana', 'IconMoodSmile', '#EC4899'),
  ('monthly_legend', 'Leyenda mensual', 'Completa habitos 20 dias', 'IconCrown', '#FBBF24'),
  ('productivity_blast', 'Explosion de productividad', '100 habitos en el mes', 'IconRocket', '#8B5CF6'),
  ('habit_master', 'Maestro de habitos', '5 habitos diferentes cada semana', 'IconStar', '#EF4444');

-- Tabla de insignias del usuario
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  badge_key VARCHAR(50) REFERENCES badges(key) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

-- Tabla de progreso de retos
CREATE TABLE IF NOT EXISTS user_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT NOW(),
  period_start DATE NOT NULL,
  UNIQUE(user_id, challenge_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user_date ON user_challenges(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_period ON user_challenges(user_id, period_start);
