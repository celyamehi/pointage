from datetime import datetime, date, time, timezone, timedelta
from typing import Dict, Any, List
from app.db import get_db

# Fuseau horaire GMT+1
TIMEZONE = timezone(timedelta(hours=1))

# Paramètres de paie (identiques à ceux dans paie/utils.py)
TAUX_HORAIRE = 182.18
HEURES_PAR_JOUR = 8


async def get_agent_daily_tracking(agent_id: str, start_date: date, end_date: date) -> List[Dict[str, Any]]:
    """
    Récupère les détails quotidiens des retards et absences d'un agent
    avec les montants déduits pour chaque jour
    """
    db = await get_db()
    
    # Récupérer tous les pointages de l'agent pour la période
    result = db.table("pointages").select("*").eq("agent_id", agent_id).gte("date", start_date.isoformat()).lte("date", end_date.isoformat()).order("date").execute()
    
    if not result.data:
        return []
    
    # Organiser les pointages par date
    pointages_par_date = {}
    for pointage in result.data:
        date_pointage = pointage["date"]
        if date_pointage not in pointages_par_date:
            pointages_par_date[date_pointage] = {
                "matin_arrivee": None,
                "matin_sortie": None,
                "apres_midi_arrivee": None,
                "apres_midi_sortie": None
            }
        
        session = pointage["session"]
        type_pointage = pointage["type"]
        heure = pointage["heure"]
        
        if session == "matin":
            if type_pointage == "arrivee":
                pointages_par_date[date_pointage]["matin_arrivee"] = heure
            else:
                pointages_par_date[date_pointage]["matin_sortie"] = heure
        else:
            if type_pointage == "arrivee":
                pointages_par_date[date_pointage]["apres_midi_arrivee"] = heure
            else:
                pointages_par_date[date_pointage]["apres_midi_sortie"] = heure
    
    # Analyser chaque jour
    tracking_data = []
    current_date = start_date
    
    while current_date <= end_date:
        date_str = current_date.isoformat()
        jour_data = pointages_par_date.get(date_str, {
            "matin_arrivee": None,
            "matin_sortie": None,
            "apres_midi_arrivee": None,
            "apres_midi_sortie": None
        })
        
        # Calculer les retards
        retard_matin_minutes = 0
        retard_apres_midi_minutes = 0
        
        if jour_data.get("matin_arrivee"):
            heure_arrivee = datetime.fromisoformat(jour_data["matin_arrivee"]).time()
            heure_debut_matin = time(8, 0)
            
            if heure_arrivee > heure_debut_matin:
                delta = datetime.combine(date.min, heure_arrivee) - datetime.combine(date.min, heure_debut_matin)
                retard_matin_minutes = int(delta.total_seconds() / 60)
        
        if jour_data.get("apres_midi_arrivee"):
            heure_arrivee = datetime.fromisoformat(jour_data["apres_midi_arrivee"]).time()
            heure_debut_apres_midi = time(13, 0)
            
            if heure_arrivee > heure_debut_apres_midi:
                delta = datetime.combine(date.min, heure_arrivee) - datetime.combine(date.min, heure_debut_apres_midi)
                retard_apres_midi_minutes = int(delta.total_seconds() / 60)
        
        retard_total_minutes = retard_matin_minutes + retard_apres_midi_minutes
        retard_total_heures = round(retard_total_minutes / 60, 2)
        
        # Déterminer si c'est une absence
        est_absent = not (jour_data.get("matin_arrivee") and jour_data.get("apres_midi_sortie"))
        
        # Calculer les montants déduits
        montant_retard = round(retard_total_heures * TAUX_HORAIRE, 2) if retard_total_minutes > 0 else 0
        montant_absence = round(HEURES_PAR_JOUR * TAUX_HORAIRE, 2) if est_absent else 0
        montant_total_deduit = montant_retard + montant_absence
        
        # Déterminer le statut
        if est_absent:
            statut = "Absent"
        elif retard_total_minutes > 0:
            statut = "Retard"
        else:
            statut = "Présent"
        
        tracking_data.append({
            "date": date_str,
            "jour_semaine": current_date.strftime("%A"),
            "statut": statut,
            "retard_matin_minutes": retard_matin_minutes,
            "retard_apres_midi_minutes": retard_apres_midi_minutes,
            "retard_total_minutes": retard_total_minutes,
            "retard_total_heures": retard_total_heures,
            "est_absent": est_absent,
            "montant_retard": montant_retard,
            "montant_absence": montant_absence,
            "montant_total_deduit": montant_total_deduit,
            "pointages": {
                "matin_arrivee": jour_data.get("matin_arrivee"),
                "matin_sortie": jour_data.get("matin_sortie"),
                "apres_midi_arrivee": jour_data.get("apres_midi_arrivee"),
                "apres_midi_sortie": jour_data.get("apres_midi_sortie")
            }
        })
        
        current_date += timedelta(days=1)
    
    return tracking_data
