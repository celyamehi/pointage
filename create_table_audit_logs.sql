-- ============================================
-- Table des logs d'audit pour les modifications de pointages
-- ============================================

-- Créer la table audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Qui a fait l'action
    admin_id UUID NOT NULL REFERENCES agents(id),
    admin_email TEXT NOT NULL,
    
    -- Sur quel pointage
    pointage_id UUID NOT NULL,
    agent_id UUID NOT NULL REFERENCES agents(id),
    agent_email TEXT NOT NULL,
    
    -- Type d'action
    action TEXT NOT NULL CHECK (action IN ('modification', 'suppression', 'restauration')),
    
    -- Données avant modification (JSON)
    donnees_avant JSONB,
    
    -- Données après modification (JSON) - null pour suppression
    donnees_apres JSONB,
    
    -- Justification obligatoire
    justification TEXT NOT NULL,
    
    -- Horodatage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_agent_id ON audit_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_pointage_id ON audit_logs(pointage_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Ajouter une colonne 'annule' à la table pointages pour le soft delete
ALTER TABLE pointages ADD COLUMN IF NOT EXISTS annule BOOLEAN DEFAULT FALSE;
ALTER TABLE pointages ADD COLUMN IF NOT EXISTS annule_par UUID REFERENCES agents(id);
ALTER TABLE pointages ADD COLUMN IF NOT EXISTS annule_le TIMESTAMP WITH TIME ZONE;
ALTER TABLE pointages ADD COLUMN IF NOT EXISTS motif_annulation TEXT;

-- Commentaires
COMMENT ON TABLE audit_logs IS 'Historique des modifications et suppressions de pointages par les administrateurs';
COMMENT ON COLUMN audit_logs.action IS 'Type d''action: modification, suppression (soft delete), restauration';
COMMENT ON COLUMN audit_logs.donnees_avant IS 'État du pointage avant la modification (JSON)';
COMMENT ON COLUMN audit_logs.donnees_apres IS 'État du pointage après la modification (JSON), null pour suppression';
COMMENT ON COLUMN audit_logs.justification IS 'Raison de la modification, obligatoire';

-- Activer RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Politique: seuls les admins peuvent voir les logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agents 
            WHERE agents.id = auth.uid() 
            AND agents.role = 'admin'
        )
    );

-- Politique: seuls les admins peuvent insérer des logs
CREATE POLICY "Admins can insert audit logs" ON audit_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM agents 
            WHERE agents.id = auth.uid() 
            AND agents.role = 'admin'
        )
    );

-- Pour le développement, permettre l'accès via la clé anon
-- (À supprimer en production si vous utilisez l'authentification Supabase)
CREATE POLICY "Allow all for development" ON audit_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);
