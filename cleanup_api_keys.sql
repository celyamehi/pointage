-- Nettoyage complet du système de clés API
-- Exécuter ces commandes sur Supabase SQL Editor

-- 1. Supprimer la table api_keys si elle existe
DROP TABLE IF EXISTS api_keys CASCADE;

-- 2. Supprimer les migrations liées aux clés API si elles existent
DELETE FROM supabase_migrations.schema_migrations 
WHERE name LIKE '%api_keys%' OR name LIKE '%migration_api_keys%';

-- 3. Nettoyer les permissions si elles existent
DROP POLICY IF EXISTS "Users can view their own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert their own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own api keys" ON api_keys;

-- 4. Supprimer les triggers liés aux clés API si ils existent
DROP TRIGGER IF EXISTS update_api_key_last_used ON api_keys;
DROP FUNCTION IF EXISTS update_api_key_last_used();

-- 5. Nettoyage final
-- Vérifier que tout est bien supprimé
SELECT 'Table api_keys supprimée' as status FROM information_schema.tables 
WHERE table_name = 'api_keys' AND table_schema = 'public';

-- Message de confirmation
SELECT '✅ Nettoyage des clés API terminé avec succès' as message;
