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
    
    try:
        # Récupérer les jours fériés de la période
        jours_feries_response = db.table("jours_feries").select("date_ferie, nom").gte("date_ferie", start_date.isoformat()).lte("date_ferie", end_date.isoformat()).execute()
        jours_feries_dict = {jf["date_ferie"]: jf["nom"] for jf in (jours_feries_response.data or [])}
        print(f"📅 Jours fériés trouvés: {len(jours_feries_dict)}")
        
        # Récupérer les exceptions pour cet agent (jours fériés où il travaille)
        exceptions_response = db.table("jours_feries_exceptions").select("jour_ferie_id, jours_feries(date_ferie)").eq("agent_id", agent_id).execute()
        exceptions_dates = set()
        for exc in (exceptions_response.data or []):
            if exc.get("jours_feries") and exc["jours_feries"].get("date_ferie"):
                exceptions_dates.add(exc["jours_feries"]["date_ferie"])
        print(f"📋 Exceptions agent: {len(exceptions_dates)} jours fériés travaillés")
        
        # Récupérer tous les pointages de l'agent pour la période (exclure les annulés)
        print(f"📊 Récupération des pointages pour agent {agent_id} du {start_date} au {end_date}")
        result = db.table("pointages").select("*").eq("agent_id", agent_id).gte("date_pointage", start_date.isoformat()).lte("date_pointage", end_date.isoformat()).or_("annule.is.null,annule.eq.false").execute()
        
        print(f"✅ {len(result.data) if result.data else 0} pointages récupérés")
    except Exception as e:
        print(f"❌ Erreur lors de la récupération des pointages: {str(e)}")
        # Retourner une liste vide en cas d'erreur pour éviter de bloquer
        result = type('obj', (object,), {'data': None})()
        jours_feries_dict = {}
        exceptions_dates = set()
    
    if not result.data:
        print("ℹ️ Aucun pointage trouvé pour cette période")
        # Retourner quand même les jours avec statut "Absent" (sauf jours fériés)
        tracking_data = []
        current_date = start_date
        
        while current_date <= end_date:
            date_str = current_date.isoformat()
            
            # Vérifier si c'est un jour férié (sauf si l'agent a une exception)
            if date_str in jours_feries_dict and date_str not in exceptions_dates:
                tracking_data.append({
                    "date": date_str,
                    "jour_semaine": current_date.strftime("%A"),
                    "statut": "Jour férié",
                    "jour_ferie_nom": jours_feries_dict[date_str],
                    "est_jour_ferie": True,
                    "retard_matin_minutes": 0,
                    "retard_apres_midi_minutes": 0,
                    "retard_total_minutes": 0,
                    "retard_total_heures": 0,
                    "est_absent": False,
                    "absent_matin": False,
                    "absent_apres_midi": False,
                    "montant_retard": 0,
                    "montant_absence": 0,
                    "montant_total_deduit": 0,
                    "pointages": {
                        "matin_arrivee": None,
                        "matin_sortie": None,
                        "apres_midi_arrivee": None,
                        "apres_midi_sortie": None
                    }
                })
                current_date += timedelta(days=1)
                continue
            
            # Absence complète : 8h × 182,18 DA + 200 DA + 500 DA
            montant_absence_base = round(HEURES_PAR_JOUR * TAUX_HORAIRE, 2)
            frais_supplementaires = 700  # 200 + 500
            montant_total = montant_absence_base + frais_supplementaires
            
            tracking_data.append({
                "date": date_str,
                "jour_semaine": current_date.strftime("%A"),
                "statut": "Absent",
                "est_jour_ferie": False,
                "retard_matin_minutes": 0,
                "retard_apres_midi_minutes": 0,
                "retard_total_minutes": 0,
                "retard_total_heures": 0,
                "est_absent": True,
                "absent_matin": True,
                "absent_apres_midi": True,
                "montant_retard": 0,
                "montant_absence": montant_total,
                "montant_absence_matin": round((HEURES_PAR_JOUR / 2) * TAUX_HORAIRE, 2),
                "montant_absence_apres_midi": round((HEURES_PAR_JOUR / 2) * TAUX_HORAIRE, 2),
                "frais_absence_complete": frais_supplementaires,
                "montant_total_deduit": montant_total,
                "pointages": {
                    "matin_arrivee": None,
                    "matin_sortie": None,
                    "apres_midi_arrivee": None,
                    "apres_midi_sortie": None
                }
            })
            current_date += timedelta(days=1)
        
        return tracking_data
    
    # Organiser les pointages par date
    pointages_par_date = {}
    for pointage in result.data:
        date_pointage = pointage["date_pointage"]
        if date_pointage not in pointages_par_date:
            pointages_par_date[date_pointage] = {
                "matin_arrivee": None,
                "matin_sortie": None,
                "apres_midi_arrivee": None,
                "apres_midi_sortie": None
            }
        
        session = pointage["session"]
        type_pointage = pointage.get("type_pointage", "arrivee")
        heure = pointage["heure_pointage"]
        
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
        
        # Vérifier si c'est un jour férié (sauf si l'agent a une exception)
        if date_str in jours_feries_dict and date_str not in exceptions_dates:
            tracking_data.append({
                "date": date_str,
                "jour_semaine": current_date.strftime("%A"),
                "statut": "Jour férié",
                "jour_ferie_nom": jours_feries_dict[date_str],
                "est_jour_ferie": True,
                "retard_matin_minutes": 0,
                "retard_apres_midi_minutes": 0,
                "retard_total_minutes": 0,
                "retard_total_heures": 0,
                "est_absent": False,
                "absent_matin": False,
                "absent_apres_midi": False,
                "montant_retard": 0,
                "montant_absence": 0,
                "montant_total_deduit": 0,
                "pointages": {
                    "matin_arrivee": None,
                    "matin_sortie": None,
                    "apres_midi_arrivee": None,
                    "apres_midi_sortie": None
                }
            })
            current_date += timedelta(days=1)
            continue
        
        jour_data = pointages_par_date.get(date_str, {
            "matin_arrivee": None,
            "matin_sortie": None,
            "apres_midi_arrivee": None,
            "apres_midi_sortie": None
        })
        
        # Calculer les retards (arrivées tardives + sorties anticipées)
        retard_matin_minutes = 0
        retard_apres_midi_minutes = 0
        sortie_anticipee_matin_minutes = 0
        sortie_anticipee_apres_midi_minutes = 0
        
        # Retard à l'arrivée du matin (à partir de 08h05)
        if jour_data.get("matin_arrivee"):
            heure_str = jour_data["matin_arrivee"]
            if isinstance(heure_str, str):
                heure_arrivee = datetime.strptime(heure_str, "%H:%M:%S").time()
            else:
                heure_arrivee = heure_str
            heure_debut_matin = time(8, 5)  # 08h05 - 5 minutes de tolérance
            
            if heure_arrivee > heure_debut_matin:
                delta = datetime.combine(date.min, heure_arrivee) - datetime.combine(date.min, heure_debut_matin)
                retard_matin_minutes = int(delta.total_seconds() / 60)
        
        # Sortie anticipée du matin (avant 12:00)
        if jour_data.get("matin_sortie"):
            heure_str = jour_data["matin_sortie"]
            if isinstance(heure_str, str):
                heure_sortie = datetime.strptime(heure_str, "%H:%M:%S").time()
            else:
                heure_sortie = heure_str
            heure_fin_matin = time(12, 0)
            
            if heure_sortie < heure_fin_matin:
                delta = datetime.combine(date.min, heure_fin_matin) - datetime.combine(date.min, heure_sortie)
                sortie_anticipee_matin_minutes = int(delta.total_seconds() / 60)
        
        # Retard à l'arrivée de l'après-midi
        if jour_data.get("apres_midi_arrivee"):
            heure_str = jour_data["apres_midi_arrivee"]
            if isinstance(heure_str, str):
                heure_arrivee = datetime.strptime(heure_str, "%H:%M:%S").time()
            else:
                heure_arrivee = heure_str
            heure_debut_apres_midi = time(13, 0)
            
            if heure_arrivee > heure_debut_apres_midi:
                delta = datetime.combine(date.min, heure_arrivee) - datetime.combine(date.min, heure_debut_apres_midi)
                retard_apres_midi_minutes = int(delta.total_seconds() / 60)
        
        # Sortie anticipée de l'après-midi (avant 17:00)
        if jour_data.get("apres_midi_sortie"):
            heure_str = jour_data["apres_midi_sortie"]
            if isinstance(heure_str, str):
                heure_sortie = datetime.strptime(heure_str, "%H:%M:%S").time()
            else:
                heure_sortie = heure_str
            heure_fin_apres_midi = time(17, 0)
            
            if heure_sortie < heure_fin_apres_midi:
                delta = datetime.combine(date.min, heure_fin_apres_midi) - datetime.combine(date.min, heure_sortie)
                sortie_anticipee_apres_midi_minutes = int(delta.total_seconds() / 60)
        
        # Total des retards (arrivées tardives + sorties anticipées)
        retard_total_minutes = retard_matin_minutes + retard_apres_midi_minutes + sortie_anticipee_matin_minutes + sortie_anticipee_apres_midi_minutes
        retard_total_heures = round(retard_total_minutes / 60, 2)
        
        # Calculer les absences par demi-journée (4h par session)
        heures_par_session = HEURES_PAR_JOUR / 2  # 4 heures
        
        # Absence matin : AUCUN pointage matin (ni arrivée ni sortie)
        absent_matin = not (jour_data.get("matin_arrivee") or jour_data.get("matin_sortie"))
        
        # Absence après-midi : AUCUN pointage après-midi (ni arrivée ni sortie)
        absent_apres_midi = not (jour_data.get("apres_midi_arrivee") or jour_data.get("apres_midi_sortie"))
        
        # Calculer les montants déduits
        # Pour les retards : seulement si l'agent est présent (a pointé)
        montant_retard = round(retard_total_heures * TAUX_HORAIRE, 2) if retard_total_minutes > 0 else 0
        
        # Montant absence : 182,18 DA × 4h par session absente
        montant_absence_matin = round(heures_par_session * TAUX_HORAIRE, 2) if absent_matin else 0
        montant_absence_apres_midi = round(heures_par_session * TAUX_HORAIRE, 2) if absent_apres_midi else 0
        
        # Déterminer le statut global
        est_absent = absent_matin and absent_apres_midi
        
        # Frais supplémentaires pour absence complète journée
        frais_absence_complete = 0
        if est_absent:
            frais_absence_complete = 200 + 500  # 700 DA de frais supplémentaires
        
        montant_absence = montant_absence_matin + montant_absence_apres_midi + frais_absence_complete
        
        montant_total_deduit = montant_retard + montant_absence
        
        if est_absent:
            statut = "Absent"
        elif absent_matin or absent_apres_midi:
            statut = "Absence partielle"
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
            "sortie_anticipee_matin_minutes": sortie_anticipee_matin_minutes,
            "sortie_anticipee_apres_midi_minutes": sortie_anticipee_apres_midi_minutes,
            "retard_total_minutes": retard_total_minutes,
            "retard_total_heures": retard_total_heures,
            "est_absent": est_absent,
            "absent_matin": absent_matin,
            "absent_apres_midi": absent_apres_midi,
            "montant_retard": montant_retard,
            "montant_absence": montant_absence,
            "montant_absence_matin": montant_absence_matin,
            "montant_absence_apres_midi": montant_absence_apres_midi,
            "frais_absence_complete": frais_absence_complete,
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
