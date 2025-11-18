from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
import logging

from app.auth.models import User
from app.auth.utils import get_admin_user
from app.paie.models import CalculPaie
from app.paie.utils import calculer_paie_agent, calculer_paies_tous_agents

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/calcul/{agent_id}", response_model=CalculPaie)
async def get_paie_agent(
    agent_id: str,
    mois: int = Query(..., ge=1, le=12, description="Mois (1-12)"),
    annee: int = Query(..., ge=2020, le=2100, description="Année"),
    current_user: User = Depends(get_admin_user)
):
    """
    Calcule la paie d'un agent spécifique pour un mois donné
    Accessible uniquement aux administrateurs
    """
    try:
        logger.info(f"Calcul de paie pour l'agent {agent_id} - {mois}/{annee}")
        paie = await calculer_paie_agent(agent_id, mois, annee)
        return paie
    except ValueError as e:
        logger.error(f"Erreur de validation: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Erreur lors du calcul de paie: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul de paie: {str(e)}")


@router.get("/calcul-tous", response_model=List[CalculPaie])
async def get_paies_tous_agents(
    mois: int = Query(..., ge=1, le=12, description="Mois (1-12)"),
    annee: int = Query(..., ge=2020, le=2100, description="Année"),
    current_user: User = Depends(get_admin_user)
):
    """
    Calcule les paies de tous les agents pour un mois donné
    Accessible uniquement aux administrateurs
    """
    try:
        logger.info(f"Calcul des paies pour tous les agents - {mois}/{annee}")
        paies = await calculer_paies_tous_agents(mois, annee)
        return paies
    except Exception as e:
        logger.error(f"Erreur lors du calcul des paies: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul des paies: {str(e)}")
