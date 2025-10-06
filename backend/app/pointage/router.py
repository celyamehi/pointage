from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import date, timedelta

from app.auth.utils import get_current_active_user
from app.auth.models import User
from app.pointage.models import PointageCreate, PointageResponse, PointageJour
from app.pointage.utils import create_pointage, format_pointages_by_date

router = APIRouter()


@router.post("/", response_model=PointageResponse)
async def enregistrer_pointage(pointage: PointageCreate, current_user: User = Depends(get_current_active_user)):
    """
    Endpoint pour enregistrer un pointage
    """
    # Vérifier que l'agent pointe pour lui-même
    if str(current_user.id) != str(pointage.agent_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez pointer que pour vous-même"
        )
    
    try:
        pointage_data = await create_pointage(str(pointage.agent_id), pointage.qrcode)
        return {
            "message": f"Pointage enregistré avec succès pour la session {pointage_data['session']}",
            "pointage": pointage_data
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'enregistrement du pointage: {str(e)}"
        )


@router.get("/me", response_model=List[PointageJour])
async def mes_pointages(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """
    Endpoint pour récupérer les pointages de l'utilisateur connecté
    """
    # Si pas de dates spécifiées, utiliser la semaine en cours
    if not start_date:
        today = date.today()
        start_date = today - timedelta(days=today.weekday())  # Lundi de la semaine en cours
    
    if not end_date:
        end_date = start_date + timedelta(days=6)  # Dimanche de la semaine en cours
    
    try:
        pointages = await format_pointages_by_date(str(current_user.id), start_date, end_date)
        return pointages
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des pointages: {str(e)}"
        )
