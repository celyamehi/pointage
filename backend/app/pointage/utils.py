from datetime import datetime, date, time, timezone, timedelta
from typing import Dict, Any, List, Optional
import uuid

from app.db import get_db
from app.qrcode.utils import validate_qrcode

# Fuseau horaire GMT+1
TIMEZONE = timezone(timedelta(hours=1))


async def determine_session() -> str:
    """
    Détermine la session (matin ou après-midi) en fonction de l'heure actuelle
    """
    now_gmt1 = datetime.now(TIMEZONE)
    current_hour = now_gmt1.hour
    print(f"🕒 Heure actuelle (GMT+1): {now_gmt1.strftime('%H:%M:%S')} - Session: {'matin' if current_hour < 12 else 'après-midi'}")
    
    if current_hour < 12:
        return "matin"
    else:
        return "apres-midi"


async def create_pointage(agent_id: str, qrcode: str) -> Dict[str, Any]:
    """
    Crée un nouveau pointage pour un agent
    Nouvelle logique : 4 pointages par jour
    - Matin : arrivée + sortie
    - Après-midi : arrivée + sortie
    """
    db = await get_db()
    
    # Vérifier si le QR code est valide
    is_valid = await validate_qrcode(qrcode)
    if not is_valid:
        raise ValueError("QR code invalide ou expiré")
    
    # Déterminer la session (matin ou après-midi)
    session = await determine_session()
    
    # Utiliser la date GMT+1
    now_gmt1 = datetime.now(TIMEZONE)
    today = now_gmt1.date().isoformat()
    
    print(f"🔍 Vérification des pointages existants pour l'agent {agent_id} à la date {today} et la session {session}")
    
    # Vérifier les pointages existants pour cette session
    try:
        existing_pointages = db.table("pointages").select("*").eq("agent_id", agent_id).eq("date_pointage", today).eq("session", session).execute()
        print(f"📊 Pointages existants: {existing_pointages.data}")
        
        nb_pointages = len(existing_pointages.data) if existing_pointages.data else 0
        print(f"📊 Nombre de pointages pour cette session: {nb_pointages}")
        
        # Déterminer le type de pointage (arrivée ou sortie)
        if nb_pointages == 0:
            type_pointage = "arrivee"
            print(f"✅ Premier pointage de la session → Arrivée")
        elif nb_pointages == 1:
            # Vérifier que le premier pointage était une arrivée
            if existing_pointages.data[0].get("type_pointage") == "arrivee":
                type_pointage = "sortie"
                print(f"✅ Deuxième pointage de la session → Sortie")
            else:
                raise ValueError(f"Erreur de cohérence dans les pointages")
        else:
            # Déjà 2 pointages pour cette session
            print(f"❌ Limite atteinte: {nb_pointages} pointages pour la session {session}")
            session_fr = "du matin" if session == "matin" else "de l'après-midi"
            raise ValueError(f"Vous avez déjà effectué vos 2 pointages pour la session {session_fr} (arrivée et sortie). Maximum 4 pointages par jour : 2 le matin et 2 l'après-midi.")
        
    except ValueError as ve:
        # Re-lever les erreurs de validation
        print(f"🔴 ValueError: {str(ve)}")
        raise ve
    except Exception as e:
        print(f"⚠️ Erreur lors de la vérification: {str(e)}")
        raise Exception(f"Erreur lors de la vérification des pointages: {str(e)}")
    
    # Créer le pointage avec l'heure GMT+1
    now_gmt1 = datetime.now(TIMEZONE)
    new_pointage = {
        "id": str(uuid.uuid4()),
        "agent_id": agent_id,
        "date_pointage": today,
        "heure_pointage": now_gmt1.strftime("%H:%M:%S"),
        "session": session,
        "type_pointage": type_pointage
    }
    type_fr = "Arrivée" if type_pointage == "arrivee" else "Sortie"
    print(f"📌 Pointage créé - Date: {today}, Heure (GMT+1): {now_gmt1.strftime('%H:%M:%S')}, Session: {session}, Type: {type_fr}")
    
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
    
    # Organiser les pointages par date avec arrivée et sortie
    pointages_by_date = {}
    
    for pointage in pointages:
        date_str = pointage["date_pointage"]
        
        if date_str not in pointages_by_date:
            pointages_by_date[date_str] = {
                "date": date_str,
                "matin_arrivee": None,
                "matin_sortie": None,
                "apres_midi_arrivee": None,
                "apres_midi_sortie": None
            }
        
        # Déterminer le type de pointage
        type_pointage = pointage.get("type_pointage", "arrivee")
        
        if pointage["session"] == "matin":
            if type_pointage == "arrivee":
                pointages_by_date[date_str]["matin_arrivee"] = pointage["heure_pointage"]
            else:
                pointages_by_date[date_str]["matin_sortie"] = pointage["heure_pointage"]
        else:
            if type_pointage == "arrivee":
                pointages_by_date[date_str]["apres_midi_arrivee"] = pointage["heure_pointage"]
            else:
                pointages_by_date[date_str]["apres_midi_sortie"] = pointage["heure_pointage"]
    
    # Convertir en liste
    return list(pointages_by_date.values())
