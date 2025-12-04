-- Fonction pour rafraîchir automatiquement la vue matérialisée
CREATE OR REPLACE FUNCTION refresh_suivi_quotidien()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY suivi_quotidien_agents;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour rafraîchir automatiquement après insertion/modification dans pointages
CREATE OR REPLACE FUNCTION trigger_refresh_suivi()
RETURNS trigger AS $$
BEGIN
    -- Rafraîchir la vue matérialisée en arrière-plan
    PERFORM pg_notify('refresh_suivi', 'pointages_updated');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table pointages
DROP TRIGGER IF EXISTS trigger_refresh_suivi ON pointages;
CREATE TRIGGER trigger_refresh_suivi
    AFTER INSERT OR UPDATE OR DELETE ON pointages
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_suivi();

-- Requêtes pour utiliser la table:
-- 1. Pour voir les données d'un agent spécifique:
-- SELECT * FROM suivi_quotidien_agents WHERE agent_id = 'VOTRE_AGENT_ID' ORDER BY date_str DESC;

-- 2. Pour voir les données d'une période spécifique:
-- SELECT * FROM suivi_quotidien_agents 
-- WHERE agent_id = 'VOTRE_AGENT_ID' 
-- AND date_str BETWEEN '2024-12-01' AND '2024-12-31' 
-- ORDER BY date_str;

-- 3. Pour voir les totaux par agent sur une période:
-- SELECT 
--     agent_id, 
--     agent_nom,
--     COUNT(*) as jours_total,
--     SUM(retard_total_minutes) as total_retards_minutes,
--     SUM(CASE WHEN est_absent THEN 1 ELSE 0 END) as total_absences,
--     SUM(montant_total_deduit) as montant_total_deduit
-- FROM suivi_quotidien_agents 
-- WHERE date_str BETWEEN '2024-12-01' AND '2024-12-31'
-- GROUP BY agent_id, agent_nom
-- ORDER BY montant_total_deduit DESC;

-- 4. Pour rafraîchir manuellement la vue:
-- SELECT refresh_suivi_quotidien();
