import sys
import os

# Ajouter le répertoire backend au path pour les imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Importer l'application FastAPI
from main import app

# Exporter l'application pour Vercel
handler = app
