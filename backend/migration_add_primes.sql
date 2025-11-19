-- Migration pour ajouter la table des primes

-- Table des primes
CREATE TABLE IF NOT EXISTS primes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    montant DECIMAL(12, 2) NOT NULL,
    motif TEXT NOT NULL,
    mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
    annee INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES agents(id),
    CONSTRAINT unique_prime UNIQUE (agent_id, motif, mois, annee)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_primes_agent_id ON primes(agent_id);
CREATE INDEX IF NOT EXISTS idx_primes_mois_annee ON primes(mois, annee);

-- Désactiver RLS temporairement pour permettre l'accès via l'API
-- L'authentification est gérée par FastAPI avec JWT
ALTER TABLE primes DISABLE ROW LEVEL SECURITY;

-- Commentaires
COMMENT ON TABLE primes IS 'Table des primes attribuées aux agents';
COMMENT ON COLUMN primes.agent_id IS 'ID de l''agent qui reçoit la prime';
COMMENT ON COLUMN primes.montant IS 'Montant de la prime en DA';
COMMENT ON COLUMN primes.motif IS 'Raison de l''attribution de la prime';
COMMENT ON COLUMN primes.mois IS 'Mois de la prime (1-12)';
COMMENT ON COLUMN primes.annee IS 'Année de la prime';
COMMENT ON COLUMN primes.created_by IS 'ID de l''admin qui a créé la prime';
