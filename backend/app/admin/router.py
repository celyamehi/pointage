from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import date

from app.auth.utils import get_admin_user
from app.auth.models import User
from app.admin.models import DashboardStats, ExportParams, AgentPointageFilters
from app.admin.utils import get_dashboard_stats, get_agents_with_pointages, export_pointages, get_all_agents

router = APIRouter()


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(current_user: User = Depends(get_admin_user)):
    """
    Endpoint pour récupérer les statistiques du tableau de bord (admin uniquement)
    """
    try:
        stats = await get_dashboard_stats()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des statistiques: {str(e)}"
        )


@router.get("/agents-pointages")
async def get_agents_pointages(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_admin_user)
):
    """
    Endpoint pour récupérer tous les agents avec leurs pointages (admin uniquement)
    """
    try:
        agents = await get_agents_with_pointages(start_date, end_date, search)
        return agents
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des agents et pointages: {str(e)}"
        )


@router.get("/historique-pointages")
async def get_historique_pointages(
    limit: int = Query(100, description="Nombre maximum de pointages à récupérer"),
    offset: int = Query(0, description="Décalage pour la pagination"),
    current_user: User = Depends(get_admin_user)
):
    """
    Endpoint pour récupérer l'historique complet des pointages (admin uniquement)
    """
    try:
        from app.db import get_db
        db = await get_db()
        
        # Récupérer les pointages avec les informations des agents
        result = db.table("pointages").select("*, agents(nom, email)").order("date_pointage", desc=True).order("heure_pointage", desc=True).limit(limit).range(offset, offset + limit - 1).execute()
        
        return {
            "pointages": result.data if result.data else [],
            "total": len(result.data) if result.data else 0
        }
    except Exception as e:
        print(f"Erreur lors de la récupération de l'historique: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération de l'historique: {str(e)}"
        )


@router.get("/agents")
async def get_agents(current_user: User = Depends(get_admin_user)):
    """
    Endpoint pour récupérer la liste des agents (admin uniquement)
    """
    try:
        print("Récupération de la liste des agents")
        agents = await get_all_agents()
        print(f"Nombre d'agents récupérés: {len(agents)}")
        return agents
    except Exception as e:
        print(f"Erreur lors de la récupération des agents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des agents: {str(e)}"
        )


@router.post("/export")
async def export_pointages_data(params: ExportParams, current_user: User = Depends(get_admin_user)):
    """
    Endpoint pour exporter les pointages au format CSV ou Excel (admin uniquement)
    """
    try:
        content, filename, content_type = await export_pointages(params.start_date, params.end_date, params.format)
        
        return StreamingResponse(
            iter([content]),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'export des pointages: {str(e)}"
        )
