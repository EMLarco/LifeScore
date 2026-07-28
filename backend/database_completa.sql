-- =============================================================
-- LifeScore Database - Migracion COMPLETA (Ejecutar UNA SOLA VEZ)
-- =============================================================

-- 1. TABLA BASE: usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    gender VARCHAR(20) DEFAULT 'other',
    points INTEGER DEFAULT 0,
    daily_streak INTEGER DEFAULT 0,
    username VARCHAR(50) UNIQUE,
    tag VARCHAR(10),
    is_premium BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    last_login DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    avatar_url VARCHAR(500),
    banner_id INTEGER,
    google_id VARCHAR(255),
    totp_secret VARCHAR(255),
    totp_enabled BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    slack_webhook VARCHAR(500)
);

-- 2. TABLA: habitos
CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    icon VARCHAR(10) DEFAULT '📋',
    color VARCHAR(7) DEFAULT '#2ECC71',
    position INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. TABLA: registros de habitos
CREATE TABLE IF NOT EXISTS habit_logs (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT NOW()
);

-- 4. TABLA: logros
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_key VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_key)
);

-- 5. TABLA: notificaciones push
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    keys JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. TABLA: calendario / horario
CREATE TABLE IF NOT EXISTS user_schedule (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    activity_type VARCHAR(50) DEFAULT 'habit',
    activity_id INTEGER,
    title VARCHAR(200),
    color VARCHAR(7) DEFAULT '#7C3AED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. TABLA: retos (diarios, semanales, mensuales)
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

-- 8. TABLA: progreso de retos
CREATE TABLE IF NOT EXISTS user_challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT NOW(),
    period_start DATE NOT NULL,
    UNIQUE(user_id, challenge_id, period_start)
);

-- 9. TABLA: insignias
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#7C3AED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. TABLA: insignias del usuario
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    badge_key VARCHAR(50) REFERENCES badges(key) ON DELETE CASCADE,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_key)
);

-- 11. TABLA: amigos
CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- 12. TABLA: retos entre amigos
CREATE TABLE IF NOT EXISTS friend_challenges (
    id SERIAL PRIMARY KEY,
    challenger_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    challenged_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_wagered INTEGER DEFAULT 50,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'expired')),
    winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    challenger_completed BOOLEAN DEFAULT FALSE,
    challenged_completed BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- 13. TABLA: logros diarios (365)
CREATE TABLE IF NOT EXISTS daily_achievements (
    id SERIAL PRIMARY KEY,
    day_of_year INTEGER UNIQUE NOT NULL CHECK (day_of_year BETWEEN 1 AND 365),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT 'IconCalendarStar',
    color VARCHAR(7) DEFAULT '#7C3AED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 14. TABLA: logros desbloqueados por usuario
CREATE TABLE IF NOT EXISTS user_daily_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_day INTEGER NOT NULL CHECK (achievement_day BETWEEN 1 AND 365),
    unlocked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_day)
);

-- 15. TABLA: pagos
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    paypal_order_id VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- 16. TABLA: suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paypal_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    plan_id VARCHAR(100) NOT NULL DEFAULT 'monthly',
    plan_name VARCHAR(100) NOT NULL DEFAULT 'Premium',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    next_billing_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. TABLA: facturas
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id),
    payment_id INTEGER REFERENCES payments(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'paid',
    pdf_path VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. TABLA: retos premium
CREATE TABLE IF NOT EXISTS premium_challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    challenge_type VARCHAR(50) NOT NULL DEFAULT 'daily',
    xp_reward INTEGER NOT NULL DEFAULT 50,
    badge_key VARCHAR(100),
    required_level INTEGER NOT NULL DEFAULT 5,
    icon VARCHAR(100) DEFAULT 'IconTrophy',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. TABLA: retos premium completados
CREATE TABLE IF NOT EXISTS user_premium_challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES premium_challenges(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- 20. TABLA: skins
CREATE TABLE IF NOT EXISTS skins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    points_cost INTEGER DEFAULT 50,
    premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 21. TABLA: skins del usuario
CREATE TABLE IF NOT EXISTS user_skins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    skin_id INTEGER REFERENCES skins(id) ON DELETE CASCADE,
    equipped BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, skin_id)
);

-- 22. TABLA: sesiones
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT,
    device_info TEXT,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW()
);

-- 23. TABLA: banners
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    points_cost INTEGER NOT NULL DEFAULT 100,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 24. TABLA: banners del usuario
CREATE TABLE IF NOT EXISTS user_banners (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    banner_id INTEGER REFERENCES banners(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, banner_id)
);

-- 25. TABLA: secretos 2FA temporales
CREATE TABLE IF NOT EXISTS two_factor_secrets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 26. TABLA: ordenes pendientes (PayPal)
CREATE TABLE IF NOT EXISTS pending_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    order_id VARCHAR(255) UNIQUE,
    type VARCHAR(20),
    package_id VARCHAR(20),
    points INTEGER,
    amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 27. TABLA: transacciones unificadas
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    paypal_order_id VARCHAR(255) UNIQUE,
    type VARCHAR(50) NOT NULL,
    plan VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- 28. TABLA: retiros de puntos
CREATE TABLE IF NOT EXISTS withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    amount_usd DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 29. TABLA: auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 30. TABLA: tienda - items
CREATE TABLE IF NOT EXISTS store_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    image_url VARCHAR(500),
    points_cost INTEGER NOT NULL DEFAULT 50,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 31. TABLA: items comprados por usuario
CREATE TABLE IF NOT EXISTS user_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES store_items(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- 32. TABLA: recompensas canjeables
CREATE TABLE IF NOT EXISTS rewards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL DEFAULT 100,
    image_url VARCHAR(500),
    available BOOLEAN DEFAULT TRUE,
    is_premium_reward BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 33. TABLA: recompensas canjeadas por usuario
CREATE TABLE IF NOT EXISTS user_rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reward_id INTEGER REFERENCES rewards(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, reward_id)
);

-- 34. TABLA: eventos del calendario
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    type VARCHAR(50) DEFAULT 'other',
    start_time TIME,
    end_time TIME,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- INDICES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_completed_at ON habit_logs(completed_at);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_date ON user_challenges(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_period ON user_challenges(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_friends_user ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_fc_challenger ON friend_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_fc_challenged ON friend_challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_fc_status ON friend_challenges(status);
CREATE INDEX IF NOT EXISTS idx_fc_expires ON friend_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_uda_user ON user_daily_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id ON subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_user_premium_challenges_user ON user_premium_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_tfs_user ON two_factor_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_store_items_available ON store_items(available);
CREATE INDEX IF NOT EXISTS idx_store_items_category ON store_items(category);
CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_available ON rewards(available);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);

-- =============================================================
-- DATOS INICIALES (SEED)
-- =============================================================

-- Retos (challenges)
INSERT INTO challenges (title, description, type, difficulty, points_reward, cooldown_days, badge_key) VALUES
  ('Racha matutina', 'Completa al menos 2 habitos antes de las 10:00 AM', 'daily', 'medium', 15, 1, 'early_bird'),
  ('Enfoque total', 'Completa 3 habitos seguidos sin pausa', 'daily', 'hard', 20, 1, 'focused'),
  ('Dia productivo', 'Completa todos tus habitos activos hoy', 'daily', 'hard', 25, 1, 'productive_day'),
  ('Super racha', 'Completa habitos 5 dias consecutivos', 'weekly', 'expert', 50, 7, 'super_streak'),
  ('Semana de aprendizaje', 'Completa el habito de lectura al menos 3 veces', 'weekly', 'medium', 30, 7, 'learning_week'),
  ('Semana de mindfulness', 'Completa el habito de meditacion al menos 4 veces', 'weekly', 'medium', 30, 7, 'mindful_week'),
  ('Leyenda mensual', 'Completa todos los habitos 20 dias del mes', 'monthly', 'expert', 100, 30, 'monthly_legend'),
  ('Explosion de productividad', 'Completa 100 habitos en el mes', 'monthly', 'hard', 80, 30, 'productivity_blast'),
  ('Maestro de habitos', 'Completa al menos 5 habitos diferentes cada semana', 'monthly', 'expert', 120, 30, 'habit_master')
ON CONFLICT DO NOTHING;

-- Insignias (badges)
INSERT INTO badges (key, name, description, icon, color) VALUES
  ('early_bird', 'Madrugador', 'Completa habitos antes de las 10 AM', 'IconSun', '#F59E0B'),
  ('focused', 'Enfoque total', 'Completa 3 habitos seguidos', 'IconTarget', '#7C3AED'),
  ('productive_day', 'Dia productivo', 'Completa todos los habitos del dia', 'IconCheck', '#2ECC71'),
  ('super_streak', 'Super racha', '5 dias consecutivos de habitos', 'IconFlame', '#EF4444'),
  ('learning_week', 'Semana de aprendizaje', 'Lee 3 veces en la semana', 'IconBook', '#3B82F6'),
  ('mindful_week', 'Semana de mindfulness', 'Medita 4 veces en la semana', 'IconMoodSmile', '#EC4899'),
  ('monthly_legend', 'Leyenda mensual', 'Completa habitos 20 dias', 'IconCrown', '#FBBF24'),
  ('productivity_blast', 'Explosion de productividad', '100 habitos en el mes', 'IconRocket', '#8B5CF6'),
  ('habit_master', 'Maestro de habitos', '5 habitos diferentes cada semana', 'IconStar', '#EF4444')
ON CONFLICT DO NOTHING;

-- Skins
INSERT INTO skins (name, image_url, points_cost) VALUES
  ('Default', '', 0),
  ('Galaxy', '', 100),
  ('Neon', '', 150),
  ('Gold', '', 300),
  ('Diamond', '', 500),
  ('Cyberpunk', '', 800)
ON CONFLICT DO NOTHING;

-- Retos premium
INSERT INTO premium_challenges (title, description, challenge_type, xp_reward, badge_key, required_level, icon)
VALUES
    ('Meditacion Profunda', 'Completa 30 minutos de meditacion en un solo dia', 'daily', 100, 'deep_meditation', 5, 'IconBrain'),
    ('Maraton de Productividad', 'Registra 10 tareas completadas en un solo dia', 'daily', 75, 'productivity_marathon', 3, 'IconRun'),
    ('Reto de Constancia', 'Manten una racha de 7 dias consecutivos', 'weekly', 200, 'consistency_7', 7, 'IconFlame'),
    ('Explorador de Habitos', 'Crea 5 nuevos habitos en una semana', 'weekly', 150, 'habit_explorer', 4, 'IconCompass'),
    ('Maestro del Balance', 'Completa al menos 1 habito de cada categoria en un mes', 'monthly', 300, 'balance_master', 10, 'IconScale'),
    ('Leyenda de LifeScore', 'Alcanza nivel 20 y completa 50 retos', 'monthly', 500, 'lifescore_legend', 20, 'IconCrown')
ON CONFLICT DO NOTHING;

-- Logros diarios (365)
INSERT INTO daily_achievements (day_of_year, name, description, icon, color)
SELECT day, name, descr, icon, color FROM (VALUES
  (1, 'Primero del ano', 'Desbloquea tu primer logro del ano', 'IconTrophy', '#F59E0B'),
  (2, 'Constancia', 'Manten tu racha por 2 dias', 'IconFlame', '#EF4444'),
  (3, 'Triangulo perfecto', 'Completa 3 habitos en un dia', 'IconStar', '#3B82F6'),
  (7, 'Semana completa', '7 dias de racha', 'IconCalendarWeek', '#7C3AED'),
  (10, 'Doble digito', 'Alcanza nivel 10', 'IconCrown', '#FBBF24'),
  (14, 'Dos semanas', '14 dias de racha consecutiva', 'IconCalendarWeek', '#7C3AED'),
  (21, 'Tres semanas', '21 dias de racha', 'IconCalendarWeek', '#7C3AED'),
  (30, 'Un mes completo', '30 dias de racha', 'IconCalendarMonth', '#7C3AED'),
  (50, 'Cincuenta', '50 dias de racha consecutiva', 'IconFlame', '#EF4444'),
  (100, 'Cien', '100 dias de racha consecutiva', 'IconTrophy', '#F59E0B'),
  (200, 'Doscientos', '200 dias de racha consecutiva', 'IconTrophy', '#F59E0B'),
  (300, 'Trescientos', '300 dias de racha consecutiva', 'IconTrophy', '#F59E0B'),
  (365, 'Leyenda absoluta', '365 dias de racha un ano entero', 'IconCrown', '#FBBF24')
) AS vals(day, name, descr, icon, color)
WHERE NOT EXISTS (SELECT 1 FROM daily_achievements WHERE day_of_year = vals.day);

-- Eliminar restriccion UNIQUE de user_schedule si existe
ALTER TABLE user_schedule DROP CONSTRAINT IF EXISTS user_schedule_user_id_day_of_week_key;

-- =============================================================
-- VERIFICACION
-- =============================================================
SELECT 'Base de datos LifeScore creada correctamente' AS mensaje;
SELECT COUNT(*) || ' tablas creadas' AS tablas FROM information_schema.tables WHERE table_schema = 'public';
