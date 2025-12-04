-- Requête SQL pour récupérer les retards et absences par jour depuis Supabase
-- Reproduit la logique du backend /me/suivi

-- Paramètres à adapter:
-- agent_id: ID de l'agent (remplacer 'VOTRE_AGENT_ID')
-- start_date: Date de début (remplacer '2024-12-01')
-- end_date: Date de fin (remplacer '2024-12-31')

WITH 
-- Paramètres (à adapter selon vos besoins)
params AS (
    SELECT 
        'VOTRE_AGENT_ID' as agent_id,
        '2024-12-01'::date as start_date,
        '2024-12-31'::date as end_date,
        -- Heures de référence (identiques au backend)
        '08:05:00'::time as heure_debut_matin,
        '12:00:00'::time as heure_fin_matin,
        '13:00:00'::time as heure_debut_apres_midi,
        '17:00:00'::time as heure_fin_apres_midi,
        -- Paramètres de paie
        182.18 as taux_horaire,
        8 as heures_par_jour
),

-- Générer toutes les dates de la période
dates_periode AS (
    SELECT 
        (params.start_date + generate_series(0, params.end_date - params.start_date))::date as date_jour
    FROM params
),

-- Récupérer tous les pointages de l'agent pour la période
pointages_agent AS (
    SELECT 
        p.*,
        EXTRACT(HOUR FROM p.heure_pointage::time) * 60 + 
        EXTRACT(MINUTE FROM p.heure_pointage::time) as heure_en_minutes
    FROM pointages p, params
    WHERE p.agent_id = params.agent_id
    AND p.date_pointage BETWEEN params.start_date AND params.end_date
),

-- Organiser les pointages par date et session
pointages_organises AS (
    SELECT 
        d.date_jour,
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
    LEFT JOIN pointages_agent p ON p.date_pointage = d.date_jour
    GROUP BY d.date_jour
),

-- Calculer les retards et absences pour chaque jour
calculs_quotidiens AS (
    SELECT 
        d.date_jour,
        d.date_jour::text as date_str,
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
        
    FROM dates_periode d
    LEFT JOIN pointages_organises po ON po.date_jour = d.date_jour, params
),

-- Calcul final avec montants
resultat_final AS (
    SELECT 
        cq.date_str,
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
        END as statut
        
    FROM calculs_quotidiens cq, params
)

-- Résultat final avec montant total déduit
SELECT 
    rf.*,
    ROUND((rf.montant_retard + rf.montant_absence_matin + rf.montant_absence_apres_midi + rf.frais_absence_complete), 2) as montant_total_deduit,
    -- Totaux cumulés
    SUM(rf.retard_total_minutes) OVER () as total_retards_minutes,
    SUM(CASE WHEN rf.est_absent THEN 1 ELSE 0 END) OVER () as total_absences,
    SUM(rf.montant_retard + rf.montant_absence_matin + rf.montant_absence_apres_midi + rf.frais_absence_complete) OVER () as montant_total_deduit_cumule
FROM resultat_final rf
ORDER BY rf.date_str;

-- Pour utiliser cette requête:
-- 1. Remplacez 'VOTRE_AGENT_ID' par l'ID réel de l'agent
-- 2. Adaptez les dates start_date et end_date selon la période souhaitée
-- 3. Exécutez dans Supabase SQL Editor
