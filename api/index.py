from fastapi import FastAPI
from mangum import Mangum

# Créer une app FastAPI minimale pour Vercel
app = FastAPI(title="Pointage API", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "API Pointage fonctionne"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": "2024"}

@app.get("/api/health")
async def api_health():
    return {"status": "healthy", "timestamp": "2024"}

# Adapter FastAPI pour Vercel
handler = Mangum(app)
