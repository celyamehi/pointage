-- Supprimer la table api_keys
DROP TABLE IF EXISTS api_keys CASCADE;

-- Vérifier que la table est bien supprimée
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'api_keys';
