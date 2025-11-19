from datetime import datetime, date, time, timedelta, timezone
from typing import Dict, Any, List
import calendar
import logging

from app.db import get_db
from app.paie.models import ParametresPaie, CalculPaie

logger = logging.getLogger(__name__)

# Fuseau horaire GMT+1
TIMEZONE = timezone(timedelta(hours=1))

# Paramètres de paie par rôle
PARAMETRES_PAIE_PAR_ROLE = {
    "agent": ParametresPaie(
        role="agent",
        taux_horaire=182.18,
        heures_par_jour=8,
        heures_par_mois=174,
        jours_travail_mois=22,
        frais_panier=500.0,
        frais_transport=200.0
    ),
    "admin": ParametresPaie(
        role="admin",
        taux_horaire=250.0,  # À ajuster selon vos besoins
        heures_par_jour=8,
        heures_par_mois=174,
        jours_travail_mois=22,
        frais_panier=500.0,
        frais_transport=200.0
    ),
    "informaticien": ParametresPaie(
        role="informaticien",
        taux_horaire=250.0,  # À ajuster
        heures_par_jour=8,
        heures_par_mois=174,
        jours_travail_mois=22,
        frais_panier=500.0,
        frais_transport=200.0
    ),
    "analyste_informaticienne": ParametresPaie(
        role="analyste_informaticienne",
        taux_horaire=230.0,  # À ajuster
        heures_par_jour=8,
        heures_par_mois=174,
        jours_travail_mois=22,
        frais_panier=500.0,
        frais_transport=200.0
    ),
    "superviseur": ParametresPaie(
        role="superviseur",
        taux_horaire=220.0,  # À ajuster
        heures_par_jour=8,
        heures_par_mois=174,
        jours_travail_mois=22,
        frais_panier=500.0,
        frais_transport=200.0
    ),
    "agent_administratif": ParametresPaie(
        role="agent_administratif",
        taux_horaire=200.0,  # À ajuster
        heures_par_jour=8,
        heures_par_mois=174,
        jours_travail_mois=22,
        frais_panier=500.0,
        frais_transport=200.0
    ),
    "charge_administration": ParametresPaie(
        role="charge_administration",
        taux_horaire=210.0,  # À ajuster
        heures_par_jour=8,
        heures_par_mois=174,
        jours_travail_mois=22,
        frais_panier=500.0,
        frais_transport=200.0
    )
}


def calculer_retard_minutes(heure_arrivee: time, heure_debut_theorique: time = time(8, 0)) -> int:
    """
    Calcule le retard en minutes
    """
    if heure_arrivee <= heure_debut_theorique:
        return 0
    
    # Convertir en minutes depuis minuit
    minutes_arrivee = heure_arrivee.hour * 60 + heure_arrivee.minute
    minutes_debut = heure_debut_theorique.hour * 60 + heure_debut_theorique.minute
    
    retard = minutes_arrivee - minutes_debut
    return max(0, retard)


async def calculer_paie_agent(agent_id: str, mois: int, annee: int) -> CalculPaie:
    """
    Calcule la paie d'un agent pour un mois donné
    """
    db = await get_db()
    
    # Récupérer les informations de l'agent
    agent_response = db.table("agents").select("*").eq("id", agent_id).execute()
    
    if not agent_response.data or len(agent_response.data) == 0:
        raise ValueError(f"Agent {agent_id} non trouvé")
    
    agent = agent_response.data[0]
    
    # Vérifier les champs obligatoires
    if not agent.get("nom"):
        raise ValueError(f"Agent {agent_id}: champ 'nom' manquant")
    if not agent.get("email"):
        raise ValueError(f"Agent {agent_id}: champ 'email' manquant")
    
    role = agent.get("role", "agent")
    
    # Récupérer les paramètres de paie pour ce rôle
    params = PARAMETRES_PAIE_PAR_ROLE.get(role, PARAMETRES_PAIE_PAR_ROLE["agent"])
    
    # Calculer les dates de début et fin du mois
    premier_jour = date(annee, mois, 1)
    dernier_jour_mois = date(annee, mois, calendar.monthrange(annee, mois)[1])
    
    # Limiter au jour actuel si on est dans le mois en cours
    aujourd_hui = date.today()
    if annee == aujourd_hui.year and mois == aujourd_hui.month:
        dernier_jour = aujourd_hui
    else:
        dernier_jour = dernier_jour_mois
    
    logger.info(f"Calcul de paie pour {agent['nom']} ({role}) - {mois}/{annee} (jusqu'au {dernier_jour})")
    
    # Récupérer tous les pointages du mois
    pointages_response = db.table("pointages").select("*").eq("agent_id", agent_id).gte("date_pointage", premier_jour.isoformat()).lte("date_pointage", dernier_jour.isoformat()).order("date_pointage").execute()
    
    pointages = pointages_response.data if pointages_response.data else []
    
    # Organiser les pointages par date
    pointages_par_date = {}
    for pointage in pointages:
        date_p = pointage["date_pointage"]
        if date_p not in pointages_par_date:
            pointages_par_date[date_p] = {
                "matin_arrivee": None,
                "matin_sortie": None,
                "apres_midi_arrivee": None,
                "apres_midi_sortie": None
            }
        
        session = pointage["session"]
        type_p = pointage.get("type_pointage", "arrivee")
        heure = pointage["heure_pointage"]
        
        if session == "matin":
            if type_p == "arrivee":
                pointages_par_date[date_p]["matin_arrivee"] = heure
            else:
                pointages_par_date[date_p]["matin_sortie"] = heure
        else:
            if type_p == "arrivee":
                pointages_par_date[date_p]["apres_midi_arrivee"] = heure
            else:
                pointages_par_date[date_p]["apres_midi_sortie"] = heure
    
    # Calculer les jours ouvrés du mois (exclure samedi et dimanche)
    jours_ouvres = 0
    current_date = premier_jour
    while current_date <= dernier_jour:
        if current_date.weekday() < 5:  # Lundi=0, Vendredi=4
            jours_ouvres += 1
        current_date += timedelta(days=1)
    
    # Analyser chaque jour
    jours_travailles = 0
    jours_absence = 0
    jours_presence = 0  # Jours où l'agent est présent (même partiellement) pour les frais
    heures_retard_total = 0.0
    details_absences = []
    details_retards = []
    
    current_date = premier_jour
    while current_date <= dernier_jour:
        # Ne compter que les jours ouvrés
        if current_date.weekday() >= 5:  # Samedi ou dimanche
            current_date += timedelta(days=1)
            continue
        
        date_str = current_date.isoformat()
        
        if date_str in pointages_par_date:
            jour_data = pointages_par_date[date_str]
            
            # Vérifier les absences par session (même logique que suivi_utils.py)
            # Absence matin : AUCUN pointage matin (ni arrivée ni sortie)
            absent_matin = not (jour_data.get("matin_arrivee") or jour_data.get("matin_sortie"))
            
            # Absence après-midi : AUCUN pointage après-midi (ni arrivée ni sortie)
            absent_apres_midi = not (jour_data.get("apres_midi_arrivee") or jour_data.get("apres_midi_sortie"))
            
            # Absence complète = absent matin ET après-midi
            absence_complete = absent_matin and absent_apres_midi
            
            print(f"📅 {date_str}: matin_arr={jour_data.get('matin_arrivee')}, matin_sort={jour_data.get('matin_sortie')}, "
                  f"apm_arr={jour_data.get('apres_midi_arrivee')}, apm_sort={jour_data.get('apres_midi_sortie')}")
            print(f"   → Absent matin: {absent_matin}, Absent après-midi: {absent_apres_midi}, Absence complète: {absence_complete}")
            
            if absence_complete:
                # Absence complète
                jours_absence += 1
                details_absences.append({
                    "date": date_str,
                    "type": "absence_complete"
                })
            elif absent_matin or absent_apres_midi:
                # Absence partielle
                jours_absence += 0.5  # Compter comme demi-journée
                details_absences.append({
                    "date": date_str,
                    "type": "absence_partielle",
                    "session": "matin" if absent_matin else "apres_midi"
                })
                
                # Si présent au moins une session, compter comme jour travaillé
                jours_travailles += 0.5
                # Compter comme jour de présence pour les frais (panier/transport)
                jours_presence += 1
                
                # Calculer le retard à l'arrivée matin si présent
                if jour_data.get("matin_arrivee") and not absent_matin:
                    heure_arrivee = datetime.strptime(jour_data["matin_arrivee"], "%H:%M:%S").time()
                    retard_minutes = calculer_retard_minutes(heure_arrivee)
                    
                    if retard_minutes > 0:
                        heures_retard_total += retard_minutes / 60.0
                        details_retards.append({
                            "date": date_str,
                            "minutes": retard_minutes,
                            "heures": round(retard_minutes / 60.0, 2)
                        })
                
                # Calculer la sortie anticipée matin si présent
                if jour_data.get("matin_sortie") and not absent_matin:
                    heure_sortie = datetime.strptime(jour_data["matin_sortie"], "%H:%M:%S").time()
                    heure_fin_matin = time(12, 0)
                    
                    if heure_sortie < heure_fin_matin:
                        delta = datetime.combine(date.min, heure_fin_matin) - datetime.combine(date.min, heure_sortie)
                        sortie_anticipee_minutes = int(delta.total_seconds() / 60)
                        
                        if sortie_anticipee_minutes > 0:
                            heures_retard_total += sortie_anticipee_minutes / 60.0
                            details_retards.append({
                                "date": date_str,
                                "minutes": sortie_anticipee_minutes,
                                "heures": round(sortie_anticipee_minutes / 60.0, 2),
                                "type": "sortie_anticipee_matin"
                            })
                
                # Calculer le retard à l'arrivée après-midi si présent
                if jour_data.get("apres_midi_arrivee") and not absent_apres_midi:
                    heure_arrivee = datetime.strptime(jour_data["apres_midi_arrivee"], "%H:%M:%S").time()
                    heure_debut_apres_midi = time(13, 0)
                    
                    if heure_arrivee > heure_debut_apres_midi:
                        delta = datetime.combine(date.min, heure_arrivee) - datetime.combine(date.min, heure_debut_apres_midi)
                        retard_minutes = int(delta.total_seconds() / 60)
                        
                        if retard_minutes > 0:
                            heures_retard_total += retard_minutes / 60.0
                            details_retards.append({
                                "date": date_str,
                                "minutes": retard_minutes,
                                "heures": round(retard_minutes / 60.0, 2)
                            })
                
                # Calculer la sortie anticipée après-midi si présent
                if jour_data.get("apres_midi_sortie") and not absent_apres_midi:
                    heure_sortie = datetime.strptime(jour_data["apres_midi_sortie"], "%H:%M:%S").time()
                    heure_fin_apres_midi = time(17, 0)
                    
                    if heure_sortie < heure_fin_apres_midi:
                        delta = datetime.combine(date.min, heure_fin_apres_midi) - datetime.combine(date.min, heure_sortie)
                        sortie_anticipee_minutes = int(delta.total_seconds() / 60)
                        
                        if sortie_anticipee_minutes > 0:
                            heures_retard_total += sortie_anticipee_minutes / 60.0
                            details_retards.append({
                                "date": date_str,
                                "minutes": sortie_anticipee_minutes,
                                "heures": round(sortie_anticipee_minutes / 60.0, 2),
                                "type": "sortie_anticipee_apres_midi"
                            })
            else:
                # Présent toute la journée
                jours_travailles += 1
                jours_presence += 1  # Compter pour les frais
                
                # Calculer le retard à l'arrivée du matin
                if jour_data.get("matin_arrivee"):
                    heure_arrivee = datetime.strptime(jour_data["matin_arrivee"], "%H:%M:%S").time()
                    retard_minutes = calculer_retard_minutes(heure_arrivee)
                    
                    if retard_minutes > 0:
                        heures_retard_total += retard_minutes / 60.0
                        details_retards.append({
                            "date": date_str,
                            "minutes": retard_minutes,
                            "heures": round(retard_minutes / 60.0, 2)
                        })
                
                # Calculer la sortie anticipée du matin (avant 12:00)
                if jour_data.get("matin_sortie"):
                    heure_sortie = datetime.strptime(jour_data["matin_sortie"], "%H:%M:%S").time()
                    heure_fin_matin = time(12, 0)
                    
                    if heure_sortie < heure_fin_matin:
                        delta = datetime.combine(date.min, heure_fin_matin) - datetime.combine(date.min, heure_sortie)
                        sortie_anticipee_minutes = int(delta.total_seconds() / 60)
                        
                        if sortie_anticipee_minutes > 0:
                            heures_retard_total += sortie_anticipee_minutes / 60.0
                            details_retards.append({
                                "date": date_str,
                                "minutes": sortie_anticipee_minutes,
                                "heures": round(sortie_anticipee_minutes / 60.0, 2),
                                "type": "sortie_anticipee_matin"
                            })
                
                # Calculer le retard à l'arrivée après-midi
                if jour_data.get("apres_midi_arrivee"):
                    heure_arrivee = datetime.strptime(jour_data["apres_midi_arrivee"], "%H:%M:%S").time()
                    heure_debut_apres_midi = time(13, 0)
                    
                    if heure_arrivee > heure_debut_apres_midi:
                        delta = datetime.combine(date.min, heure_arrivee) - datetime.combine(date.min, heure_debut_apres_midi)
                        retard_minutes = int(delta.total_seconds() / 60)
                        
                        if retard_minutes > 0:
                            heures_retard_total += retard_minutes / 60.0
                            details_retards.append({
                                "date": date_str,
                                "minutes": retard_minutes,
                                "heures": round(retard_minutes / 60.0, 2)
                            })
                
                # Calculer la sortie anticipée de l'après-midi (avant 17:00)
                if jour_data.get("apres_midi_sortie"):
                    heure_sortie = datetime.strptime(jour_data["apres_midi_sortie"], "%H:%M:%S").time()
                    heure_fin_apres_midi = time(17, 0)
                    
                    if heure_sortie < heure_fin_apres_midi:
                        delta = datetime.combine(date.min, heure_fin_apres_midi) - datetime.combine(date.min, heure_sortie)
                        sortie_anticipee_minutes = int(delta.total_seconds() / 60)
                        
                        if sortie_anticipee_minutes > 0:
                            heures_retard_total += sortie_anticipee_minutes / 60.0
                            details_retards.append({
                                "date": date_str,
                                "minutes": sortie_anticipee_minutes,
                                "heures": round(sortie_anticipee_minutes / 60.0, 2),
                                "type": "sortie_anticipee_apres_midi"
                            })
        else:
            # Pas de pointage = absence complète
            jours_absence += 1
            details_absences.append({
                "date": date_str,
                "type": "absence_complete"
            })
        
        current_date += timedelta(days=1)
    
    # Calculs financiers
    heures_theoriques = params.heures_par_mois
    heures_absence = jours_absence * params.heures_par_jour
    
    # Heures travaillées = jours réellement travaillés × 8h - retards
    heures_travaillees = (jours_travailles * params.heures_par_jour) - heures_retard_total
    
    # Salaire de base = Taux horaire × Heures travaillées (et non heures théoriques)
    # Les absences et retards sont déjà pris en compte dans le calcul des heures travaillées
    salaire_base = params.taux_horaire * heures_travaillees
    
    # Frais calculés selon les jours de présence (même partielle)
    # Si l'agent est présent au moins une session, il a droit aux frais
    jours_panier = jours_presence
    jours_transport = jours_presence
    frais_panier_total = jours_panier * params.frais_panier
    frais_transport_total = jours_transport * params.frais_transport
    
    # Pas de déductions séparées : tout est dans le calcul des heures travaillées
    deduction_absences = 0  # Les absences sont déjà dans heures_travaillees
    deduction_retards = 0  # Les retards sont déjà dans heures_travaillees
    
    # Salaire net = Salaire de base + Frais
    salaire_net = salaire_base + frais_panier_total + frais_transport_total
    
    # Récupérer les primes pour ce mois
    primes_response = db.table("primes").select("*").eq("agent_id", agent_id).eq("mois", mois).eq("annee", annee).execute()
    
    details_primes = []
    primes_total = 0.0
    
    if primes_response.data:
        for prime in primes_response.data:
            primes_total += prime["montant"]
            details_primes.append({
                "montant": prime["montant"],
                "motif": prime["motif"],
                "id": prime["id"]
            })
    
    logger.info(f"   Primes: {primes_total} DA ({len(details_primes)} prime(s))")
    
    # Retenues calculées sur le salaire de base (heures travaillées × taux horaire)
    retenues_9_pourcent = salaire_base * 0.09  # 9% du salaire de base
    retenues_fixes = 4244.80  # Montant fixe
    retenues_total = retenues_9_pourcent + retenues_fixes
    
    # Paie finale = Salaire net + Primes - Retenues
    paie_finale = salaire_net + primes_total - retenues_total
    
    return CalculPaie(
        agent_id=agent_id,
        nom=agent["nom"],
        email=agent["email"],
        role=role,
        mois=f"{annee}-{mois:02d}",
        heures_travaillees=round(heures_travaillees, 2),
        heures_theoriques=heures_theoriques,
        heures_absence=heures_absence,
        heures_retard=round(heures_retard_total, 2),
        jours_travailles=jours_travailles,
        jours_absence=jours_absence,
        salaire_base=round(salaire_base, 2),
        deduction_absences=round(deduction_absences, 2),
        deduction_retards=round(deduction_retards, 2),
        frais_panier_total=round(frais_panier_total, 2),
        frais_transport_total=round(frais_transport_total, 2),
        salaire_net=round(salaire_net, 2),
        primes_total=round(primes_total, 2),
        retenues_9_pourcent=round(retenues_9_pourcent, 2),
        retenues_fixes=round(retenues_fixes, 2),
        retenues_total=round(retenues_total, 2),
        paie_finale=round(paie_finale, 2),
        taux_horaire=params.taux_horaire,
        details_absences=details_absences,
        details_retards=details_retards,
        details_primes=details_primes
    )


async def calculer_paies_tous_agents(mois: int, annee: int) -> List[CalculPaie]:
    """
    Calcule les paies de tous les agents pour un mois donné
    """
    db = await get_db()
    
    # Récupérer tous les agents
    agents_response = db.table("agents").select("*").execute()
    
    if not agents_response.data:
        return []
    
    total_agents = len(agents_response.data)
    logger.info(f"📊 Total d'agents dans la base: {total_agents}")
    
    paies = []
    erreurs = 0
    
    for agent in agents_response.data:
        try:
            paie = await calculer_paie_agent(agent["id"], mois, annee)
            paies.append(paie)
        except Exception as e:
            erreurs += 1
            import traceback
            error_details = ''.join(traceback.format_exception(type(e), e, e.__traceback__))
            print(f"\n❌ ERREUR lors du calcul de paie pour {agent['nom']} ({agent['role']}, ID: {agent['id']})")
            print(f"   Type d'erreur: {type(e).__name__}")
            print(f"   Message: {str(e)}")
            print(f"   Traceback complet:")
            print(error_details)
            print("="*80 + "\n")
            continue
    
    logger.info(f"✅ Paies calculées: {len(paies)}/{total_agents} agents (Erreurs: {erreurs})")
    
    return paies
