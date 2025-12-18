from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import date, timedelta, datetime

from app.auth.utils import get_current_active_user
from app.auth.models import User
from app.pointage.models import PointageCreate, PointageResponse, PointageJour, PointageScanOffline
from app.pointage.utils import create_pointage, format_pointages_by_date, create_pointage_offline
from app.pointage.suivi_utils import get_agent_daily_tracking

router = APIRouter()


@router.post("/")
async def enregistrer_pointage(pointage: PointageCreate, current_user: User = Depends(get_current_active_user)):
    """
    Endpoint pour enregistrer un pointage
    
    Si l'agent rescanne dans les 5 minutes après son arrivée (matin ou après-midi),
    le système retourne needs_confirmation=True avec un message de confirmation.
    L'agent doit alors renvoyer la requête avec force_confirmation=True pour valider.
    """
    # Vérifier que l'agent pointe pour lui-même
    if str(current_user.id) != str(pointage.agent_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez pointer que pour vous-même"
        )
    
    try:
        pointage_data = await create_pointage(
            str(pointage.agent_id), 
            pointage.qrcode, 
            force_confirmation=pointage.force_confirmation
        )
        
        # Si une confirmation est requise, retourner le message sans créer le pointage
        if pointage_data.get("needs_confirmation"):
            return {
                "message": pointage_data["confirmation_message"],
                "pointage": None,
                "needs_confirmation": True,
                "confirmation_message": pointage_data["confirmation_message"]
            }
        
        # Pointage créé avec succès
        type_fr = "Arrivée" if pointage_data.get("type_pointage") == "arrivee" else "Sortie"
        session_fr = "du matin" if pointage_data["session"] == "matin" else "de l'après-midi"
        return {
            "message": f"{type_fr} {session_fr} enregistrée avec succès",
            "pointage": pointage_data,
            "needs_confirmation": False,
            "confirmation_message": None
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


@router.get("/me/suivi")
async def mon_suivi_quotidien(
    start_date: date = Query(..., description="Date de début"),
    end_date: date = Query(..., description="Date de fin"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Endpoint pour récupérer le suivi quotidien des retards et absences
    avec les montants déduits pour chaque jour
    """
    try:
        print(f"🔍 Suivi demandé pour {current_user.nom} ({current_user.id}) du {start_date} au {end_date}")
        tracking = await get_agent_daily_tracking(str(current_user.id), start_date, end_date)
        
        # Calculer les totaux
        total_retard_minutes = sum(day["retard_total_minutes"] for day in tracking)
        total_absences = sum(1 for day in tracking if day["est_absent"])
        total_montant_deduit = sum(day["montant_total_deduit"] for day in tracking)
        
        print(f"✅ Suivi calculé: {len(tracking)} jours, {total_absences} absences, {total_retard_minutes} min de retard")
        
        return {
            "agent_id": str(current_user.id),
            "agent_nom": current_user.nom,
            "periode": {
                "debut": start_date.isoformat(),
                "fin": end_date.isoformat()
            },
            "totaux": {
                "retard_total_minutes": total_retard_minutes,
                "retard_total_heures": round(total_retard_minutes / 60, 2),
                "nombre_absences": total_absences,
                "montant_total_deduit": round(total_montant_deduit, 2)
            },
            "details_quotidiens": tracking
        }
    except Exception as e:
        print(f"❌ Erreur dans mon_suivi_quotidien: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération du suivi: {str(e)}"
        )


@router.post("/scan")
async def enregistrer_pointage_scan(
    pointage_data: PointageScanOffline,
    current_user: User = Depends(get_current_active_user)
):
    """
    Endpoint pour enregistrer un pointage depuis un scan QR (avec support hors-ligne)
    
    Ce endpoint est utilisé pour la synchronisation des pointages effectués hors-ligne.
    Le qr_data contient les données du QR code scanné.
    Le offline_timestamp contient l'heure à laquelle le scan a été effectué (si hors-ligne).
    """
    try:
        # Parser le timestamp hors-ligne si fourni
        offline_time = None
        if pointage_data.offline_timestamp:
            try:
                offline_time = datetime.fromisoformat(pointage_data.offline_timestamp.replace('Z', '+00:00'))
                print(f"📱 Pointage hors-ligne reçu, timestamp original: {offline_time}")
            except ValueError as e:
                print(f"⚠️ Erreur parsing timestamp hors-ligne: {e}")
        
        # Créer le pointage avec le timestamp hors-ligne si disponible
        pointage_result = await create_pointage_offline(
            agent_id=str(current_user.id),
            qrcode=pointage_data.qr_data,
            offline_timestamp=offline_time
        )
        
        type_fr = "Arrivée" if pointage_result.get("type_pointage") == "arrivee" else "Sortie"
        session_fr = "du matin" if pointage_result.get("session") == "matin" else "de l'après-midi"
        
        return {
            "success": True,
            "message": f"{type_fr} {session_fr} enregistrée avec succès",
            "pointage": pointage_result,
            "was_offline": pointage_data.offline_timestamp is not None
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"❌ Erreur pointage scan: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'enregistrement du pointage: {str(e)}"
        )
