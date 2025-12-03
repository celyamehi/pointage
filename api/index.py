import sys
import os
from fastapi import FastAPI
from mangum import Mangum

# Ajouter le répertoire backend au path pour les imports
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, '..', 'backend')
sys.path.insert(0, backend_dir)

# Importer l'application FastAPI
try:
    from main import app
    # Adapter FastAPI pour AWS Lambda/Vercel
    handler = Mangum(app)
except ImportError as e:
    print(f"Erreur d'import: {e}")
    # Créer une app FastAPI minimale en cas d'erreur
    app = FastAPI()
    
    @app.get("/health")
    async def health():
        return {"status": "ok", "message": "API fonctionne"}
    
    handler = Mangum(app)
