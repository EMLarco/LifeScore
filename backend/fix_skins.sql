-- Limpiar URLs de skins que no existen en produccion
UPDATE skins SET image_url = '' WHERE image_url IS NOT NULL AND image_url != '';
