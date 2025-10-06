-- Migration pour ajouter le champ type_pointage à la table pointages
-- À exécuter dans l'interface Supabase SQL Editor

-- Ajouter la colonne type_pointage
ALTER TABLE pointages 
ADD COLUMN IF NOT EXISTS type_pointage VARCHAR(20) CHECK (type_pointage IN ('arrivee', 'sortie'));

-- Mettre à jour les pointages existants (par défaut = arrivée)
UPDATE pointages 
SET type_pointage = 'arrivee' 
WHERE type_pointage IS NULL;

-- Rendre la colonne obligatoire
ALTER TABLE pointages 
ALTER COLUMN type_pointage SET NOT NULL;

-- Ajouter un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_pointages_type ON pointages(type_pointage);

-- Commentaire pour documentation
COMMENT ON COLUMN pointages.type_pointage IS 'Type de pointage: arrivee ou sortie';
