-- Requêtes simplifiées pour filtrer les absences ET retards (sans montants)
-- À utiliser après avoir créé la vue matérialisée absences_retards_simplifies_agents

-- 1. Vue d'ensemble du mois en cours (absences + retards)
SELECT 
    agent_nom,
    agent_role,
    mois_formaté,
    nombre_absences_completes,
    nombre_total_absences,
    total_retards_minutes,
    total_retards_heures,
    performance_globale,
    dates_absences_completes,
    dates_retards
FROM absences_retards_simplifies_agents 
WHERE periode = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
ORDER BY performance_globale, agent_nom;

-- 2. Top 10 des agents avec le plus de retards (minutes)
SELECT 
    agent_nom,
    agent_role,
    mois_formaté,
    total_retards_minutes,
    total_retards_heures,
    nombre_jours_avec_retards,
    moyenne_retards_minutes_par_jour_ouvre,
    performance_retards,
    dates_retards
FROM absences_retards_simplifies_agents 
WHERE periode = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
ORDER BY total_retards_minutes DESC
LIMIT 10;

-- 3. Top 10 des agents avec le plus d'absences
SELECT 
    agent_nom,
    agent_role,
    mois_formaté,
    nombre_absences_completes,
    nombre_total_absences,
    pourcentage_total_absences,
    performance_absence,
    dates_absences_completes
FROM absences_retards_simplifies_agents 
WHERE periode = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
ORDER BY nombre_total_absences DESC
LIMIT 10;

-- 4. Suivi d'un agent spécifique (absences + retards mensuels)
SELECT 
    mois_formaté,
    annee,
    mois,
    nombre_absences_completes,
    nombre_total_absences,
    total_retards_minutes,
    total_retards_heures,
    performance_globale,
    dates_absences_completes,
    dates_retards
FROM absences_retards_simplifies_agents 
WHERE agent_id = 'VOTRE_AGENT_ID'  -- Remplacer par l'ID réel
ORDER BY annee DESC, mois DESC;

-- 5. Filtrer par période personnalisée (ex: trimestre 1 2024)
SELECT 
    agent_nom,
    agent_role,
    SUM(nombre_absences_completes) as total_absences_periode,
    SUM(nombre_total_absences) as total_absences_toutes_periode,
    SUM(total_retards_minutes) as total_retards_periode_minutes,
    ROUND(SUM(total_retards_minutes)::numeric / 60, 2) as total_retards_periode_heures,
    COUNT(DISTINCT periode) as nombre_mois
FROM absences_retards_simplifies_agents 
WHERE periode BETWEEN '2024-01' AND '2024-03'
GROUP BY agent_nom, agent_role
ORDER BY total_retards_periode_minutes DESC;

-- 6. Statistiques globales mensuelles
SELECT 
    mois_formaté,
    COUNT(*) as nombre_agents,
    SUM(nombre_absences_completes) as total_absences_completes,
    SUM(nombre_total_absences) as total_general_absences,
    SUM(total_retards_minutes) as total_retards_minutes,
    ROUND(SUM(total_retards_minutes)::numeric / 60, 2) as total_retards_heures,
    ROUND(AVG(pourcentage_total_absences), 2) as moyenne_pourcentage_absences,
    ROUND(AVG(total_retards_minutes)::numeric, 2) as moyenne_retards_minutes
FROM absences_retards_simplifies_agents 
GROUP BY mois_formaté, periode
ORDER BY periode DESC;

-- 7. Agents parfaits (0 absence + 0 retard)
SELECT 
    agent_nom,
    agent_role,
    mois_formaté,
    performance_globale
FROM absences_retards_simplifies_agents 
WHERE performance_globale = 'Parfait'
AND periode = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
ORDER BY agent_nom;

-- 8. Agents à améliorer (absences + retards élevés)
SELECT 
    agent_nom,
    agent_role,
    mois_formaté,
    nombre_total_absences,
    total_retards_minutes,
    performance_globale,
    dates_absences_completes,
    dates_retards
FROM absences_retards_simplifies_agents 
WHERE performance_globale = 'À améliorer'
AND periode = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
ORDER BY total_retards_minutes DESC;

-- 9. Évolution mensuelle pour un agent (graphique)
SELECT 
    periode,
    mois_formaté,
    nombre_total_absences,
    total_retards_minutes,
    ROUND(total_retards_minutes::numeric / 60, 2) as total_retards_heures,
    performance_globale
FROM absences_retards_simplifies_agents 
WHERE agent_id = 'VOTRE_AGENT_ID'  -- Remplacer par l'ID réel
AND periode BETWEEN '2024-01' AND '2024-12'  -- Adapter la période
ORDER BY periode;

-- 10. Rapport détaillé simplifié pour export
SELECT 
    agent_nom,
    agent_email,
    agent_role,
    annee,
    mois,
    mois_formaté,
    total_jours_mois,
    jours_ouvres,
    nombre_absences_completes,
    nombre_absences_partielles,
    nombre_total_absences,
    total_retards_minutes,
    total_retards_heures,
    nombre_jours_avec_retards,
    performance_absence,
    performance_retards,
    performance_globale,
    dates_absences_completes,
    dates_retards
FROM absences_retards_simplifies_agents 
WHERE periode BETWEEN '2024-01' AND '2024-12'  -- Adapter selon besoin
ORDER BY agent_nom, annee, mois;

-- 11. Analyse par performance
SELECT 
    performance_globale,
    COUNT(*) as nombre_agents,
    ROUND(AVG(nombre_total_absences), 2) as moyenne_absences,
    ROUND(AVG(total_retards_minutes), 2) as moyenne_retards_minutes
FROM absences_retards_simplifies_agents 
WHERE periode = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
GROUP BY performance_globale
ORDER BY 
    CASE performance_globale 
        WHEN 'Parfait' THEN 1
        WHEN 'Excellent' THEN 2
        WHEN 'Très bon' THEN 3
        WHEN 'Bon' THEN 4
        WHEN 'À améliorer' THEN 5
    END;

-- 12. Comparaison mois précédent vs mois en cours
SELECT 
    agent_nom,
    agent_role,
    COALESCE(current_month.nombre_total_absences, 0) as absences_mois_en_cours,
    COALESCE(previous_month.nombre_total_absences, 0) as absences_mois_precedent,
    COALESCE(current_month.total_retards_minutes, 0) as retards_mois_en_cours,
    COALESCE(previous_month.total_retards_minutes, 0) as retards_mois_precedent
FROM agents a
LEFT JOIN absences_retards_simplifies_agents current_month ON a.id = current_month.agent_id 
    AND current_month.periode = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
LEFT JOIN absences_retards_simplifies_agents previous_month ON a.id = previous_month.agent_id 
    AND previous_month.periode = TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')
ORDER BY agent_nom;

-- 13. Résumé journalier des retards pour un mois donné
SELECT 
    agent_nom,
    dates_retards,
    retards_minutes_detail
FROM absences_retards_simplifies_agents 
WHERE periode = '2024-12'  -- Adapter le mois
AND total_retards_minutes > 0
ORDER BY agent_nom;
