import asyncio
import os
from supabase import create_client

# Import des variables d'environnement depuis app/db.py
from app.db import SUPABASE_URL, SUPABASE_KEY

async def fix_agent_etudiant_role():
    """Ajoute le rôle agent_etudiant à la contrainte CHECK"""
    
    print("Connexion à Supabase...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # SQL pour mettre à jour la contrainte
    sql = """
    ALTER TABLE agents 
    DROP CONSTRAINT IF EXISTS agents_role_check;
    
    ALTER TABLE agents 
    ADD CONSTRAINT agents_role_check 
    CHECK (role IN ('admin', 'agent', 'agent_etudiant', 'informaticien', 'analyste_informaticienne', 'superviseur', 'agent_administratif', 'charge_administration'));
    """
    
    try:
        print("Exécution de la migration pour ajouter le rôle agent_etudiant...")
        result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        print("✅ Migration réussie ! Le rôle agent_etudiant est maintenant disponible.")
        
    except Exception as e:
        print(f"❌ Erreur lors de la migration: {str(e)}")
        # Alternative: essayer avec SQL direct via REST API
        try:
            print("Tentative alternative avec SQL direct...")
            response = supabase.table('_sql').insert({'query': sql}).execute()
            print("✅ Migration réussie via méthode alternative !")
        except Exception as e2:
            print(f"❌ Erreur avec la méthode alternative: {str(e2)}")

if __name__ == "__main__":
    asyncio.run(fix_agent_etudiant_role())
