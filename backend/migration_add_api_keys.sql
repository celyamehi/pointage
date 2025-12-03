-- Migration: Création de la table api_keys pour l'API externe
-- Date: 2024-12

-- Table des clés API pour l'accès externe
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    api_key_hash VARCHAR(255) NOT NULL UNIQUE,
    api_key_preview VARCHAR(50) NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les recherches par hash de clé
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(api_key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_actif ON api_keys(actif);

-- Commentaires sur la table
COMMENT ON TABLE api_keys IS 'Clés API pour l''accès externe aux données de pointage';
COMMENT ON COLUMN api_keys.api_key_hash IS 'Hash SHA-256 de la clé API (la clé originale n''est jamais stockée)';
COMMENT ON COLUMN api_keys.api_key_preview IS 'Aperçu de la clé (premiers caractères) pour identification';
