import secrets
from datetime import datetime
from typing import Optional, List
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.db import get_db

# Header pour la clé API
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


def generate_api_key() -> str:
    """Génère une clé API sécurisée"""
    return f"collable_{secrets.token_urlsafe(32)}"


async def verify_api_key(api_key: str = Security(API_KEY_HEADER)) -> dict:
    """
    Vérifie la validité d'une clé API
    Retourne les informations de la clé si valide
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clé API manquante. Utilisez le header X-API-Key"
        )
    
    db = await get_db()
    
    # Rechercher la clé en clair dans la base
    result = db.table("api_keys").select("*").eq("api_key", api_key).eq("actif", True).execute()
    
    if not result.data or len(result.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clé API invalide ou désactivée"
        )
    
    key_data = result.data[0]
    
    # Mettre à jour la date de dernière utilisation
    db.table("api_keys").update({"last_used_at": datetime.now().isoformat()}).eq("id", key_data["id"]).execute()
    
    return key_data


async def create_api_key(nom: str, description: Optional[str] = None) -> dict:
    """Crée une nouvelle clé API (stockée en clair, copiable à tout moment)"""
    db = await get_db()
    
    # Générer la clé
    api_key = generate_api_key()
    
    # Créer l'entrée en base (clé stockée en clair)
    new_key = {
        "nom": nom,
        "description": description,
        "api_key": api_key,  # Clé stockée en clair
        "actif": True,
        "created_at": datetime.now().isoformat()
    }
    
    result = db.table("api_keys").insert(new_key).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création de la clé API"
        )
    
    created = result.data[0]
    return {
        "id": created["id"],
        "nom": created["nom"],
        "api_key": created["api_key"],  # Clé complète, toujours visible
        "description": created["description"],
        "actif": created["actif"],
        "created_at": created["created_at"]
    }


async def list_api_keys() -> List[dict]:
    """Liste toutes les clés API (avec les clés complètes)"""
    db = await get_db()
    result = db.table("api_keys").select("id, nom, api_key, description, actif, created_at, last_used_at").order("created_at", desc=True).execute()
    return result.data if result.data else []


async def toggle_api_key(key_id: str, actif: bool) -> dict:
    """Active ou désactive une clé API"""
    db = await get_db()
    result = db.table("api_keys").update({"actif": actif}).eq("id", key_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clé API non trouvée"
        )
    
    return result.data[0]


async def delete_api_key(key_id: str) -> bool:
    """Supprime une clé API"""
    db = await get_db()
    db.table("api_keys").delete().eq("id", key_id).execute()
    return True


async def get_all_agents_external() -> List[dict]:
    """Récupère la liste de tous les agents pour l'API externe"""
    db = await get_db()
    result = db.table("agents").select("id, nom, email, role").order("nom").execute()
    return result.data if result.data else []
