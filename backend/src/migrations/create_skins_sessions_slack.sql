-- Skins para avatar
CREATE TABLE IF NOT EXISTS skins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  image_url VARCHAR(255),
  points_cost INTEGER DEFAULT 50,
  premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_skins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  skin_id INTEGER REFERENCES skins(id) ON DELETE CASCADE,
  equipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, skin_id)
);

INSERT INTO skins (name, image_url, points_cost) VALUES
  ('Default', '', 0),
  ('Galaxy', '/skins/galaxy.png', 100),
  ('Neon', '/skins/neon.png', 150),
  ('Gold', '/skins/gold.png', 300),
  ('Diamond', '/skins/diamond.png', 500),
  ('Cyberpunk', '/skins/cyberpunk.png', 800);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token TEXT,
  device_info TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW()
);

-- Slack webhook
ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_webhook TEXT;
