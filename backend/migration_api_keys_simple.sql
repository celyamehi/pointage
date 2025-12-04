-- Migration: Simplification des clés API
-- Stockage en clair au lieu de hash, clés toujours visibles

-- 1. Supprimer toutes les anciennes clés API (elles utilisaient le hash)
DELETE FROM api_keys;

-- 2. Supprimer les anciennes colonnes si elles existent
ALTER TABLE api_keys DROP COLUMN IF EXISTS api_key_hash;
ALTER TABLE api_keys DROP COLUMN IF EXISTS api_key_preview;

-- 3. Ajouter la colonne api_key pour stocker la clé en clair
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS api_key TEXT;

-- 4. Créer un index unique sur api_key
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key);

-- Note: Après cette migration, vous devrez créer de nouvelles clés API
-- Les anciennes clés ne fonctionneront plus car elles étaient hashées
