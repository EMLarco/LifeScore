-- ============================================================
-- Migracion 018: Sistema de Monetizacion
-- Suscripciones PayPal, Retos Premium, Facturas PDF
-- ============================================================

-- Tabla de suscripciones PayPal
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

-- Add missing columns if table already existed with simpler schema
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='plan_id') THEN
        ALTER TABLE subscriptions ADD COLUMN plan_id VARCHAR(100) NOT NULL DEFAULT 'monthly';
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='plan_name') THEN
        ALTER TABLE subscriptions ADD COLUMN plan_name VARCHAR(100) NOT NULL DEFAULT 'Premium';
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='amount') THEN
        ALTER TABLE subscriptions ADD COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='next_billing_date') THEN
        ALTER TABLE subscriptions ADD COLUMN next_billing_date TIMESTAMPTZ;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='started_at') THEN
        ALTER TABLE subscriptions ADD COLUMN started_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='cancelled_at') THEN
        ALTER TABLE subscriptions ADD COLUMN cancelled_at TIMESTAMPTZ;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='updated_at') THEN
        ALTER TABLE subscriptions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id ON subscriptions(paypal_subscription_id);

-- Tabla de facturas
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

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- Tabla de retos premium
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

-- Tabla de retos premium completados por usuario
CREATE TABLE IF NOT EXISTS user_premium_challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES premium_challenges(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_premium_challenges_user ON user_premium_challenges(user_id);

-- Agregar columna slack_webhook a users si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='slack_webhook') THEN
        ALTER TABLE users ADD COLUMN slack_webhook VARCHAR(500);
    END IF;
END $$;

-- ============================================================
-- Seed data: Retos Premium de ejemplo
-- ============================================================
INSERT INTO premium_challenges (title, description, challenge_type, xp_reward, badge_key, required_level, icon)
VALUES
    ('Meditacion Profunda', 'Completa 30 minutos de meditacion en un solo dia', 'daily', 100, 'deep_meditation', 5, 'IconBrain'),
    ('Maraton de Productividad', 'Registra 10 tareas completadas en un solo dia', 'daily', 75, 'productivity_marathon', 3, 'IconRun'),
    ('Reto de Constancia', 'Mantén una racha de 7 dias consecutivos', 'weekly', 200, 'consistency_7', 7, 'IconFlame'),
    ('Explorador de Habitos', 'Crea 5 nuevos habitos en una semana', 'weekly', 150, 'habit_explorer', 4, 'IconCompass'),
    ('Maestro del Balance', 'Completa al menos 1 habito de cada categoria en un mes', 'monthly', 300, 'balance_master', 10, 'IconScale'),
    ('Leyenda de LifeScore', 'Alcanza nivel 20 y completa 50 retos', 'monthly', 500, 'lifescore_legend', 20, 'IconCrown')
ON CONFLICT DO NOTHING;
