import secrets
import hashlib
from datetime import datetime, date, timedelta
from typing import Optional, List
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.db import get_db

# Header pour la clé API
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


def generate_api_key() -> str:
    """Génère une clé API sécurisée"""
    return f"collable_{secrets.token_urlsafe(32)}"


def hash_api_key(api_key: str) -> str:
    """Hash une clé API pour le stockage"""
    return hashlib.sha256(api_key.encode()).hexdigest()


async def verify_api_key(api_key: str = Security(API_KEY_HEADER)) -> dict:
    """
    Vérifie la validité d'une clé API
    Retourne les informations de la clé si valide
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clé API manquante. Utilisez le header X-API-Key"
        )
    
    db = await get_db()
    
    # Hasher la clé pour la comparaison
    hashed_key = hash_api_key(api_key)
    
    # Rechercher la clé dans la base
    result = db.table("api_keys").select("*").eq("api_key_hash", hashed_key).eq("actif", True).execute()
    
    if not result.data or len(result.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clé API invalide ou désactivée"
        )
    
    key_data = result.data[0]
    
    # Mettre à jour la date de dernière utilisation
    db.table("api_keys").update({"last_used_at": datetime.now().isoformat()}).eq("id", key_data["id"]).execute()
    
    return key_data


async def create_api_key(nom: str, description: Optional[str] = None) -> dict:
    """Crée une nouvelle clé API"""
    db = await get_db()
    
    # Générer la clé
    api_key = generate_api_key()
    api_key_hash = hash_api_key(api_key)
    
    # Créer l'entrée en base
    new_key = {
        "nom": nom,
        "description": description,
        "api_key_hash": api_key_hash,
        "api_key_preview": api_key[:16] + "...",
        "actif": True,
        "created_at": datetime.now().isoformat()
    }
    
    result = db.table("api_keys").insert(new_key).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création de la clé API"
        )
    
    # Retourner la clé complète (une seule fois, elle ne sera plus visible après)
    created = result.data[0]
    return {
        "id": created["id"],
        "nom": created["nom"],
        "api_key": api_key,  # Clé complète, visible une seule fois
        "description": created["description"],
        "actif": created["actif"],
        "created_at": created["created_at"]
    }


async def list_api_keys() -> List[dict]:
    """Liste toutes les clés API (sans les clés complètes)"""
    db = await get_db()
    result = db.table("api_keys").select("id, nom, api_key_preview, description, actif, created_at, last_used_at").order("created_at", desc=True).execute()
    return result.data if result.data else []


async def toggle_api_key(key_id: str, actif: bool) -> dict:
    """Active ou désactive une clé API"""
    db = await get_db()
    result = db.table("api_keys").update({"actif": actif}).eq("id", key_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clé API non trouvée"
        )
    
    return result.data[0]


async def delete_api_key(key_id: str) -> bool:
    """Supprime une clé API"""
    db = await get_db()
    db.table("api_keys").delete().eq("id", key_id).execute()
    return True


async def get_all_agents_external() -> List[dict]:
    """Récupère la liste de tous les agents pour l'API externe"""
    db = await get_db()
    result = db.table("agents").select("id, nom, email, role").order("nom").execute()
    return result.data if result.data else []


async def get_agent_attendance(agent_id: str, mois: str) -> dict:
    """
    Récupère les données de présence d'un agent pour un mois donné
    Format mois: "2024-12"
    """
    db = await get_db()
    
    # Vérifier que l'agent existe
    agent_result = db.table("agents").select("id, nom, email").eq("id", agent_id).execute()
    
    if not agent_result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent non trouvé: {agent_id}"
        )
    
    agent = agent_result.data[0]
    
    # Parser le mois
    try:
        annee, mois_num = mois.split("-")
        annee = int(annee)
        mois_num = int(mois_num)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format de mois invalide. Utilisez YYYY-MM (ex: 2024-12)"
        )
    
    # Calculer les dates de début et fin du mois
    start_date = date(annee, mois_num, 1)
    if mois_num == 12:
        end_date = date(annee + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(annee, mois_num + 1, 1) - timedelta(days=1)
    
    # Récupérer les pointages du mois
    pointages_result = db.table("pointages").select("*").eq("agent_id", agent_id).gte("date_pointage", start_date.isoformat()).lte("date_pointage", end_date.isoformat()).order("date_pointage").execute()
    
    pointages = pointages_result.data if pointages_result.data else []
    
    # Organiser les pointages par date
    pointages_par_date = {}
    for p in pointages:
        date_p = p["date_pointage"]
        if date_p not in pointages_par_date:
            pointages_par_date[date_p] = []
        pointages_par_date[date_p].append(p)
    
    # Heures de référence pour les retards
    HEURE_DEBUT_MATIN = 8 * 60  # 8h00 en minutes
    HEURE_DEBUT_APREM = 14 * 60  # 14h00 en minutes
    
    # Calculer les détails jour par jour
    details = []
    total_retard_minutes = 0
    total_absences = 0
    jours_travailles = 0
    
    current_date = start_date
    while current_date <= end_date:
        # Ignorer les weekends
        if current_date.weekday() < 5:  # Lundi = 0, Vendredi = 4
            date_str = current_date.isoformat()
            pointages_jour = pointages_par_date.get(date_str, [])
            
            retard_matin = 0
            retard_aprem = 0
            est_present = False
            est_absent = True
            
            for p in pointages_jour:
                est_present = True
                est_absent = False
                
                # Calculer le retard
                heure_str = p.get("heure_pointage", "00:00:00")
                try:
                    parties = heure_str.split(":")
                    heure_minutes = int(parties[0]) * 60 + int(parties[1])
                    
                    session = p.get("session", "")
                    type_pointage = p.get("type_pointage", "entree")
                    
                    if type_pointage == "entree":
                        if session == "matin" and heure_minutes > HEURE_DEBUT_MATIN:
                            retard_matin = max(retard_matin, heure_minutes - HEURE_DEBUT_MATIN)
                        elif session == "apres-midi" and heure_minutes > HEURE_DEBUT_APREM:
                            retard_aprem = max(retard_aprem, heure_minutes - HEURE_DEBUT_APREM)
                except:
                    pass
            
            retard_total = retard_matin + retard_aprem
            total_retard_minutes += retard_total
            
            if est_absent and current_date <= date.today():
                total_absences += 1
            
            if est_present:
                jours_travailles += 1
            
            details.append({
                "date": date_str,
                "est_present": est_present,
                "est_absent": est_absent and current_date <= date.today(),
                "retard_matin_minutes": retard_matin,
                "retard_apres_midi_minutes": retard_aprem,
                "retard_total_minutes": retard_total
            })
        
        current_date += timedelta(days=1)
    
    return {
        "agent_id": agent["id"],
        "agent_nom": agent["nom"],
        "agent_email": agent["email"],
        "periode": mois,
        "resume": {
            "jours_travailles": jours_travailles,
            "jours_absences": total_absences,
            "retard_total_minutes": total_retard_minutes,
            "retard_total_heures": round(total_retard_minutes / 60, 2)
        },
        "details": details
    }
