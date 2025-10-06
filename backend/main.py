from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from datetime import datetime, timedelta
import os

# Import des modules personnalisés
from app.auth import router as auth_router
from app.qrcode import router as qrcode_router
from app.pointage import router as pointage_router
from app.admin import router as admin_router
from app.db import init_db

# Les variables d'environnement sont définies directement dans app/db.py

# Création de l'application FastAPI
app = FastAPI(
    title="Collable - Système de Pointage",
    description="API pour le système de pointage de la société Collable",
    version="1.0.0",
)

# Configuration CORS pour permettre les requêtes du frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À remplacer par l'URL du frontend en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation de la base de données au démarrage
@app.on_event("startup")
async def startup_db_client():
    await init_db()

# Inclusion des routers
app.include_router(auth_router.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(qrcode_router.router, prefix="/api/qrcode", tags=["QR Code"])
app.include_router(pointage_router.router, prefix="/api/pointage", tags=["Pointage"])
app.include_router(admin_router.router, prefix="/api/admin", tags=["Administration"])

# Route racine
@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Bienvenue sur l'API du système de pointage Collable"}

# Montage des fichiers statiques (si nécessaire)
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
