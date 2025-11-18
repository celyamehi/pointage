-- Migration pour ajouter les nouveaux rôles dans la base de données
-- À exécuter dans l'interface Supabase SQL Editor

-- Mettre à jour la contrainte CHECK sur la colonne role de la table agents
-- Pour supprimer l'ancienne contrainte et en ajouter une nouvelle avec tous les rôles

-- D'abord, supprimer l'ancienne contrainte si elle existe
ALTER TABLE agents 
DROP CONSTRAINT IF EXISTS agents_role_check;

-- Ensuite, ajouter la nouvelle contrainte avec tous les rôles acceptés
ALTER TABLE agents 
ADD CONSTRAINT agents_role_check 
CHECK (role IN ('admin', 'agent', 'informaticien', 'analyste_informaticienne', 'superviseur', 'agent_administratif', 'charge_administration'));

-- Vérifier que la contrainte a bien été ajoutée
SELECT conname, pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conrelid = 'agents'::regclass 
AND conname = 'agents_role_check';

-- Afficher les rôles actuellement utilisés dans la base
SELECT DISTINCT role, COUNT(*) as nombre_agents 
FROM agents 
GROUP BY role 
ORDER BY role;
