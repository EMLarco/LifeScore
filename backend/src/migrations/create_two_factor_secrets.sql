-- Tabla temporal para secretos 2FA durante el setup
CREATE TABLE IF NOT EXISTS two_factor_secrets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_tfs_user ON two_factor_secrets(user_id);
