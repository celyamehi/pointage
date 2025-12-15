from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import date, datetime
import logging

from app.db import get_db
from app.auth.utils import get_current_active_user, get_admin_user
from app.auth.models import User
from app.jours_feries.models import JourFerie, JourFerieCreate, JourFerieUpdate, ExceptionJourFerie, ExceptionJourFerieCreate

router = APIRouter(prefix="/api/jours-feries", tags=["jours-feries"])
logger = logging.getLogger(__name__)


@router.get("", response_model=List[JourFerie])
async def get_jours_feries(
    annee: Optional[int] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer tous les jours fériés (optionnellement filtrés par année)
    """
    db = await get_db()
    
    try:
        query = db.table("jours_feries").select("*")
        
        if annee:
            query = query.eq("annee", annee)
        
        result = query.order("date_ferie").execute()
        
        return result.data if result.data else []
    
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des jours fériés: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/annee/{annee}", response_model=List[JourFerie])
async def get_jours_feries_annee(
    annee: int,
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer les jours fériés pour une année spécifique
    """
    db = await get_db()
    
    try:
        result = db.table("jours_feries").select("*").eq("annee", annee).order("date_ferie").execute()
        
        return result.data if result.data else []
    
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des jours fériés: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check/{date_check}")
async def check_jour_ferie(
    date_check: date,
    current_user: User = Depends(get_current_active_user)
):
    """
    Vérifier si une date est un jour férié
    """
    db = await get_db()
    
    try:
        result = db.table("jours_feries").select("*").eq("date_ferie", date_check.isoformat()).execute()
        
        if result.data and len(result.data) > 0:
            return {
                "est_ferie": True,
                "jour_ferie": result.data[0]
            }
        else:
            return {
                "est_ferie": False,
                "jour_ferie": None
            }
    
    except Exception as e:
        logger.error(f"Erreur lors de la vérification du jour férié: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=JourFerie)
async def create_jour_ferie(
    jour_ferie_data: JourFerieCreate,
    current_user: User = Depends(get_admin_user)
):
    """
    Créer un nouveau jour férié personnalisé (admin uniquement)
    """
    db = await get_db()
    
    try:
        # Vérifier si la date existe déjà
        existing = db.table("jours_feries").select("id").eq("date_ferie", jour_ferie_data.date_ferie.isoformat()).execute()
        
        if existing.data and len(existing.data) > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Un jour férié existe déjà pour la date {jour_ferie_data.date_ferie}"
            )
        
        # Créer le jour férié
        new_jour_ferie = {
            "date_ferie": jour_ferie_data.date_ferie.isoformat(),
            "nom": jour_ferie_data.nom,
            "description": jour_ferie_data.description,
            "type": "custom",
            "annee": jour_ferie_data.date_ferie.year,
            "recurrent": jour_ferie_data.recurrent,
            "created_by": str(current_user.id)
        }
        
        result = db.table("jours_feries").insert(new_jour_ferie).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Erreur lors de la création du jour férié")
        
        logger.info(f"Jour férié créé: {jour_ferie_data.nom} le {jour_ferie_data.date_ferie}")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la création du jour férié: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{jour_ferie_id}", response_model=JourFerie)
async def update_jour_ferie(
    jour_ferie_id: str,
    jour_ferie_data: JourFerieUpdate,
    current_user: User = Depends(get_admin_user)
):
    """
    Mettre à jour un jour férié (admin uniquement)
    """
    db = await get_db()
    
    try:
        # Vérifier que le jour férié existe
        existing = db.table("jours_feries").select("*").eq("id", jour_ferie_id).execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Jour férié non trouvé")
        
        # Préparer les données de mise à jour
        update_data = jour_ferie_data.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")
        
        result = db.table("jours_feries").update(update_data).eq("id", jour_ferie_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour")
        
        logger.info(f"Jour férié {jour_ferie_id} mis à jour")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du jour férié: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{jour_ferie_id}")
async def delete_jour_ferie(
    jour_ferie_id: str,
    current_user: User = Depends(get_admin_user)
):
    """
    Supprimer un jour férié (admin uniquement)
    Seuls les jours fériés personnalisés (type='custom') peuvent être supprimés
    """
    db = await get_db()
    
    try:
        # Vérifier que le jour férié existe et est de type custom
        existing = db.table("jours_feries").select("*").eq("id", jour_ferie_id).execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Jour férié non trouvé")
        
        jour_ferie = existing.data[0]
        
        if jour_ferie["type"] == "legal":
            raise HTTPException(
                status_code=400,
                detail="Impossible de supprimer un jour férié légal. Vous pouvez uniquement supprimer les jours fériés personnalisés."
            )
        
        result = db.table("jours_feries").delete().eq("id", jour_ferie_id).execute()
        
        logger.info(f"Jour férié {jour_ferie_id} supprimé")
        
        return {"message": "Jour férié supprimé avec succès"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la suppression du jour férié: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generer/{annee}")
async def generer_jours_feries_annee(
    annee: int,
    current_user: User = Depends(get_admin_user)
):
    """
    Générer automatiquement les jours fériés français pour une année donnée (admin uniquement)
    """
    db = await get_db()
    
    try:
        # Calculer les dates de Pâques et jours fériés mobiles
        paques = calculer_paques(annee)
        
        # Liste des jours fériés français
        jours_feries_france = [
            {"date": date(annee, 1, 1), "nom": "Jour de l'An", "description": "Premier jour de l'année", "recurrent": True},
            {"date": paques, "nom": "Lundi de Pâques", "description": "Lendemain de Pâques", "recurrent": False},
            {"date": date(annee, 5, 1), "nom": "Fête du Travail", "description": "Journée internationale des travailleurs", "recurrent": True},
            {"date": date(annee, 5, 8), "nom": "Victoire 1945", "description": "Fin de la Seconde Guerre mondiale en Europe", "recurrent": True},
            {"date": paques + timedelta(days=38), "nom": "Ascension", "description": "Jeudi de l'Ascension", "recurrent": False},
            {"date": paques + timedelta(days=49), "nom": "Lundi de Pentecôte", "description": "Lendemain de la Pentecôte", "recurrent": False},
            {"date": date(annee, 7, 14), "nom": "Fête Nationale", "description": "Prise de la Bastille", "recurrent": True},
            {"date": date(annee, 8, 15), "nom": "Assomption", "description": "Assomption de Marie", "recurrent": True},
            {"date": date(annee, 11, 1), "nom": "Toussaint", "description": "Fête de tous les saints", "recurrent": True},
            {"date": date(annee, 11, 11), "nom": "Armistice 1918", "description": "Fin de la Première Guerre mondiale", "recurrent": True},
            {"date": date(annee, 12, 25), "nom": "Noël", "description": "Naissance de Jésus-Christ", "recurrent": True},
        ]
        
        created_count = 0
        skipped_count = 0
        
        for jf in jours_feries_france:
            # Vérifier si existe déjà
            existing = db.table("jours_feries").select("id").eq("date_ferie", jf["date"].isoformat()).execute()
            
            if existing.data and len(existing.data) > 0:
                skipped_count += 1
                continue
            
            # Créer le jour férié
            new_jf = {
                "date_ferie": jf["date"].isoformat(),
                "nom": jf["nom"],
                "description": jf["description"],
                "type": "legal",
                "annee": annee,
                "recurrent": jf["recurrent"],
                "created_by": str(current_user.id)
            }
            
            db.table("jours_feries").insert(new_jf).execute()
            created_count += 1
        
        logger.info(f"Jours fériés générés pour {annee}: {created_count} créés, {skipped_count} ignorés")
        
        return {
            "message": f"Jours fériés pour {annee} générés avec succès",
            "created": created_count,
            "skipped": skipped_count
        }
    
    except Exception as e:
        logger.error(f"Erreur lors de la génération des jours fériés: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def calculer_paques(annee: int) -> date:
    """
    Calcule la date du lundi de Pâques pour une année donnée
    Algorithme de Meeus/Jones/Butcher
    """
    from datetime import timedelta
    
    a = annee % 19
    b = annee // 100
    c = annee % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    mois = (h + l - 7 * m + 114) // 31
    jour = ((h + l - 7 * m + 114) % 31) + 1
    
    # Dimanche de Pâques
    dimanche_paques = date(annee, mois, jour)
    # Lundi de Pâques = dimanche + 1 jour
    lundi_paques = dimanche_paques + timedelta(days=1)
    
    return lundi_paques


# Import nécessaire pour timedelta
from datetime import timedelta


# ============================================
# ENDPOINTS POUR LES EXCEPTIONS (agents qui travaillent un jour férié)
# ============================================

@router.get("/exceptions", response_model=List[dict])
async def get_all_exceptions(
    jour_ferie_id: Optional[str] = None,
    current_user: User = Depends(get_admin_user)
):
    """
    Récupérer toutes les exceptions (admin uniquement)
    """
    db = await get_db()
    
    try:
        query = db.table("jours_feries_exceptions").select(
            "*, agents!jours_feries_exceptions_agent_id_fkey(nom, email), jours_feries(date_ferie, nom)"
        )
        
        if jour_ferie_id:
            query = query.eq("jour_ferie_id", jour_ferie_id)
        
        result = query.order("created_at", desc=True).execute()
        
        # Formater les données
        exceptions = []
        for exc in (result.data or []):
            exceptions.append({
                "id": exc["id"],
                "jour_ferie_id": exc["jour_ferie_id"],
                "agent_id": exc["agent_id"],
                "motif": exc.get("motif"),
                "created_at": exc.get("created_at"),
                "agent_nom": exc.get("agents", {}).get("nom") if exc.get("agents") else None,
                "agent_email": exc.get("agents", {}).get("email") if exc.get("agents") else None,
                "jour_ferie_date": exc.get("jours_feries", {}).get("date_ferie") if exc.get("jours_feries") else None,
                "jour_ferie_nom": exc.get("jours_feries", {}).get("nom") if exc.get("jours_feries") else None,
            })
        
        return exceptions
    
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des exceptions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{jour_ferie_id}/exceptions", response_model=List[dict])
async def get_exceptions_jour_ferie(
    jour_ferie_id: str,
    current_user: User = Depends(get_admin_user)
):
    """
    Récupérer les exceptions pour un jour férié spécifique
    """
    db = await get_db()
    
    try:
        result = db.table("jours_feries_exceptions").select(
            "*, agents!jours_feries_exceptions_agent_id_fkey(nom, email)"
        ).eq("jour_ferie_id", jour_ferie_id).execute()
        
        exceptions = []
        for exc in (result.data or []):
            exceptions.append({
                "id": exc["id"],
                "jour_ferie_id": exc["jour_ferie_id"],
                "agent_id": exc["agent_id"],
                "motif": exc.get("motif"),
                "created_at": exc.get("created_at"),
                "agent_nom": exc.get("agents", {}).get("nom") if exc.get("agents") else None,
                "agent_email": exc.get("agents", {}).get("email") if exc.get("agents") else None,
            })
        
        return exceptions
    
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des exceptions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/exceptions")
async def create_exception(
    exception_data: ExceptionJourFerieCreate,
    current_user: User = Depends(get_admin_user)
):
    """
    Créer une exception (marquer un agent comme travaillant un jour férié)
    """
    db = await get_db()
    
    try:
        # Vérifier que le jour férié existe
        jour_ferie = db.table("jours_feries").select("id, nom, date_ferie").eq("id", str(exception_data.jour_ferie_id)).execute()
        if not jour_ferie.data:
            raise HTTPException(status_code=404, detail="Jour férié non trouvé")
        
        # Vérifier que l'agent existe
        agent = db.table("agents").select("id, nom").eq("id", str(exception_data.agent_id)).execute()
        if not agent.data:
            raise HTTPException(status_code=404, detail="Agent non trouvé")
        
        # Vérifier si l'exception existe déjà
        existing = db.table("jours_feries_exceptions").select("id").eq(
            "jour_ferie_id", str(exception_data.jour_ferie_id)
        ).eq("agent_id", str(exception_data.agent_id)).execute()
        
        if existing.data:
            raise HTTPException(status_code=400, detail="Cette exception existe déjà")
        
        # Créer l'exception
        new_exception = {
            "jour_ferie_id": str(exception_data.jour_ferie_id),
            "agent_id": str(exception_data.agent_id),
            "motif": exception_data.motif,
            "created_by": str(current_user.id)
        }
        
        result = db.table("jours_feries_exceptions").insert(new_exception).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Erreur lors de la création de l'exception")
        
        logger.info(f"Exception créée: {agent.data[0]['nom']} travaille le {jour_ferie.data[0]['date_ferie']}")
        
        return {
            "message": f"Exception créée: {agent.data[0]['nom']} travaillera le {jour_ferie.data[0]['nom']}",
            "exception": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la création de l'exception: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/exceptions/{exception_id}")
async def delete_exception(
    exception_id: str,
    current_user: User = Depends(get_admin_user)
):
    """
    Supprimer une exception
    """
    db = await get_db()
    
    try:
        # Vérifier que l'exception existe
        existing = db.table("jours_feries_exceptions").select("*").eq("id", exception_id).execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Exception non trouvée")
        
        result = db.table("jours_feries_exceptions").delete().eq("id", exception_id).execute()
        
        logger.info(f"Exception {exception_id} supprimée")
        
        return {"message": "Exception supprimée avec succès"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la suppression de l'exception: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agent/{agent_id}/exceptions")
async def get_agent_exceptions(
    agent_id: str,
    annee: Optional[int] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupérer les jours fériés où un agent travaille (exceptions)
    Retourne les dates des jours fériés où l'agent a une exception
    """
    db = await get_db()
    
    try:
        query = db.table("jours_feries_exceptions").select(
            "*, jours_feries(id, date_ferie, nom, annee)"
        ).eq("agent_id", agent_id)
        
        result = query.execute()
        
        # Filtrer par année si spécifié
        exceptions = []
        for exc in (result.data or []):
            jf = exc.get("jours_feries", {})
            if annee and jf.get("annee") != annee:
                continue
            exceptions.append({
                "date_ferie": jf.get("date_ferie"),
                "nom": jf.get("nom"),
                "motif": exc.get("motif")
            })
        
        return exceptions
    
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des exceptions agent: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
