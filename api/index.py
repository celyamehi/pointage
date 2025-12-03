import sys
import os
from fastapi import FastAPI
from mangum import Mangum

# Ajouter le répertoire backend au path pour les imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Importer l'application FastAPI
from main import app

# Adapter FastAPI pour AWS Lambda/Vercel
handler = Mangum(app)
