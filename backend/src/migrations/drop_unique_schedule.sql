-- Eliminar restriccion UNIQUE para permitir multiples bloques por dia
ALTER TABLE user_schedule DROP CONSTRAINT IF EXISTS user_schedule_user_id_day_of_week_key;
