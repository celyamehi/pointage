-- OPTION 1: Vue matérialisée (recommandée)
-- Crée une table virtuelle qui se met à jour quand vous le souhaitez

CREATE MATERIALIZED VIEW IF NOT EXISTS suivi_quotidien_agents AS
WITH 
-- Paramètres fixes (identiques au backend)
params AS (
    SELECT 
        -- Heures de référence
        '08:05:00'::time as heure_debut_matin,
        '12:00:00'::time as heure_fin_matin,
        '13:00:00'::time as heure_debut_apres_midi,
        '17:00:00'::time as heure_fin_apres_midi,
        -- Paramètres de paie
        182.18 as taux_horaire,
        8 as heures_par_jour
),

-- Générer toutes les dates (30 jours dans le passé et 30 jours dans le futur)
dates_periode AS (
    SELECT 
        (CURRENT_DATE - 30 + generate_series(0, 60))::date as date_jour
),

-- Récupérer tous les pointages pour tous les agents
pointages_agent AS (
    SELECT 
        p.*,
        EXTRACT(HOUR FROM p.heure_pointage::time) * 60 + 
        EXTRACT(MINUTE FROM p.heure_pointage::time) as heure_en_minutes
    FROM pointages p
    WHERE p.date_pointage BETWEEN (CURRENT_DATE - 30) AND (CURRENT_DATE + 30)
),

-- Organiser les pointages par date, agent et session
pointages_organises AS (
    SELECT 
        d.date_jour,
        a.id as agent_id,
        a.nom as agent_nom,
        a.email as agent_email,
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
    FROM dates_periode d
    CROSS JOIN agents a  -- Tous les agents
    LEFT JOIN pointages_agent p ON p.date_pointage = d.date_jour AND p.agent_id = a.id
    GROUP BY d.date_jour, a.id, a.nom, a.email
),

-- Calculer les retards et absences pour chaque jour et chaque agent
calculs_quotidiens AS (
    SELECT 
        d.date_jour,
        d.date_jour::text as date_str,
        d.agent_id,
        d.agent_nom,
        d.agent_email,
        TO_CHAR(d.date_jour, 'Day') as jour_semaine,
        
        -- Pointages
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
        
        -- Absences (aucun pointage pour la session)
        CASE WHEN (po.matin_arrivee IS NULL AND po.matin_sortie IS NULL) THEN true ELSE false END as absent_matin,
        CASE WHEN (po.apres_midi_arrivee IS NULL AND po.apres_midi_sortie IS NULL) THEN true ELSE false END as absent_apres_midi
        
    FROM pointages_organises d
    LEFT JOIN pointages_organises po ON po.date_jour = d.date_jour AND po.agent_id = d.agent_id, params
)

-- Résultat final avec montants
SELECT 
    cq.date_str,
    cq.agent_id,
    cq.agent_nom,
    cq.agent_email,
    cq.jour_semaine,
    
    -- Pointages
    cq.matin_arrivee,
    cq.matin_sortie,
    cq.apres_midi_arrivee,
    cq.apres_midi_sortie,
    
    -- Retards
    cq.retard_matin_minutes,
    cq.retard_apres_midi_minutes,
    cq.sortie_anticipee_matin_minutes,
    cq.sortie_anticipee_apres_midi_minutes,
    (cq.retard_matin_minutes + cq.retard_apres_midi_minutes + 
     cq.sortie_anticipee_matin_minutes + cq.sortie_anticipee_apres_midi_minutes) as retard_total_minutes,
    ROUND((cq.retard_matin_minutes + cq.retard_apres_midi_minutes + 
           cq.sortie_anticipee_matin_minutes + cq.sortie_anticipee_apres_midi_minutes)::numeric / 60, 2) as retard_total_heures,
    
    -- Absences
    cq.absent_matin,
    cq.absent_apres_midi,
    (cq.absent_matin AND cq.absent_apres_midi) as est_absent,
    
    -- Montants déduits
    CASE 
        WHEN (cq.retard_matin_minutes + cq.retard_apres_midi_minutes + 
              cq.sortie_anticipee_matin_minutes + cq.sortie_anticipee_apres_midi_minutes) > 0 
        THEN ROUND(((cq.retard_matin_minutes + cq.retard_apres_midi_minutes + 
                    cq.sortie_anticipee_matin_minutes + cq.sortie_anticipee_apres_midi_minutes)::numeric / 60) * params.taux_horaire, 2)
        ELSE 0 
    END as montant_retard,
    
    -- Montant absence par session (4h × 182,18 DA)
    CASE WHEN cq.absent_matin THEN ROUND((params.heures_par_jour / 2) * params.taux_horaire, 2) ELSE 0 END as montant_absence_matin,
    CASE WHEN cq.absent_apres_midi THEN ROUND((params.heures_par_jour / 2) * params.taux_horaire, 2) ELSE 0 END as montant_absence_apres_midi,
    
    -- Frais supplémentaires pour absence complète
    CASE WHEN (cq.absent_matin AND cq.absent_apres_midi) THEN 700 ELSE 0 END as frais_absence_complete,
    
    -- Statut
    CASE 
        WHEN (cq.absent_matin AND cq.absent_apres_midi) THEN 'Absent'
        WHEN (cq.absent_matin OR cq.absent_apres_midi) THEN 'Absence partielle'
        WHEN (cq.retard_matin_minutes + cq.retard_apres_midi_minutes + 
              cq.sortie_anticipee_matin_minutes + cq.sortie_anticipee_apres_midi_minutes) > 0 THEN 'Retard'
        ELSE 'Présent'
    END as statut,
    
    -- Montant total déduit
    ROUND((CASE 
        WHEN (cq.retard_matin_minutes + cq.retard_apres_midi_minutes + 
              cq.sortie_anticipee_matin_minutes + cq.sortie_anticipee_apres_midi_minutes) > 0 
        THEN ROUND(((cq.retard_matin_minutes + cq.retard_apres_midi_minutes + 
                    cq.sortie_anticipee_matin_minutes + cq.sortie_anticipee_apres_midi_minutes)::numeric / 60) * params.taux_horaire, 2)
        ELSE 0 
    END + 
    CASE WHEN cq.absent_matin THEN ROUND((params.heures_par_jour / 2) * params.taux_horaire, 2) ELSE 0 END + 
    CASE WHEN cq.absent_apres_midi THEN ROUND((params.heures_par_jour / 2) * params.taux_horaire, 2) ELSE 0 END + 
    CASE WHEN (cq.absent_matin AND cq.absent_apres_midi) THEN 700 ELSE 0 END), 2) as montant_total_deduit
    
FROM calculs_quotidiens cq, params;

-- Créer un index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_suivi_quotidien_agent_date ON suivi_quotidien_agents(agent_id, date_str);

-- COMMENTAIRE: Pour mettre à jour la vue matérialisée, exécutez:
-- REFRESH MATERIALIZED VIEW suivi_quotidien_agents;
