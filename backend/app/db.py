import os
from supabase import create_client, Client
from typing import Optional

# Configuration Supabase directement dans le code
# Ne pas faire cela en production, c'est juste pour résoudre le problème actuel
SUPABASE_URL = "https://abzdvelerwidssigszrq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiemR2ZWxlcndpZHNzaWdzenJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTgwMTUsImV4cCI6MjA3NTI3NDAxNX0.0R848NnMMkaQVsnuy35Et-1si7gAqtLn8W68YEv9gI0"

# Définir les variables d'environnement pour les autres modules
os.environ["SUPABASE_URL"] = SUPABASE_URL
os.environ["SUPABASE_ANON_KEY"] = SUPABASE_KEY

# Afficher les variables pour le débogage
print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"SUPABASE_KEY: {SUPABASE_KEY[:10]}...")

# Client Supabase global
supabase: Optional[Client] = None

async def init_db() -> Client:
    """
    Initialise la connexion à la base de données Supabase
    """
    global supabase
    if supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Les variables d'environnement SUPABASE_URL et SUPABASE_KEY doivent être définies")
        
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Vérification de la connexion
        try:
            # Test de la connexion avec une requête simple
            supabase.table('agents').select('id').limit(1).execute()
            print("Connexion à Supabase établie avec succès")
        except Exception as e:
            print(f"Erreur lors de la connexion à Supabase: {e}")
            raise
    
    return supabase

async def get_db() -> Client:
    """
    Retourne le client Supabase pour les opérations de base de données
    """
    if supabase is None:
        return await init_db()
    return supabase

# Scripts de création des tables (à exécuter manuellement dans Supabase)
CREATION_TABLES_SQL = """
-- Table des agents
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'agent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des pointages
CREATE TABLE pointages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    date_pointage DATE NOT NULL DEFAULT CURRENT_DATE,
    heure_pointage TIME NOT NULL DEFAULT CURRENT_TIME,
    session VARCHAR(50) NOT NULL CHECK (session IN ('matin', 'apres-midi')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des QR codes
CREATE TABLE qrcodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_unique VARCHAR(255) UNIQUE NOT NULL,
    date_generation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actif BOOLEAN DEFAULT TRUE
);

-- Index pour accélérer les requêtes
CREATE INDEX idx_pointages_agent_id ON pointages(agent_id);
CREATE INDEX idx_pointages_date ON pointages(date_pointage);
CREATE INDEX idx_qrcodes_actif ON qrcodes(actif);
"""
