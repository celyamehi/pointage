-- Migration pour ajouter le rôle agent_etudiant
-- Mettre à jour la contrainte CHECK sur la colonne role de la table agents

ALTER TABLE agents 
DROP CONSTRAINT IF EXISTS agents_role_check;

ALTER TABLE agents 
ADD CONSTRAINT agents_role_check 
CHECK (role IN ('admin', 'agent', 'agent_etudiant', 'informaticien', 'analyste_informaticienne', 'superviseur', 'agent_administratif', 'charge_administration'));
