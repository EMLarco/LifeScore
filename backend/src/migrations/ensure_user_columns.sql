-- Asegurar columnas de identidad de usuario y 2FA
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tag VARCHAR(10) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT;

-- Asegurar columna dos_factor_secret en users (usada por el admin revoke2FA)
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
