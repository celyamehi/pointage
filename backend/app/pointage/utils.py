from datetime import datetime, date, time
from typing import Dict, Any, List, Optional
import uuid

from app.db import get_db
from app.qrcode.utils import validate_qrcode


async def determine_session() -> str:
    """
    Détermine la session (matin ou après-midi) en fonction de l'heure actuelle
    """
    current_hour = datetime.now().hour
    
    if current_hour < 12:
        return "matin"
    else:
        return "apres-midi"


async def create_pointage(agent_id: str, qrcode: str) -> Dict[str, Any]:
    """
    Crée un nouveau pointage pour un agent
    """
    db = await get_db()
    
    # Vérifier si le QR code est valide
    is_valid = await validate_qrcode(qrcode)
    if not is_valid:
        raise ValueError("QR code invalide ou expiré")
    
    # Déterminer la session (matin ou après-midi)
    session = await determine_session()
    
    # Vérifier si l'agent a déjà pointé pour cette session aujourd'hui
    try:
        today = date.today().isoformat()
        print(f"Vérification des pointages existants pour l'agent {agent_id} à la date {today} et la session {session}")
        existing_pointage = db.table("pointages").select("*").eq("agent_id", agent_id).eq("date_pointage", today).eq("session", session).execute()
        
        if existing_pointage.data and len(existing_pointage.data) > 0:
            print(f"Pointage existant trouvé pour l'agent {agent_id}")
            raise ValueError(f"Vous avez déjà pointé pour la session {session} aujourd'hui")
    except Exception as e:
        print(f"Erreur lors de la vérification des pointages existants: {str(e)}")
        # Continuer même en cas d'erreur
    
    # Créer le pointage
    now = datetime.now()
    new_pointage = {
        "id": str(uuid.uuid4()),
        "agent_id": agent_id,
        "date_pointage": today,
        "heure_pointage": now.strftime("%H:%M:%S"),
        "session": session
    }
    
    try:
        print(f"Insertion d'un nouveau pointage: {new_pointage}")
        result = db.table("pointages").insert(new_pointage).execute()
        print(f"Résultat de l'insertion: {result}")
    except Exception as e:
        print(f"Erreur lors de l'insertion du pointage: {str(e)}")
        raise Exception(f"Erreur lors de l'enregistrement du pointage: {str(e)}")
    
    if not result.data or len(result.data) == 0:
        raise Exception("Erreur lors de l'enregistrement du pointage")
    
    pointage_db = result.data[0]
    
    return {
        "id": pointage_db["id"],
        "agent_id": pointage_db["agent_id"],
        "date_pointage": pointage_db["date_pointage"],
        "heure_pointage": pointage_db["heure_pointage"],
        "session": pointage_db["session"],
        "created_at": pointage_db["created_at"]
    }


async def get_pointages_by_agent(agent_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
    """
    Récupère les pointages d'un agent sur une période donnée
    """
    db = await get_db()
    
    try:
        print(f"Récupération des pointages pour l'agent {agent_id} du {start_date} au {end_date}")
        query = db.table("pointages").select("*").eq("agent_id", agent_id)
        
        if start_date:
            query = query.gte("date_pointage", start_date.isoformat())
        
        if end_date:
            query = query.lte("date_pointage", end_date.isoformat())
        
        result = query.order("date_pointage", desc=False).execute()
        print(f"Nombre de pointages récupérés: {len(result.data) if result.data else 0}")
    except Exception as e:
        print(f"Erreur lors de la récupération des pointages: {str(e)}")
        return []
    
    return result.data if result.data else []


async def get_pointages_by_date(date_pointage: date) -> List[Dict[str, Any]]:
    """
    Récupère tous les pointages pour une date donnée
    """
    db = await get_db()
    
    try:
        print(f"Récupération des pointages pour la date {date_pointage}")
        result = db.table("pointages").select("*").eq("date_pointage", date_pointage.isoformat()).execute()
        print(f"Nombre de pointages récupérés: {len(result.data) if result.data else 0}")
    except Exception as e:
        print(f"Erreur lors de la récupération des pointages par date: {str(e)}")
        return []
    
    return result.data if result.data else []


async def format_pointages_by_date(agent_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
    """
    Formate les pointages d'un agent par jour avec matin et après-midi
    """
    try:
        print(f"Formatage des pointages pour l'agent {agent_id} du {start_date} au {end_date}")
        pointages = await get_pointages_by_agent(agent_id, start_date, end_date)
    except Exception as e:
        print(f"Erreur lors du formatage des pointages: {str(e)}")
        return []
    
    # Organiser les pointages par date
    pointages_by_date = {}
    
    for pointage in pointages:
        date_str = pointage["date_pointage"]
        
        if date_str not in pointages_by_date:
            pointages_by_date[date_str] = {
                "date": date_str,
                "matin": None,
                "apres_midi": None
            }
        
        if pointage["session"] == "matin":
            pointages_by_date[date_str]["matin"] = pointage["heure_pointage"]
        else:
            pointages_by_date[date_str]["apres_midi"] = pointage["heure_pointage"]
    
    # Convertir en liste
    return list(pointages_by_date.values())
