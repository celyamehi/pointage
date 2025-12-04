-- Vue matérialisée pour le suivi mensuel des absences ET retards
-- Calcule automatiquement pour chaque mois (du 1er au dernier jour)
-- Nombre de jours d'absence + minutes de retard par agent

CREATE MATERIALIZED VIEW IF NOT EXISTS absences_retards_mensuels_agents AS
WITH 
-- Paramètres fixes
params AS (
    SELECT 
        -- Heures de référence (pour calculer retards et absences)
        '08:05:00'::time as heure_debut_matin,  -- Retard à partir de 08h05
        '12:00:00'::time as heure_fin_matin,
        '13:00:00'::time as heure_debut_apres_midi,
        '17:00:00'::time as heure_fin_apres_midi,
        -- Paramètres de paie
        182.18 as taux_horaire
),

-- Générer tous les mois des 2 dernières années aux 2 prochaines années
mois_periode AS (
    SELECT 
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 years' + generate_series(0, 48) * INTERVAL '1 month')::date as debut_mois,
        (DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 years' + generate_series(0, 48) * INTERVAL '1 month') + INTERVAL '1 month' - INTERVAL '1 day')::date as fin_mois
),

-- Générer toutes les dates pour chaque mois
toutes_dates AS (
    SELECT 
        m.debut_mois,
        m.fin_mois,
        EXTRACT(YEAR FROM m.debut_mois)::integer as annee,
        EXTRACT(MONTH FROM m.debut_mois)::integer as mois,
        TO_CHAR(m.debut_mois, 'YYYY-MM') as periode,
        (m.debut_mois + generate_series(0, (m.fin_mois - m.debut_mois)))::date as date_jour
    FROM mois_periode m
),

-- Récupérer tous les pointages pour toutes les dates
pointages_agent AS (
    SELECT 
        td.date_jour,
        a.id as agent_id,
        a.nom as agent_nom,
        a.email as agent_email,
        a.role as agent_role,
        td.annee,
        td.mois,
        td.periode,
        -- Pointages du matin
        MAX(CASE WHEN p.session = 'matin' AND p.type_pointage = 'arrivee' 
                 THEN p.heure_pointage::time END) as matin_arrivee,
        MAX(CASE WHEN p.session = 'matin' AND p.type_pointage = 'sortie' 
                 THEN p.heure_pointage::time END) as matin_sortie,
        -- Pointages après-midi
        MAX(CASE WHEN p.session = 'apres-midi' AND p.type_pointage = 'arrivee' 
                 THEN p.heure_pointage::time END) as apres_midi_arrivee,
        MAX(CASE WHEN p.session = 'apres-midi' AND p.type_pointage = 'sortie' 
                 THEN p.heure_pointage::time END) as apres_midi_sortie
    FROM toutes_dates td
    CROSS JOIN agents a  -- Tous les agents
    LEFT JOIN pointages p ON p.date_pointage = td.date_jour AND p.agent_id = a.id
    GROUP BY td.date_jour, a.id, a.nom, a.email, a.role, td.annee, td.mois, td.periode
),

-- Calculer les retards et absences par jour
calculs_quotidiens AS (
    SELECT 
        td.*,
        po.matin_arrivee,
        po.matin_sortie,
        po.apres_midi_arrivee,
        po.apres_midi_sortie,
        
        -- Calcul des retards (en minutes)
        CASE 
            WHEN po.matin_arrivee > params.heure_debut_matin THEN 
                EXTRACT(HOUR FROM (po.matin_arrivee - params.heure_debut_matin)) * 60 +
                EXTRACT(MINUTE FROM (po.matin_arrivee - params.heure_debut_matin))
            ELSE 0 
        END as retard_matin_minutes,
        
        CASE 
            WHEN po.matin_sortie < params.heure_fin_matin THEN 
                EXTRACT(HOUR FROM (params.heure_fin_matin - po.matin_sortie)) * 60 +
                EXTRACT(MINUTE FROM (params.heure_fin_matin - po.matin_sortie))
            ELSE 0 
        END as sortie_anticipee_matin_minutes,
        
        CASE 
            WHEN po.apres_midi_arrivee > params.heure_debut_apres_midi THEN 
                EXTRACT(HOUR FROM (po.apres_midi_arrivee - params.heure_debut_apres_midi)) * 60 +
                EXTRACT(MINUTE FROM (po.apres_midi_arrivee - params.heure_debut_apres_midi))
            ELSE 0 
        END as retard_apres_midi_minutes,
        
        CASE 
            WHEN po.apres_midi_sortie < params.heure_fin_apres_midi THEN 
                EXTRACT(HOUR FROM (params.heure_fin_apres_midi - po.apres_midi_sortie)) * 60 +
                EXTRACT(MINUTE FROM (params.heure_fin_apres_midi - po.apres_midi_sortie))
            ELSE 0 
        END as sortie_anticipee_apres_midi_minutes,
        
        -- Total retards du jour
        (CASE WHEN po.matin_arrivee > params.heure_debut_matin THEN 
                EXTRACT(HOUR FROM (po.matin_arrivee - params.heure_debut_matin)) * 60 +
                EXTRACT(MINUTE FROM (po.matin_arrivee - params.heure_debut_matin))
            ELSE 0 END +
         CASE WHEN po.matin_sortie < params.heure_fin_matin THEN 
                EXTRACT(HOUR FROM (params.heure_fin_matin - po.matin_sortie)) * 60 +
                EXTRACT(MINUTE FROM (params.heure_fin_matin - po.matin_sortie))
            ELSE 0 END +
         CASE WHEN po.apres_midi_arrivee > params.heure_debut_apres_midi THEN 
                EXTRACT(HOUR FROM (po.apres_midi_arrivee - params.heure_debut_apres_midi)) * 60 +
                EXTRACT(MINUTE FROM (po.apres_midi_arrivee - params.heure_debut_apres_midi))
            ELSE 0 END +
         CASE WHEN po.apres_midi_sortie < params.heure_fin_apres_midi THEN 
                EXTRACT(HOUR FROM (params.heure_fin_apres_midi - po.apres_midi_sortie)) * 60 +
                EXTRACT(MINUTE FROM (params.heure_fin_apres_midi - po.apres_midi_sortie))
            ELSE 0 END) as retard_total_minutes,
        
        -- Absences (aucun pointage pour la session)
        CASE WHEN (po.matin_arrivee IS NULL AND po.matin_sortie IS NULL) THEN true ELSE false END as absent_matin,
        CASE WHEN (po.apres_midi_arrivee IS NULL AND po.apres_midi_sortie IS NULL) THEN true ELSE false END as absent_apres_midi,
        
        -- Absence complète = absent matin ET absent après-midi
        CASE WHEN (po.matin_arrivee IS NULL AND po.matin_sortie IS NULL 
                   AND po.apres_midi_arrivee IS NULL AND po.apres_midi_sortie IS NULL) THEN true ELSE false END as absent_journee_complete,
        
        -- Absence partielle = absent une seule session
        CASE WHEN ((po.matin_arrivee IS NULL AND po.matin_sortie IS NULL) XOR 
                   (po.apres_midi_arrivee IS NULL AND po.apres_midi_sortie IS NULL)) THEN true ELSE false END as absent_partiel
        
    FROM pointages_agent td
    LEFT JOIN pointages_agent po ON po.date_jour = td.date_jour AND po.agent_id = td.agent_id, params
),

-- Calculer les totaux mensuels par agent
totaux_mensuels AS (
    SELECT 
        agent_id,
        agent_nom,
        agent_email,
        agent_role,
        annee,
        mois,
        periode,
        debut_mois,
        fin_mois,
        
        -- Compteurs de jours
        COUNT(*) as total_jours_mois,
        COUNT(CASE WHEN absent_journee_complete THEN 1 END) as nombre_absences_completes,
        COUNT(CASE WHEN absent_partiel THEN 1 END) as nombre_absences_partielles,
        COUNT(CASE WHEN absent_matin OR absent_apres_midi THEN 1 END) as nombre_total_absences,
        
        -- Compteurs de retards (en minutes)
        SUM(retard_total_minutes) as total_retards_minutes,
        SUM(retard_matin_minutes) as total_retards_matin_minutes,
        SUM(retard_apres_midi_minutes) as total_retards_apres_midi_minutes,
        SUM(sortie_anticipee_matin_minutes) as total_sorties_anticipees_matin_minutes,
        SUM(sortie_anticipee_apres_midi_minutes) as total_sorties_anticipees_apres_midi_minutes,
        
        -- Retards en heures
        ROUND(SUM(retard_total_minutes)::numeric / 60, 2) as total_retards_heures,
        ROUND(SUM(retard_matin_minutes)::numeric / 60, 2) as total_retards_matin_heures,
        ROUND(SUM(retard_apres_midi_minutes)::numeric / 60, 2) as total_retards_apres_midi_heures,
        
        -- Jours avec retards
        COUNT(CASE WHEN retard_total_minutes > 0 THEN 1 END) as nombre_jours_avec_retards,
        
        -- Jours ouvrés (lundi-vendredi)
        COUNT(CASE WHEN EXTRACT(DOW FROM date_jour) NOT IN (0, 6) THEN 1 END) as jours_ouvres,
        COUNT(CASE WHEN EXTRACT(DOW FROM date_jour) NOT IN (0, 6) AND absent_journee_complete THEN 1 END) as absences_completes_jours_ouvres,
        
        -- Pourcentages
        ROUND(COUNT(CASE WHEN absent_journee_complete THEN 1 END)::numeric * 100.0 / COUNT(*), 2) as pourcentage_absences_completes,
        ROUND(COUNT(CASE WHEN absent_matin OR absent_apres_midi THEN 1 END)::numeric * 100.0 / COUNT(*), 2) as pourcentage_total_absences,
        ROUND(COUNT(CASE WHEN retard_total_minutes > 0 THEN 1 END)::numeric * 100.0 / COUNT(*), 2) as pourcentage_jours_avec_retards,
        
        -- Montants déduits
        ROUND((SUM(retard_total_minutes)::numeric / 60) * params.taux_horaire, 2) as montant_retards_deduit,
        ROUND(COUNT(CASE WHEN absent_journee_complete THEN 1 END)::numeric * 8 * params.taux_horaire, 2) as montant_absences_deduit,
        ROUND((SUM(retard_total_minutes)::numeric / 60) * params.taux_horaire + COUNT(CASE WHEN absent_journee_complete THEN 1 END)::numeric * 8 * params.taux_horaire, 2) as montant_total_deduit,
        
        -- Détail des dates
        STRING_AGG(CASE WHEN absent_journee_complete THEN TO_CHAR(date_jour, 'DD/MM') END, ', ' ORDER BY date_jour) as dates_absences_completes,
        STRING_AGG(CASE WHEN retard_total_minutes > 0 THEN TO_CHAR(date_jour, 'DD/MM') END, ', ' ORDER BY date_jour) as dates_retards,
        STRING_AGG(CASE WHEN retard_total_minutes > 0 THEN retard_total_minutes::text END, ', ' ORDER BY date_jour) as retards_minutes_detail
        
    FROM calculs_quotidiens cq
    GROUP BY agent_id, agent_nom, agent_email, agent_role, annee, mois, periode, debut_mois, fin_mois
)

-- Résultat final avec indicateurs de performance
SELECT 
    tm.*,
    -- Indicateurs de performance
    CASE 
        WHEN tm.pourcentage_total_absences = 0 THEN 'Excellent'
        WHEN tm.pourcentage_total_absences <= 5 THEN 'Très bon'
        WHEN tm.pourcentage_total_absences <= 10 THEN 'Bon'
        WHEN tm.pourcentage_total_absences <= 15 THEN 'Moyen'
        ELSE 'À améliorer'
    END as performance_absence,
    
    CASE 
        WHEN tm.total_retards_minutes = 0 THEN 'Excellent'
        WHEN tm.total_retards_minutes <= 60 THEN 'Très bon'  -- 1h max
        WHEN tm.total_retards_minutes <= 180 THEN 'Bon'     -- 3h max
        WHEN tm.total_retards_minutes <= 300 THEN 'Moyen'   -- 5h max
        ELSE 'À améliorer'
    END as performance_retards,
    
    CASE 
        WHEN tm.pourcentage_total_absences = 0 AND tm.total_retards_minutes = 0 THEN 'Parfait'
        WHEN tm.pourcentage_total_absences <= 2 AND tm.total_retards_minutes <= 30 THEN 'Excellent'
        WHEN tm.pourcentage_total_absences <= 5 AND tm.total_retards_minutes <= 60 THEN 'Très bon'
        WHEN tm.pourcentage_total_absences <= 10 AND tm.total_retards_minutes <= 120 THEN 'Bon'
        ELSE 'À améliorer'
    END as performance_globale,
    
    -- Mois formaté pour l'affichage
    TO_CHAR(tm.debut_mois, 'Month YYYY', 'fr_FR') as mois_formaté,
    
    -- Moyennes par jour ouvré
    ROUND(tm.total_retards_minutes::numeric / NULLIF(tm.jours_ouvres, 0), 2) as moyenne_retards_minutes_par_jour_ouvre,
    ROUND(tm.montant_total_deduit::numeric / NULLIF(tm.jours_ouvres, 0), 2) as moyenne_deduit_par_jour_ouvre
    
FROM totaux_mensuels tm
ORDER BY tm.annee DESC, tm.mois DESC, tm.agent_nom;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_absences_retards_agent_periode ON absences_retards_mensuels_agents(agent_id, periode);
CREATE INDEX IF NOT EXISTS idx_absences_retards_periode ON absences_retards_mensuels_agents(periode);
CREATE INDEX IF NOT EXISTS idx_absences_retards_agent_annee_mois ON absences_retards_mensuels_agents(agent_id, annee, mois);
CREATE INDEX IF NOT EXISTS idx_absences_retards_performance ON absences_retards_mensuels_agents(performance_globale);

-- COMMENTAIRE: Pour mettre à jour la vue matérialisée, exécutez:
-- REFRESH MATERIALIZED VIEW absences_retards_mensuels_agents;
