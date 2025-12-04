-- Requêtes pour filtrer les absences par période
-- À utiliser après avoir créé la vue matérialisée absences_mensuelles_agents

-- 1. Voir les absences du mois en cours pour tous les agents
SELECT 
    agent_nom,
    agent_role,
    mois_formaté,
    nombre_absences_completes,
    nombre_absences_partielles,
    nombre_total_absences,
    pourcentage_total_absences,
    performance_absence,
    dates_absences_completes
FROM absences_mensuelles_agents 
WHERE periode = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
ORDER BY nombre_total_absences DESC;

-- 2. Voir les absences d'un agent spécifique pour tous les mois
SELECT 
    mois_formaté,
    annee,
    mois,
    nombre_absences_completes,
    nombre_absences_partielles,
    nombre_total_absences,
    pourcentage_total_absences,
    performance_absence,
    dates_absences_completes,
    dates_absences_partielles
FROM absences_mensuelles_agents 
WHERE agent_id = 'VOTRE_AGENT_ID'  -- Remplacer par l'ID réel
ORDER BY annee DESC, mois DESC;

-- 3. Filtrer par période personnalisée (ex: janvier à mars 2024)
SELECT 
    agent_nom,
    agent_role,
    mois_formaté,
    nombre_absences_completes,
    nombre_absences_partielles,
    nombre_total_absences,
    pourcentage_total_absences,
    performance_absence
FROM absences_mensuelles_agents 
WHERE periode BETWEEN '2024-01' AND '2024-03'
ORDER BY agent_nom, periode;

-- 4. Statistiques globales par mois
SELECT 
    mois_formaté,
    COUNT(*) as nombre_agents,
    SUM(nombre_absences_completes) as total_absences_completes,
    SUM(nombre_absences_partielles) as total_absences_partielles,
    SUM(nombre_total_absences) as total_general_absences,
    ROUND(AVG(pourcentage_total_absences), 2) as moyenne_pourcentage_absences
FROM absences_mensuelles_agents 
GROUP BY mois_formaté, periode
ORDER BY periode DESC;

-- 5. Top 10 des agents avec le plus d'absences (période personnalisable)
SELECT 
    agent_nom,
    agent_role,
    SUM(nombre_total_absences) as total_absences_periode,
    ROUND(AVG(pourcentage_total_absences), 2) as moyenne_pourcentage,
    COUNT(DISTINCT periode) as nombre_mois
FROM absences_mensuelles_agents 
WHERE periode BETWEEN '2024-01' AND '2024-12'  -- Adapter la période
GROUP BY agent_nom, agent_role
ORDER BY total_absences_periode DESC
LIMIT 10;

-- 6. Agents sans absence pour une période
SELECT 
    agent_nom,
    agent_role,
    COUNT(*) as mois_travailles
FROM absences_mensuelles_agents 
WHERE periode BETWEEN '2024-01' AND '2024-12'  -- Adapter la période
AND nombre_total_absences = 0
GROUP BY agent_nom, agent_role
ORDER BY mois_travailles DESC;

-- 7. Évolution mensuelle pour un agent (graphique)
SELECT 
    periode,
    mois_formaté,
    nombre_total_absences,
    pourcentage_total_absences,
    performance_absence
FROM absences_mensuelles_agents 
WHERE agent_id = 'VOTRE_AGENT_ID'  -- Remplacer par l'ID réel
AND periode BETWEEN '2024-01' AND '2024-12'  -- Adapter la période
ORDER BY periode;

-- 8. Rapport détaillé pour export Excel
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
    pourcentage_total_absences,
    absences_completes_jours_ouvres,
    performance_absence,
    dates_absences_completes,
    dates_absences_partielles
FROM absences_mensuelles_agents 
WHERE periode BETWEEN '2024-01' AND '2024-12'  -- Adapter selon besoin
ORDER BY agent_nom, annee, mois;
