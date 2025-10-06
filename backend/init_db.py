import asyncio
import os
import uuid
from supabase import create_client
from passlib.context import CryptContext

# Import des variables d'environnement depuis app/db.py
from app.db import SUPABASE_URL, SUPABASE_KEY

# Configuration de la sécurité des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Données de l'administrateur par défaut
DEFAULT_ADMIN = {
    "nom": "Administrateur",
    "email": "admin@collable.fr",
    "password": "admin123",  # À changer en production
    "role": "admin"
}

# Scripts SQL pour créer les tables
CREATE_TABLES_SQL = """
-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des agents
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'agent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des pointages
CREATE TABLE IF NOT EXISTS pointages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    date_pointage DATE NOT NULL DEFAULT CURRENT_DATE,
    heure_pointage TIME NOT NULL DEFAULT CURRENT_TIME,
    session VARCHAR(50) NOT NULL CHECK (session IN ('matin', 'apres-midi')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des QR codes
CREATE TABLE IF NOT EXISTS qrcodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code_unique VARCHAR(255) UNIQUE NOT NULL,
    date_generation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actif BOOLEAN DEFAULT TRUE
);

-- Index pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS idx_pointages_agent_id ON pointages(agent_id);
CREATE INDEX IF NOT EXISTS idx_pointages_date ON pointages(date_pointage);
CREATE INDEX IF NOT EXISTS idx_qrcodes_actif ON qrcodes(actif);
"""


async def init_database():
    """
    Initialise la base de données et crée un administrateur par défaut
    """
    print("Initialisation de la base de données...")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Erreur: Les variables d'environnement SUPABASE_URL et SUPABASE_KEY doivent être définies")
        return
    
    try:
        # Connexion à Supabase
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Exécution des scripts SQL pour créer les tables
        # Note: Cette partie est commentée car Supabase ne permet pas d'exécuter du SQL directement via l'API
        # Il faudra exécuter ces scripts manuellement dans l'interface Supabase
        print("Pour créer les tables, veuillez exécuter le script SQL suivant dans l'interface Supabase:")
        print(CREATE_TABLES_SQL)
        
        # Vérification si l'administrateur existe déjà
        response = supabase.table("agents").select("*").eq("email", DEFAULT_ADMIN["email"]).execute()
        
        if not response.data or len(response.data) == 0:
            # Création de l'administrateur par défaut
            hashed_password = pwd_context.hash(DEFAULT_ADMIN["password"])
            
            admin_data = {
                "id": str(uuid.uuid4()),
                "nom": DEFAULT_ADMIN["nom"],
                "email": DEFAULT_ADMIN["email"],
                "password_hash": hashed_password,
                "role": DEFAULT_ADMIN["role"]
            }
            
            result = supabase.table("agents").insert(admin_data).execute()
            
            if result.data and len(result.data) > 0:
                print(f"Administrateur créé avec succès: {DEFAULT_ADMIN['email']}")
            else:
                print("Erreur lors de la création de l'administrateur")
        else:
            print(f"L'administrateur {DEFAULT_ADMIN['email']} existe déjà")
        
        print("Initialisation terminée")
        
    except Exception as e:
        print(f"Erreur lors de l'initialisation de la base de données: {e}")


if __name__ == "__main__":
    asyncio.run(init_database())
