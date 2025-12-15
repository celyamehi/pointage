-- ============================================
-- Table des jours fériés
-- ============================================

-- Créer la table jours_feries
CREATE TABLE IF NOT EXISTS jours_feries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Date du jour férié
    date_ferie DATE NOT NULL,
    
    -- Nom du jour férié
    nom TEXT NOT NULL,
    
    -- Description optionnelle
    description TEXT,
    
    -- Type: 'legal' (jour férié légal français) ou 'custom' (ajouté par admin)
    type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('legal', 'custom')),
    
    -- Année concernée (pour les jours fériés récurrents)
    annee INTEGER NOT NULL,
    
    -- Si c'est un jour férié récurrent (se répète chaque année)
    recurrent BOOLEAN DEFAULT FALSE,
    
    -- Qui a créé ce jour férié (null pour les jours légaux pré-remplis)
    created_by UUID REFERENCES agents(id),
    
    -- Horodatage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité sur la date
    UNIQUE(date_ferie)
);

-- Index pour les recherches par date et année
CREATE INDEX IF NOT EXISTS idx_jours_feries_date ON jours_feries(date_ferie);
CREATE INDEX IF NOT EXISTS idx_jours_feries_annee ON jours_feries(annee);

-- ============================================
-- Insérer les jours fériés français pour 2024
-- ============================================
INSERT INTO jours_feries (date_ferie, nom, description, type, annee, recurrent) VALUES
-- 2024
('2024-01-01', 'Jour de l''An', 'Premier jour de l''année', 'legal', 2024, true),
('2024-04-01', 'Lundi de Pâques', 'Lendemain de Pâques', 'legal', 2024, false),
('2024-05-01', 'Fête du Travail', 'Journée internationale des travailleurs', 'legal', 2024, true),
('2024-05-08', 'Victoire 1945', 'Fin de la Seconde Guerre mondiale en Europe', 'legal', 2024, true),
('2024-05-09', 'Ascension', 'Jeudi de l''Ascension', 'legal', 2024, false),
('2024-05-20', 'Lundi de Pentecôte', 'Lendemain de la Pentecôte', 'legal', 2024, false),
('2024-07-14', 'Fête Nationale', 'Prise de la Bastille', 'legal', 2024, true),
('2024-08-15', 'Assomption', 'Assomption de Marie', 'legal', 2024, true),
('2024-11-01', 'Toussaint', 'Fête de tous les saints', 'legal', 2024, true),
('2024-11-11', 'Armistice 1918', 'Fin de la Première Guerre mondiale', 'legal', 2024, true),
('2024-12-25', 'Noël', 'Naissance de Jésus-Christ', 'legal', 2024, true)
ON CONFLICT (date_ferie) DO NOTHING;

-- ============================================
-- Insérer les jours fériés français pour 2025
-- ============================================
INSERT INTO jours_feries (date_ferie, nom, description, type, annee, recurrent) VALUES
-- 2025
('2025-01-01', 'Jour de l''An', 'Premier jour de l''année', 'legal', 2025, true),
('2025-04-21', 'Lundi de Pâques', 'Lendemain de Pâques', 'legal', 2025, false),
('2025-05-01', 'Fête du Travail', 'Journée internationale des travailleurs', 'legal', 2025, true),
('2025-05-08', 'Victoire 1945', 'Fin de la Seconde Guerre mondiale en Europe', 'legal', 2025, true),
('2025-05-29', 'Ascension', 'Jeudi de l''Ascension', 'legal', 2025, false),
('2025-06-09', 'Lundi de Pentecôte', 'Lendemain de la Pentecôte', 'legal', 2025, false),
('2025-07-14', 'Fête Nationale', 'Prise de la Bastille', 'legal', 2025, true),
('2025-08-15', 'Assomption', 'Assomption de Marie', 'legal', 2025, true),
('2025-11-01', 'Toussaint', 'Fête de tous les saints', 'legal', 2025, true),
('2025-11-11', 'Armistice 1918', 'Fin de la Première Guerre mondiale', 'legal', 2025, true),
('2025-12-25', 'Noël', 'Naissance de Jésus-Christ', 'legal', 2025, true)
ON CONFLICT (date_ferie) DO NOTHING;

-- ============================================
-- Insérer les jours fériés français pour 2026
-- ============================================
INSERT INTO jours_feries (date_ferie, nom, description, type, annee, recurrent) VALUES
-- 2026
('2026-01-01', 'Jour de l''An', 'Premier jour de l''année', 'legal', 2026, true),
('2026-04-06', 'Lundi de Pâques', 'Lendemain de Pâques', 'legal', 2026, false),
('2026-05-01', 'Fête du Travail', 'Journée internationale des travailleurs', 'legal', 2026, true),
('2026-05-08', 'Victoire 1945', 'Fin de la Seconde Guerre mondiale en Europe', 'legal', 2026, true),
('2026-05-14', 'Ascension', 'Jeudi de l''Ascension', 'legal', 2026, false),
('2026-05-25', 'Lundi de Pentecôte', 'Lendemain de la Pentecôte', 'legal', 2026, false),
('2026-07-14', 'Fête Nationale', 'Prise de la Bastille', 'legal', 2026, true),
('2026-08-15', 'Assomption', 'Assomption de Marie', 'legal', 2026, true),
('2026-11-01', 'Toussaint', 'Fête de tous les saints', 'legal', 2026, true),
('2026-11-11', 'Armistice 1918', 'Fin de la Première Guerre mondiale', 'legal', 2026, true),
('2026-12-25', 'Noël', 'Naissance de Jésus-Christ', 'legal', 2026, true)
ON CONFLICT (date_ferie) DO NOTHING;

-- ============================================
-- Table des exceptions (agents qui travaillent un jour férié)
-- ============================================
CREATE TABLE IF NOT EXISTS jours_feries_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Référence au jour férié
    jour_ferie_id UUID NOT NULL REFERENCES jours_feries(id) ON DELETE CASCADE,
    
    -- Référence à l'agent qui travaille ce jour
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    
    -- Raison de l'exception
    motif TEXT,
    
    -- Qui a créé cette exception
    created_by UUID REFERENCES agents(id),
    
    -- Horodatage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité : un agent ne peut avoir qu'une exception par jour férié
    UNIQUE(jour_ferie_id, agent_id)
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_jours_feries_exceptions_jour ON jours_feries_exceptions(jour_ferie_id);
CREATE INDEX IF NOT EXISTS idx_jours_feries_exceptions_agent ON jours_feries_exceptions(agent_id);

-- ============================================
-- Commentaires
-- ============================================
COMMENT ON TABLE jours_feries IS 'Table des jours fériés français et personnalisés';
COMMENT ON COLUMN jours_feries.type IS 'legal = jour férié légal français, custom = ajouté par admin';
COMMENT ON COLUMN jours_feries.recurrent IS 'true si le jour férié tombe à la même date chaque année (ex: 1er janvier, 14 juillet)';
COMMENT ON TABLE jours_feries_exceptions IS 'Agents qui travaillent exceptionnellement un jour férié';
