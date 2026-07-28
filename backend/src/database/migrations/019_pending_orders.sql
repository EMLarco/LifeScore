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
