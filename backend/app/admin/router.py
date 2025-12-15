from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel

from app.auth.utils import get_admin_user
from app.auth.models import User
from app.admin.models import DashboardStats, ExportParams, AgentPointageFilters
from app.admin.utils import get_dashboard_stats, get_agents_with_pointages, export_pointages, get_all_agents
from app.db import get_db

router = APIRouter()


# Modèles pour la gestion des pointages
class ModifierPointageRequest(BaseModel):
    heure_pointage: str  # Format HH:MM:SS
    justification: str


class SupprimerPointageRequest(BaseModel):
    justification: str


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
        # Spécifier explicitement la relation car il y a deux FK vers agents (agent_id et annule_par)
        result = db.table("pointages").select("*, agents!pointages_agent_id_fkey(nom, email)").order("date_pointage", desc=True).order("heure_pointage", desc=True).limit(limit).range(offset, offset + limit - 1).execute()
        
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


# ============================================
# GESTION DES POINTAGES (Modification/Suppression)
# ============================================

@router.put("/pointages/{pointage_id}")
async def modifier_pointage(
    pointage_id: str,
    request: ModifierPointageRequest,
    current_user: User = Depends(get_admin_user)
):
    """
    Modifier l'heure d'un pointage (admin uniquement).
    Crée un log d'audit avec la justification.
    """
    db = await get_db()
    
    try:
        # Récupérer le pointage existant
        # Spécifier explicitement la relation car il y a deux FK vers agents
        result = db.table("pointages").select("*, agents!pointages_agent_id_fkey(nom, email)").eq("id", pointage_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pointage non trouvé"
            )
        
        pointage = result.data
        
        # Vérifier que le pointage n'est pas annulé
        if pointage.get("annule"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ce pointage a été annulé et ne peut pas être modifié"
            )
        
        # Valider le format de l'heure
        try:
            datetime.strptime(request.heure_pointage, "%H:%M:%S")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format d'heure invalide. Utilisez HH:MM:SS"
            )
        
        # Sauvegarder les données avant modification
        donnees_avant = {
            "heure_pointage": pointage["heure_pointage"],
            "date_pointage": pointage["date_pointage"],
            "session": pointage["session"],
            "type_pointage": pointage.get("type_pointage")
        }
        
        # Modifier le pointage
        update_result = db.table("pointages").update({
            "heure_pointage": request.heure_pointage
        }).eq("id", pointage_id).execute()
        
        # Données après modification
        donnees_apres = {
            "heure_pointage": request.heure_pointage,
            "date_pointage": pointage["date_pointage"],
            "session": pointage["session"],
            "type_pointage": pointage.get("type_pointage")
        }
        
        # Créer le log d'audit
        agent_info = pointage.get("agents", {})
        audit_log = {
            "admin_id": str(current_user.id),
            "admin_email": current_user.email,
            "pointage_id": pointage_id,
            "agent_id": pointage["agent_id"],
            "agent_email": agent_info.get("email", "inconnu"),
            "action": "modification",
            "donnees_avant": donnees_avant,
            "donnees_apres": donnees_apres,
            "justification": request.justification
        }
        
        db.table("audit_logs").insert(audit_log).execute()
        
        return {
            "message": "Pointage modifié avec succès",
            "pointage_id": pointage_id,
            "ancienne_heure": donnees_avant["heure_pointage"],
            "nouvelle_heure": request.heure_pointage
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur modification pointage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la modification du pointage: {str(e)}"
        )


@router.delete("/pointages/{pointage_id}")
async def supprimer_pointage(
    pointage_id: str,
    request: SupprimerPointageRequest,
    current_user: User = Depends(get_admin_user)
):
    """
    Supprimer (soft delete) un pointage (admin uniquement).
    Le pointage est marqué comme annulé mais reste dans la base.
    Crée un log d'audit avec la justification.
    """
    db = await get_db()
    
    try:
        # Récupérer le pointage existant
        # Spécifier explicitement la relation car il y a deux FK vers agents
        result = db.table("pointages").select("*, agents!pointages_agent_id_fkey(nom, email)").eq("id", pointage_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pointage non trouvé"
            )
        
        pointage = result.data
        
        # Vérifier que le pointage n'est pas déjà annulé
        if pointage.get("annule"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ce pointage est déjà annulé"
            )
        
        # Sauvegarder les données avant suppression
        donnees_avant = {
            "heure_pointage": pointage["heure_pointage"],
            "date_pointage": pointage["date_pointage"],
            "session": pointage["session"],
            "type_pointage": pointage.get("type_pointage"),
            "annule": False
        }
        
        # Soft delete: marquer comme annulé
        from datetime import datetime
        import pytz
        now = datetime.now(pytz.timezone('Africa/Casablanca'))
        
        update_result = db.table("pointages").update({
            "annule": True,
            "annule_par": str(current_user.id),
            "annule_le": now.isoformat(),
            "motif_annulation": request.justification
        }).eq("id", pointage_id).execute()
        
        # Créer le log d'audit
        agent_info = pointage.get("agents", {})
        audit_log = {
            "admin_id": str(current_user.id),
            "admin_email": current_user.email,
            "pointage_id": pointage_id,
            "agent_id": pointage["agent_id"],
            "agent_email": agent_info.get("email", "inconnu"),
            "action": "suppression",
            "donnees_avant": donnees_avant,
            "donnees_apres": None,
            "justification": request.justification
        }
        
        db.table("audit_logs").insert(audit_log).execute()
        
        return {
            "message": "Pointage annulé avec succès",
            "pointage_id": pointage_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur suppression pointage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression du pointage: {str(e)}"
        )


@router.post("/pointages/{pointage_id}/restaurer")
async def restaurer_pointage(
    pointage_id: str,
    justification: str = Body(..., embed=True),
    current_user: User = Depends(get_admin_user)
):
    """
    Restaurer un pointage annulé (admin uniquement).
    Crée un log d'audit avec la justification.
    """
    db = await get_db()
    
    try:
        # Récupérer le pointage existant
        # Spécifier explicitement la relation car il y a deux FK vers agents
        result = db.table("pointages").select("*, agents!pointages_agent_id_fkey(nom, email)").eq("id", pointage_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pointage non trouvé"
            )
        
        pointage = result.data
        
        # Vérifier que le pointage est annulé
        if not pointage.get("annule"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ce pointage n'est pas annulé"
            )
        
        # Restaurer le pointage
        update_result = db.table("pointages").update({
            "annule": False,
            "annule_par": None,
            "annule_le": None,
            "motif_annulation": None
        }).eq("id", pointage_id).execute()
        
        # Créer le log d'audit
        agent_info = pointage.get("agents", {})
        donnees_apres = {
            "heure_pointage": pointage["heure_pointage"],
            "date_pointage": pointage["date_pointage"],
            "session": pointage["session"],
            "type_pointage": pointage.get("type_pointage"),
            "annule": False
        }
        
        audit_log = {
            "admin_id": str(current_user.id),
            "admin_email": current_user.email,
            "pointage_id": pointage_id,
            "agent_id": pointage["agent_id"],
            "agent_email": agent_info.get("email", "inconnu"),
            "action": "restauration",
            "donnees_avant": {"annule": True},
            "donnees_apres": donnees_apres,
            "justification": justification
        }
        
        db.table("audit_logs").insert(audit_log).execute()
        
        return {
            "message": "Pointage restauré avec succès",
            "pointage_id": pointage_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur restauration pointage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la restauration du pointage: {str(e)}"
        )


@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = Query(50, description="Nombre maximum de logs"),
    offset: int = Query(0, description="Décalage pour la pagination"),
    agent_id: Optional[str] = Query(None, description="Filtrer par agent"),
    action: Optional[str] = Query(None, description="Filtrer par type d'action"),
    current_user: User = Depends(get_admin_user)
):
    """
    Récupérer les logs d'audit (admin uniquement)
    """
    db = await get_db()
    
    try:
        query = db.table("audit_logs").select("*").order("created_at", desc=True)
        
        if agent_id:
            query = query.eq("agent_id", agent_id)
        
        if action:
            query = query.eq("action", action)
        
        result = query.range(offset, offset + limit - 1).execute()
        
        return {
            "logs": result.data if result.data else [],
            "total": len(result.data) if result.data else 0
        }
        
    except Exception as e:
        print(f"Erreur récupération audit logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des logs: {str(e)}"
        )
