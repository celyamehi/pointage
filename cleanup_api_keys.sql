-- Nettoyage complet du système de clés API
-- Exécuter ces commandes sur Supabase SQL Editor

-- 1. Supprimer la table api_keys si elle existe
DROP TABLE IF EXISTS api_keys CASCADE;

-- 2. Supprimer les migrations liées aux clés API si elles existent
DO $$
BEGIN
    DELETE FROM supabase_migrations.schema_migrations 
    WHERE name LIKE '%api_keys%' OR name LIKE '%migration_api_keys%';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table supabase_migrations.schema_migrations non trouvée, continuation...';
END $$;

-- 3. Nettoyer les permissions si elles existent
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own api keys" ON api_keys;
    DROP POLICY IF EXISTS "Users can insert their own api keys" ON api_keys;
    DROP POLICY IF EXISTS "Users can update their own api keys" ON api_keys;
    DROP POLICY IF EXISTS "Users can delete their own api keys" ON api_keys;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table api_keys non trouvée pour les politiques, continuation...';
END $$;

-- 4. Supprimer les triggers liés aux clés API si ils existent
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_api_key_last_used ON api_keys;
    DROP FUNCTION IF EXISTS update_api_key_last_used();
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'Table api_keys non trouvée pour les triggers, continuation...';
END $$;

-- 5. Nettoyage final
-- Vérifier que tout est bien supprimé
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys' AND table_schema = 'public') 
        THEN 'Table api_keys existe encore' 
        ELSE 'Table api_keys supprimée avec succès' 
    END as status;

-- Message de confirmation
SELECT '✅ Nettoyage des clés API terminé avec succès' as message;
