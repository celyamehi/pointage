from datetime import datetime, date, time, timezone, timedelta
from typing import Dict, Any, List, Optional
import uuid

from app.db import get_db
from app.qrcode.utils import validate_qrcode

# Fuseau horaire GMT+1
TIMEZONE = timezone(timedelta(hours=1))


async def determine_session_simple() -> str:
    """
    Détermine la session (matin ou après-midi) en fonction de l'heure actuelle uniquement
    - Matin: avant 13h
    - Après-midi: à partir de 13h
    Note: La pause est de 12h à 13h, donc entre 12h et 13h on reste en session matin
    pour permettre les sorties matin
    """
    now_gmt1 = datetime.now(TIMEZONE)
    current_hour = now_gmt1.hour
    
    # La session après-midi commence à 13h (après la pause)
    if current_hour < 13:
        session = "matin"
    else:
        session = "apres-midi"
    
    print(f"🕒 Heure actuelle (GMT+1): {now_gmt1.strftime('%H:%M:%S')} - Session simple: {session}")
    return session


async def determine_session_for_agent(agent_id: str, force_confirmation: bool = False) -> tuple[str, str, bool, str]:
    """
    Détermine la session et le type de pointage pour un agent en fonction:
    1. De l'heure actuelle
    2. Des pointages déjà effectués aujourd'hui
    
    Horaires:
    - Matin: 8h05 - 12h00 (arrivée puis sortie)
    - Pause: 12h00 - 13h00
    - Après-midi: 13h00 - 17h00 (arrivée puis sortie)
    
    Retourne: (session, type_pointage, needs_confirmation, confirmation_message)
    
    Si l'agent rescanne dans les 5 minutes après son arrivée (matin ou après-midi),
    on demande une confirmation avant d'enregistrer la sortie.
    """
    from app.db import get_db
    db = await get_db()
    
    now_gmt1 = datetime.now(TIMEZONE)
    current_hour = now_gmt1.hour
    current_minute = now_gmt1.minute
    today = now_gmt1.date().isoformat()
    
    # Délai minimum entre arrivée et sortie (en minutes)
    DELAI_CONFIRMATION_MINUTES = 5
    
    print(f"🕒 Heure actuelle (GMT+1): {now_gmt1.strftime('%H:%M:%S')}")
    
    # Récupérer tous les pointages de l'agent pour aujourd'hui (exclure les annulés)
    existing_pointages = db.table("pointages").select("*").eq("agent_id", agent_id).eq("date_pointage", today).or_("annule.is.null,annule.eq.false").order("heure_pointage").execute()
    pointages_today = existing_pointages.data if existing_pointages.data else []
    
    # Séparer les pointages par session (uniquement les non-annulés)
    pointages_matin = [p for p in pointages_today if p.get("session") == "matin" and not p.get("annule")]
    pointages_aprem = [p for p in pointages_today if p.get("session") == "apres-midi" and not p.get("annule")]
    
    nb_matin = len(pointages_matin)
    nb_aprem = len(pointages_aprem)
    
    print(f"📊 Pointages aujourd'hui - Matin: {nb_matin}, Après-midi: {nb_aprem}")
    
    def check_time_since_arrival(pointage_arrivee) -> tuple[bool, int]:
        """
        Vérifie si le pointage d'arrivée date de moins de DELAI_CONFIRMATION_MINUTES minutes.
        Retourne (needs_confirmation, minutes_depuis_arrivee)
        """
        heure_arrivee_str = pointage_arrivee.get("heure_pointage")
        if not heure_arrivee_str:
            return (False, 0)
        
        # Parser l'heure d'arrivée
        try:
            heure_arrivee = datetime.strptime(heure_arrivee_str, "%H:%M:%S").time()
            # Créer un datetime complet pour aujourd'hui
            arrivee_datetime = datetime.combine(now_gmt1.date(), heure_arrivee)
            arrivee_datetime = arrivee_datetime.replace(tzinfo=TIMEZONE)
            
            # Calculer la différence en minutes
            diff = now_gmt1 - arrivee_datetime
            minutes_depuis = diff.total_seconds() / 60
            
            print(f"⏱️ Minutes depuis l'arrivée: {minutes_depuis:.1f}")
            
            if minutes_depuis < DELAI_CONFIRMATION_MINUTES:
                return (True, int(minutes_depuis))
            return (False, int(minutes_depuis))
        except Exception as e:
            print(f"⚠️ Erreur parsing heure: {e}")
            return (False, 0)
    
    # Logique de détermination:
    # 1. Si on a 1 pointage matin (arrivée) et pas encore de sortie matin → sortie matin
    #    (même si l'heure est >= 12h, tant qu'on est avant 13h ou qu'il manque la sortie)
    # 2. Si on a 0 pointage matin et l'heure < 13h → arrivée matin
    # 3. Si on a 2 pointages matin (complet) et l'heure >= 13h → session après-midi
    # 4. Si on a 1 pointage après-midi (arrivée) → sortie après-midi
    
    # Cas 1: Arrivée matin manquante
    # Si l'agent n'a pas pointé le matin et qu'il est entre 12h30 et 13h, 
    # on considère qu'il est absent le matin et on l'enregistre directement en après-midi
    if nb_matin == 0:
        if current_hour < 12 or (current_hour == 12 and current_minute < 30):
            # Avant 12h30 → pointage matin
            print(f"✅ Pas de pointage matin, heure < 12h30 → Arrivée matin")
            return ("matin", "arrivee", False, "")
        else:
            # À partir de 12h30 sans pointage matin → considéré absent le matin, pointage après-midi
            if nb_aprem == 0:
                print(f"✅ Pas de pointage matin, heure >= 12h30 → Arrivée après-midi (absent matin)")
                return ("apres-midi", "arrivee", False, "")
            elif nb_aprem == 1:
                premier_pointage_aprem = pointages_aprem[0]
                if premier_pointage_aprem.get("type_pointage") == "arrivee":
                    needs_confirm, minutes = check_time_since_arrival(premier_pointage_aprem)
                    if needs_confirm and not force_confirmation:
                        msg = f"Attention : Vous avez pointé votre arrivée il y a seulement {minutes} minute(s). Ce pointage sera enregistré comme une SORTIE. Voulez-vous confirmer ?"
                        print(f"⚠️ Confirmation requise: {msg}")
                        return ("apres-midi", "sortie", True, msg)
                    print(f"✅ Arrivée après-midi faite → Sortie après-midi")
                    return ("apres-midi", "sortie", False, "")
            else:
                raise ValueError("Vous avez déjà effectué tous vos pointages pour aujourd'hui.")
    
    # Cas 2: Arrivée matin faite, sortie matin manquante
    if nb_matin == 1:
        premier_pointage_matin = pointages_matin[0]
        if premier_pointage_matin.get("type_pointage") == "arrivee":
            # Vérifier si moins de 5 minutes depuis l'arrivée
            needs_confirm, minutes = check_time_since_arrival(premier_pointage_matin)
            if needs_confirm and not force_confirmation:
                msg = f"Attention : Vous avez pointé votre arrivée il y a seulement {minutes} minute(s). Ce pointage sera enregistré comme une SORTIE. Voulez-vous confirmer ?"
                print(f"⚠️ Confirmation requise: {msg}")
                return ("matin", "sortie", True, msg)
            print(f"✅ Arrivée matin faite, sortie manquante → Sortie matin")
            return ("matin", "sortie", False, "")
    
    # Cas 3: Session matin complète (2 pointages)
    if nb_matin >= 2:
        # Vérifier la session après-midi
        if nb_aprem == 0:
            # Permettre le pointage après-midi à partir de 12h30 si matin complet
            if current_hour >= 13 or (current_hour == 12 and current_minute >= 30):
                print(f"✅ Matin complet, heure >= 12h30, pas de pointage après-midi → Arrivée après-midi")
                return ("apres-midi", "arrivee", False, "")
            else:
                # Avant 12h30 avec matin complet → attendre 12h30
                raise ValueError("La session du matin est terminée. Vous pouvez pointer l'après-midi à partir de 12h30.")
        elif nb_aprem == 1:
            premier_pointage_aprem = pointages_aprem[0]
            if premier_pointage_aprem.get("type_pointage") == "arrivee":
                # Vérifier si moins de 5 minutes depuis l'arrivée après-midi
                needs_confirm, minutes = check_time_since_arrival(premier_pointage_aprem)
                if needs_confirm and not force_confirmation:
                    msg = f"Attention : Vous avez pointé votre arrivée il y a seulement {minutes} minute(s). Ce pointage sera enregistré comme une SORTIE. Voulez-vous confirmer ?"
                    print(f"⚠️ Confirmation requise: {msg}")
                    return ("apres-midi", "sortie", True, msg)
                print(f"✅ Arrivée après-midi faite, sortie manquante → Sortie après-midi")
                return ("apres-midi", "sortie", False, "")
        else:
            # 2 pointages après-midi = journée complète
            raise ValueError("Vous avez déjà effectué tous vos pointages pour aujourd'hui (4 pointages: 2 matin + 2 après-midi).")
    
    # Cas par défaut (ne devrait pas arriver)
    raise ValueError("Impossible de déterminer le type de pointage. Veuillez contacter l'administrateur.")


async def create_pointage(agent_id: str, qrcode: str, force_confirmation: bool = False) -> Dict[str, Any]:
    """
    Crée un nouveau pointage pour un agent
    Nouvelle logique : 4 pointages par jour
    - Matin : arrivée + sortie
    - Après-midi : arrivée + sortie
    
    La détermination de la session et du type de pointage est intelligente:
    - Elle prend en compte les pointages déjà effectués
    - Un agent qui a fait son arrivée matin aura automatiquement une sortie matin
      même s'il pointe à 12h (pendant la pause)
    
    Si l'agent rescanne dans les 5 minutes après son arrivée, une confirmation est demandée.
    Le paramètre force_confirmation permet de bypasser cette confirmation.
    """
    db = await get_db()
    
    # Vérifier si le QR code est valide
    is_valid = await validate_qrcode(qrcode)
    if not is_valid:
        raise ValueError("QR code invalide ou expiré")
    
    # Utiliser la date GMT+1
    now_gmt1 = datetime.now(TIMEZONE)
    today = now_gmt1.date().isoformat()
    
    # Déterminer la session ET le type de pointage de manière intelligente
    # en fonction des pointages déjà effectués
    try:
        session, type_pointage, needs_confirmation, confirmation_message = await determine_session_for_agent(agent_id, force_confirmation)
        print(f"🔍 Session déterminée: {session}, Type: {type_pointage}, Confirmation: {needs_confirmation}")
        
        # Si une confirmation est requise et pas forcée, retourner sans créer le pointage
        if needs_confirmation:
            return {
                "needs_confirmation": True,
                "confirmation_message": confirmation_message,
                "session": session,
                "type_pointage": type_pointage
            }
    except ValueError as ve:
        print(f"🔴 ValueError: {str(ve)}")
        raise ve
    except Exception as e:
        print(f"⚠️ Erreur lors de la détermination de la session: {str(e)}")
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
        "type_pointage": type_pointage,
        "created_at": pointage_db["created_at"],
        "needs_confirmation": False
    }


async def get_pointages_by_agent(agent_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> List[Dict[str, Any]]:
    """
    Récupère les pointages d'un agent sur une période donnée
    """
    db = await get_db()
    
    try:
        print(f"Récupération des pointages pour l'agent {agent_id} du {start_date} au {end_date}")
        query = db.table("pointages").select("*").eq("agent_id", agent_id)
        
        # Exclure les pointages annulés
        query = query.or_("annule.is.null,annule.eq.false")
        
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
    Récupère tous les pointages pour une date donnée (exclut les annulés)
    """
    db = await get_db()
    
    try:
        print(f"Récupération des pointages pour la date {date_pointage}")
        result = db.table("pointages").select("*").eq("date_pointage", date_pointage.isoformat()).or_("annule.is.null,annule.eq.false").execute()
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


async def create_pointage_offline(agent_id: str, qrcode: str, offline_timestamp: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Crée un pointage avec support pour les timestamps hors-ligne.
    
    Si offline_timestamp est fourni, utilise cette heure pour le pointage.
    Sinon, utilise l'heure actuelle.
    
    Cette fonction est utilisée pour synchroniser les pointages effectués hors-ligne.
    """
    db = await get_db()
    
    # Valider le QR code
    is_valid = await validate_qrcode(qrcode)
    if not is_valid:
        raise ValueError("QR code invalide ou expiré")
    
    # Déterminer l'heure à utiliser
    if offline_timestamp:
        # Utiliser le timestamp hors-ligne
        now_gmt1 = offline_timestamp
        if now_gmt1.tzinfo is None:
            now_gmt1 = now_gmt1.replace(tzinfo=TIMEZONE)
        print(f"📱 Utilisation du timestamp hors-ligne: {now_gmt1}")
    else:
        # Utiliser l'heure actuelle
        now_gmt1 = datetime.now(TIMEZONE)
    
    today = now_gmt1.date().isoformat()
    current_hour = now_gmt1.hour
    
    # Déterminer la session basée sur l'heure du pointage
    if current_hour < 13:
        session = "matin"
    else:
        session = "apres-midi"
    
    # Récupérer les pointages existants pour aujourd'hui
    existing_pointages = db.table("pointages").select("*").eq("agent_id", agent_id).eq("date_pointage", today).or_("annule.is.null,annule.eq.false").order("heure_pointage").execute()
    pointages_today = existing_pointages.data if existing_pointages.data else []
    
    # Filtrer par session
    pointages_session = [p for p in pointages_today if p.get("session") == session and not p.get("annule")]
    nb_pointages = len(pointages_session)
    
    # Déterminer le type de pointage
    if nb_pointages == 0:
        type_pointage = "arrivee"
    elif nb_pointages == 1:
        type_pointage = "sortie"
    else:
        raise ValueError(f"Session {session} déjà complète pour aujourd'hui (arrivée et sortie enregistrées)")
    
    print(f"📱 Pointage hors-ligne - Session: {session}, Type: {type_pointage}, Heure: {now_gmt1.strftime('%H:%M:%S')}")
    
    # Créer le pointage (sans offline_sync car la colonne n'existe pas dans Supabase)
    new_pointage = {
        "id": str(uuid.uuid4()),
        "agent_id": agent_id,
        "date_pointage": today,
        "heure_pointage": now_gmt1.strftime("%H:%M:%S"),
        "session": session,
        "type_pointage": type_pointage
    }
    
    try:
        result = db.table("pointages").insert(new_pointage).execute()
    except Exception as e:
        print(f"❌ Erreur insertion pointage hors-ligne: {str(e)}")
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
        "type_pointage": type_pointage,
        "created_at": pointage_db["created_at"],
        "was_offline": offline_timestamp is not None
    }
