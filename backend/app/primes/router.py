from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import UUID
import logging

from app.db import get_db
from app.auth.utils import get_current_active_user, get_admin_user
from app.primes.models import Prime, PrimeCreate, PrimeUpdate, PrimesSummary

router = APIRouter(prefix="/api/primes", tags=["primes"])
logger = logging.getLogger(__name__)


@router.post("", response_model=Prime, dependencies=[Depends(get_admin_user)])
async def create_prime(prime_data: PrimeCreate, current_user = Depends(get_current_active_user)):
    """
    Créer une nouvelle prime pour un agent (admin uniquement)
    """
    db = await get_db()
    
    try:
        # Vérifier que l'agent existe
        agent_response = db.table("agents").select("id, nom").eq("id", str(prime_data.agent_id)).execute()
        if not agent_response.data:
            raise HTTPException(status_code=404, detail="Agent non trouvé")
        
        # Créer la prime
        prime_insert = {
            "agent_id": str(prime_data.agent_id),
            "montant": prime_data.montant,
            "motif": prime_data.motif,
            "mois": prime_data.mois,
            "annee": prime_data.annee,
            "created_by": str(current_user.id)
        }
        
        result = db.table("primes").insert(prime_insert).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Erreur lors de la création de la prime")
        
        logger.info(f"Prime créée: {prime_data.montant} DA pour agent {prime_data.agent_id} - {prime_data.motif}")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la création de la prime: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[Prime], dependencies=[Depends(get_admin_user)])
async def get_primes(
    mois: Optional[int] = None,
    annee: Optional[int] = None,
    agent_id: Optional[str] = None
):
    """
    Récupérer toutes les primes avec filtres optionnels (admin uniquement)
    """
    db = await get_db()
    
    try:
        query = db.table("primes").select(
            "*, agents!primes_agent_id_fkey(nom, email, role)"
        )
        
        if mois:
            query = query.eq("mois", mois)
        if annee:
            query = query.eq("annee", annee)
        if agent_id:
            query = query.eq("agent_id", agent_id)
        
        result = query.order("created_at", desc=True).execute()
        
        # Aplatir les données de l'agent
        primes = []
        for prime in result.data:
            agent_data = prime.pop("agents", {})
            prime["agent_nom"] = agent_data.get("nom")
            prime["agent_email"] = agent_data.get("email")
            prime["agent_role"] = agent_data.get("role")
            primes.append(prime)
        
        return primes
    
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des primes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agent/{agent_id}", response_model=List[Prime])
async def get_agent_primes(
    agent_id: str,
    mois: Optional[int] = None,
    annee: Optional[int] = None,
    current_user = Depends(get_current_active_user)
):
    """
    Récupérer les primes d'un agent spécifique
    L'agent peut voir ses propres primes, l'admin peut voir toutes les primes
    """
    # Vérifier les permissions
    if current_user.role != "admin" and str(current_user.id) != agent_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    db = await get_db()
    
    try:
        query = db.table("primes").select(
            "*, agents!primes_agent_id_fkey(nom, email, role)"
        ).eq("agent_id", agent_id)
        
        if mois:
            query = query.eq("mois", mois)
        if annee:
            query = query.eq("annee", annee)
        
        result = query.order("created_at", desc=True).execute()
        
        # Aplatir les données de l'agent
        primes = []
        for prime in result.data:
            agent_data = prime.pop("agents", {})
            prime["agent_nom"] = agent_data.get("nom")
            prime["agent_email"] = agent_data.get("email")
            prime["agent_role"] = agent_data.get("role")
            primes.append(prime)
        
        return primes
    
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des primes de l'agent: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/{agent_id}/{mois}/{annee}", response_model=PrimesSummary)
async def get_primes_summary(
    agent_id: str,
    mois: int,
    annee: int,
    current_user = Depends(get_current_active_user)
):
    """
    Récupérer le résumé des primes d'un agent pour un mois donné
    """
    # Vérifier les permissions
    if current_user.role != "admin" and str(current_user.id) != agent_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    db = await get_db()
    
    try:
        # Récupérer l'agent
        agent_response = db.table("agents").select("nom").eq("id", agent_id).execute()
        if not agent_response.data:
            raise HTTPException(status_code=404, detail="Agent non trouvé")
        
        # Récupérer les primes
        result = db.table("primes").select("*").eq("agent_id", agent_id).eq("mois", mois).eq("annee", annee).execute()
        
        total_primes = sum(prime["montant"] for prime in result.data)
        
        return {
            "agent_id": agent_id,
            "agent_nom": agent_response.data[0]["nom"],
            "mois": mois,
            "annee": annee,
            "total_primes": total_primes,
            "nombre_primes": len(result.data),
            "primes": result.data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du résumé des primes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{prime_id}", response_model=Prime, dependencies=[Depends(get_admin_user)])
async def update_prime(prime_id: str, prime_data: PrimeUpdate):
    """
    Mettre à jour une prime (admin uniquement)
    """
    db = await get_db()
    
    try:
        update_data = prime_data.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")
        
        result = db.table("primes").update(update_data).eq("id", prime_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Prime non trouvée")
        
        logger.info(f"Prime {prime_id} mise à jour")
        
        return result.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour de la prime: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{prime_id}", dependencies=[Depends(get_admin_user)])
async def delete_prime(prime_id: str):
    """
    Supprimer une prime (admin uniquement)
    """
    db = await get_db()
    
    try:
        result = db.table("primes").delete().eq("id", prime_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Prime non trouvée")
        
        logger.info(f"Prime {prime_id} supprimée")
        
        return {"message": "Prime supprimée avec succès"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la suppression de la prime: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
