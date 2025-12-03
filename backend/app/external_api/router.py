from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from datetime import datetime
import logging

from app.auth.utils import get_admin_user
from app.auth.models import User
from app.external_api.models import (
    ApiKeyCreate, 
    ApiKeyResponse, 
    ApiKeyListResponse,
    AgentExterne,
    AttendanceResponse,
    HealthResponse
)
from app.external_api.utils import (
    verify_api_key,
    create_api_key,
    list_api_keys,
    toggle_api_key,
    delete_api_key,
    get_all_agents_external,
    get_agent_attendance
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================
# ENDPOINTS PUBLICS (avec clé API)
# ============================================

@router.get("/health", response_model=HealthResponse, tags=["API Externe"])
async def health_check():
    """
    🔌 Test de connexion à l'API
    Aucune authentification requise
    """
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


@router.get("/agents", response_model=List[AgentExterne], tags=["API Externe"])
async def get_agents(api_key_data: dict = Depends(verify_api_key)):
    """
    🔌 Liste de tous les agents
    Requiert une clé API valide dans le header X-API-Key
    """
    try:
        logger.info(f"API externe - Liste agents demandée par: {api_key_data['nom']}")
        agents = await get_all_agents_external()
        return agents
    except Exception as e:
        logger.error(f"Erreur API externe agents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/attendance/{agent_id}", response_model=AttendanceResponse, tags=["API Externe"])
async def get_attendance(
    agent_id: str,
    mois: str = Query(..., description="Mois au format YYYY-MM (ex: 2024-12)"),
    api_key_data: dict = Depends(verify_api_key)
):
    """
    🔌 Données de présence d'un agent pour un mois donné
    
    - **agent_id**: ID de l'agent
    - **mois**: Mois au format YYYY-MM (ex: 2024-12)
    
    Retourne:
    - Résumé: jours travaillés, absences, retards totaux
    - Détails jour par jour: présence, retards matin/après-midi
    
    Requiert une clé API valide dans le header X-API-Key
    """
    try:
        logger.info(f"API externe - Attendance demandée pour agent {agent_id}, mois {mois} par: {api_key_data['nom']}")
        attendance = await get_agent_attendance(agent_id, mois)
        return attendance
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur API externe attendance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ENDPOINTS ADMIN (gestion des clés API)
# ============================================

@router.post("/keys", response_model=ApiKeyResponse, tags=["Gestion Clés API"])
async def create_new_api_key(
    key_data: ApiKeyCreate,
    current_user: User = Depends(get_admin_user)
):
    """
    🔑 Créer une nouvelle clé API (admin uniquement)
    
    ⚠️ IMPORTANT: La clé API complète n'est affichée qu'une seule fois lors de la création.
    Copiez-la immédiatement car elle ne sera plus visible ensuite.
    """
    try:
        logger.info(f"Création clé API '{key_data.nom}' par {current_user.email}")
        new_key = await create_api_key(key_data.nom, key_data.description)
        return new_key
    except Exception as e:
        logger.error(f"Erreur création clé API: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/keys", response_model=List[ApiKeyListResponse], tags=["Gestion Clés API"])
async def get_all_api_keys(current_user: User = Depends(get_admin_user)):
    """
    🔑 Liste toutes les clés API (admin uniquement)
    Les clés complètes ne sont pas affichées, seulement un aperçu.
    """
    try:
        keys = await list_api_keys()
        return keys
    except Exception as e:
        logger.error(f"Erreur liste clés API: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/keys/{key_id}/toggle", tags=["Gestion Clés API"])
async def toggle_key_status(
    key_id: str,
    actif: bool = Query(..., description="Activer (true) ou désactiver (false) la clé"),
    current_user: User = Depends(get_admin_user)
):
    """
    🔑 Activer ou désactiver une clé API (admin uniquement)
    """
    try:
        logger.info(f"Toggle clé API {key_id} -> actif={actif} par {current_user.email}")
        updated = await toggle_api_key(key_id, actif)
        return {"message": f"Clé API {'activée' if actif else 'désactivée'}", "key": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur toggle clé API: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/keys/{key_id}", tags=["Gestion Clés API"])
async def remove_api_key(
    key_id: str,
    current_user: User = Depends(get_admin_user)
):
    """
    🔑 Supprimer une clé API (admin uniquement)
    """
    try:
        logger.info(f"Suppression clé API {key_id} par {current_user.email}")
        await delete_api_key(key_id)
        return {"message": "Clé API supprimée avec succès"}
    except Exception as e:
        logger.error(f"Erreur suppression clé API: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
