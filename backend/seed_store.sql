-- Seed data para tienda y recompensas (ejecutar una vez)

INSERT INTO store_items (name, description, category, image_url, points_cost, available)
VALUES
  ('Banner Galaxia', 'Fondo de perfil con tematica espacial', 'banner', '', 200, TRUE),
  ('Banner Atardecer', 'Fondo de perfil con paisaje dorado', 'banner', '', 200, TRUE),
  ('Banner Neon', 'Fondo de perfil con luces neon', 'banner', '', 300, TRUE),
  ('Tema Oscuro Premium', 'Tema visual exclusivo para tu perfil', 'theme', '', 150, TRUE),
  ('Tema Oceano', 'Tema azul profundo relajante', 'theme', '', 150, TRUE),
  ('Insignia Estrella', 'Insignia brillante para tu perfil', 'badge', '', 100, TRUE),
  ('Insignia Corazon', 'Insignia de corazones romantica', 'badge', '', 100, TRUE),
  ('Avatar Ninja', 'Avatar exclusivo estilo ninja', 'avatar', '', 250, TRUE),
  ('Avatar Robot', 'Avatar futurista robotico', 'avatar', '', 250, TRUE),
  ('Avatar Fantasma', 'Avatar misterioso fantasmal', 'avatar', '', 250, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO rewards (name, description, points_cost, image_url, available, is_premium_reward)
VALUES
  ('Descuento 10%', '10% de descuento en tu proxima recarga de puntos', 500, '', TRUE, FALSE),
  ('Meditacion Guiada', 'Acceso a una sesion de meditacion guiada exclusiva', 300, '', TRUE, FALSE),
  ('Fondo de Pantalla', 'Fondo de pantalla HD exclusivo de LifeScore', 200, '', TRUE, FALSE),
  ('Badge Premium', 'Insignia especial de recompensa', 150, '', TRUE, FALSE),
  ('Skin Exclusiva', 'Skin limitada edicion recompensa', 400, '', TRUE, TRUE),
  ('1 Dia Premium', '1 dia de membresia premium gratis', 600, '', TRUE, FALSE),
  ('Super Descuento 25%', '25% de descuento en tu proxima suscripcion premium', 800, '', TRUE, TRUE)
ON CONFLICT DO NOTHING;
