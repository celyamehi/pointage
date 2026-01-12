from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Any, Optional
import pandas as pd
import io
import os

from app.db import get_db
from app.pointage.utils import format_pointages_by_date

# Fuseau horaire GMT+1
TIMEZONE = timezone(timedelta(hours=1))


async def get_all_agents() -> List[Dict[str, Any]]:
    """
    Récupère tous les agents (sans l'admin)
    """
    try:
        print("Récupération de tous les agents (sans admin)")
        db = await get_db()
        
        # Récupérer tous les agents sauf l'admin
        result = db.table("agents").select("id", "nom", "email", "role", "created_at").neq("email", "admin@collable.fr").execute()
        print(f"Résultat de la requête: {result}")
        print(f"Nombre d'agents (sans admin): {len(result.data) if result.data else 0}")
        
        return result.data if result.data else []
    except Exception as e:
        print(f"Erreur lors de la récupération de tous les agents: {str(e)}")
        return []


async def get_dashboard_stats() -> Dict[str, int]:
    """
    Récupère les statistiques pour le tableau de bord avec détails matin/après-midi
    """
    try:
        print("Récupération des statistiques pour le tableau de bord")
        db = await get_db()
        
        # Nombre total d'agents (sans l'admin)
        try:
            agents_result = db.table("agents").select("*").neq("email", "admin@collable.fr").execute()
            total_agents = len(agents_result.data) if agents_result.data else 0
            print(f"Nombre total d'agents (sans admin): {total_agents}")
        except Exception as e:
            print(f"Erreur lors de la récupération du nombre total d'agents: {str(e)}")
            total_agents = 0
        
        # Date du jour (en heure GMT+1)
        now_gmt1 = datetime.now(TIMEZONE)
        today = now_gmt1.date().isoformat()
        print(f"Date du jour (GMT+1): {today}")
        
        # Récupérer l'ID de l'admin pour l'exclure
        try:
            admin_result = db.table("agents").select("id").eq("email", "admin@collable.fr").execute()
            admin_id = admin_result.data[0]["id"] if admin_result.data else None
        except Exception as e:
            admin_id = None
        
        # Pointages du matin (exclure les annulés)
        try:
            pointages_matin_result = db.table("pointages").select("*").eq("date_pointage", today).eq("session", "matin").or_("annule.is.null,annule.eq.false").execute()
            pointages_matin = len(pointages_matin_result.data) if pointages_matin_result.data else 0
            
            # Dictionnaire pour suivre l'état des agents: True = présent, False = sorti
            agents_status_matin = {}
            # Ensemble pour compter les agents uniques qui ont pointé leur arrivée le matin
            agents_arrives_matin = set()
            
            if pointages_matin_result.data:
                for pointage in pointages_matin_result.data:
                    if pointage["agent_id"] != admin_id:
                        # Si c'est une arrivée, marquer l'agent comme présent et l'ajouter à l'ensemble des arrivées
                        if pointage.get("type_pointage") == "arrivee":
                            agents_status_matin[pointage["agent_id"]] = True
                            agents_arrives_matin.add(pointage["agent_id"])
                        # Si c'est une sortie, marquer l'agent comme sorti
                        elif pointage.get("type_pointage") == "sortie":
                            agents_status_matin[pointage["agent_id"]] = False
                            
            # Nombre d'agents uniques qui ont pointé leur arrivée le matin
            arrivees_matin = len(agents_arrives_matin)
            
            # Compter uniquement les agents actuellement présents (arrivés mais pas sortis)
            agents_presents_matin = set(agent_id for agent_id, is_present in agents_status_matin.items() if is_present)
            agents_presents_matin_count = len(agents_presents_matin)
            agents_absents_matin = max(0, total_agents - agents_presents_matin_count)
            
            print(f"📊 MATIN - Pointages: {pointages_matin}, Présents: {agents_presents_matin_count}, Absents: {agents_absents_matin}")
        except Exception as e:
            print(f"❌ Erreur stats matin: {str(e)}")
            pointages_matin = 0
            agents_presents_matin_count = 0
            agents_absents_matin = total_agents
            agents_presents_matin = set()
            arrivees_matin = 0
        
        # Pointages de l'après-midi (exclure les annulés)
        try:
            pointages_aprem_result = db.table("pointages").select("*").eq("date_pointage", today).eq("session", "apres-midi").or_("annule.is.null,annule.eq.false").execute()
            pointages_aprem = len(pointages_aprem_result.data) if pointages_aprem_result.data else 0
            
            # Dictionnaire pour suivre l'état des agents: True = présent, False = sorti
            agents_status_aprem = {}
            # Ensemble pour compter les agents uniques qui ont pointé leur arrivée l'après-midi
            agents_arrives_aprem = set()
            
            if pointages_aprem_result.data:
                for pointage in pointages_aprem_result.data:
                    if pointage["agent_id"] != admin_id:
                        # Si c'est une arrivée, marquer l'agent comme présent et l'ajouter à l'ensemble des arrivées
                        if pointage.get("type_pointage") == "arrivee":
                            agents_status_aprem[pointage["agent_id"]] = True
                            agents_arrives_aprem.add(pointage["agent_id"])
                        # Si c'est une sortie, marquer l'agent comme sorti
                        elif pointage.get("type_pointage") == "sortie":
                            agents_status_aprem[pointage["agent_id"]] = False
                            
            # Nombre d'agents uniques qui ont pointé leur arrivée l'après-midi
            arrivees_aprem = len(agents_arrives_aprem)
            
            # Compter uniquement les agents actuellement présents (arrivés mais pas sortis)
            agents_presents_aprem = set(agent_id for agent_id, is_present in agents_status_aprem.items() if is_present)
            agents_presents_aprem_count = len(agents_presents_aprem)
            agents_absents_aprem = max(0, total_agents - agents_presents_aprem_count)
            
            print(f"📊 APRÈS-MIDI - Pointages: {pointages_aprem}, Présents: {agents_presents_aprem_count}, Absents: {agents_absents_aprem}")
        except Exception as e:
            print(f"❌ Erreur stats après-midi: {str(e)}")
            pointages_aprem = 0
            agents_presents_aprem_count = 0
            agents_absents_aprem = total_agents
            agents_presents_aprem = set()
            arrivees_aprem = 0
        
        pointages_aujourd_hui = pointages_matin + pointages_aprem
        
        # Pour le total de la journée, un agent est présent s'il est présent dans au moins une des deux sessions
        agents_presents_total = agents_presents_matin.union(agents_presents_aprem)
        agents_presents_aujourd_hui = len(agents_presents_total)
        agents_absents_aujourd_hui = max(0, total_agents - agents_presents_aujourd_hui)
        
        # Récupérer les noms des agents présents
        liste_presents_matin = []
        liste_presents_aprem = []
        
        if agents_presents_matin or agents_presents_aprem:
            try:
                # Récupérer tous les agents pour avoir leurs noms
                all_agents_ids = list(agents_presents_matin.union(agents_presents_aprem))
                if all_agents_ids:
                    agents_info = db.table("agents").select("id, nom").in_("id", all_agents_ids).execute()
                    agents_dict = {a["id"]: a['nom'] for a in agents_info.data} if agents_info.data else {}
                    
                    # Liste des noms des agents présents le matin
                    liste_presents_matin = sorted([agents_dict.get(aid, "Inconnu") for aid in agents_presents_matin])
                    
                    # Liste des noms des agents présents l'après-midi
                    liste_presents_aprem = sorted([agents_dict.get(aid, "Inconnu") for aid in agents_presents_aprem])
                    
                    print(f"📋 Agents présents matin: {liste_presents_matin}")
                    print(f"📋 Agents présents après-midi: {liste_presents_aprem}")
            except Exception as e:
                print(f"❌ Erreur récupération noms agents: {str(e)}")
        
        result = {
            "total_agents": total_agents,
            "agents_presents_matin": agents_presents_matin_count,
            "agents_absents_matin": agents_absents_matin,
            "agents_presents_aprem": agents_presents_aprem_count,
            "agents_absents_aprem": agents_absents_aprem,
            "arrivees_matin": arrivees_matin,
            "arrivees_aprem": arrivees_aprem,
            "pointages_matin": pointages_matin,
            "pointages_aprem": pointages_aprem,
            "liste_presents_matin": liste_presents_matin,
            "liste_presents_aprem": liste_presents_aprem
        }
        
        print(f"✅ RÉSULTAT FINAL: {result}")
        return result
    except Exception as e:
        print(f"Erreur: {str(e)}")
        return {
            "total_agents": 0,
            "agents_presents_matin": 0,
            "agents_absents_matin": 0,
            "agents_presents_aprem": 0,
            "agents_absents_aprem": 0,
            "arrivees_matin": 0,
            "arrivees_aprem": 0,
            "pointages_matin": 0,
            "pointages_aprem": 0,
            "liste_presents_matin": [],
            "liste_presents_aprem": []
        }


async def get_agents_with_pointages(start_date: Optional[date] = None, end_date: Optional[date] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Récupère tous les agents avec leurs pointages sur une période donnée
    """
    try:
        print(f"Récupération des agents avec pointages - start_date: {start_date}, end_date: {end_date}, search: {search}")
        db = await get_db()
        
        # Si pas de dates spécifiées, utiliser la semaine en cours
        if not start_date:
            today = date.today()
            start_date = today - timedelta(days=today.weekday())  # Lundi de la semaine en cours
            print(f"Date de début par défaut: {start_date}")
        
        if not end_date:
            end_date = start_date + timedelta(days=6)  # Dimanche de la semaine en cours
            print(f"Date de fin par défaut: {end_date}")
        
        # Récupérer tous les agents (sans l'admin)
        try:
            agents_query = db.table("agents").select("id", "nom", "email", "role").neq("email", "admin@collable.fr")
            
            if search:
                agents_query = agents_query.or_(f"nom.ilike.%{search}%,email.ilike.%{search}%")
            
            agents_result = agents_query.execute()
            print(f"Résultat de la requête agents: {agents_result}")
            agents = agents_result.data if agents_result.data else []
            print(f"Nombre d'agents trouvés: {len(agents)}")
        except Exception as e:
            print(f"Erreur lors de la récupération des agents: {str(e)}")
            agents = []
        
        # Pour chaque agent, récupérer ses pointages
        result = []
        for agent in agents:
            try:
                pointages = await format_pointages_by_date(agent["id"], start_date, end_date)
                
                result.append({
                    "agent_id": agent["id"],
                    "nom": agent["nom"],
                    "email": agent["email"],
                    "role": agent["role"],
                    "pointages": pointages
                })
            except Exception as e:
                print(f"Erreur lors de la récupération des pointages pour l'agent {agent['id']}: {str(e)}")
                # Ajouter l'agent avec des pointages vides
                result.append({
                    "agent_id": agent["id"],
                    "nom": agent["nom"],
                    "email": agent["email"],
                    "role": agent["role"],
                    "pointages": []
                })
        
        print(f"Nombre d'agents avec pointages retournés: {len(result)}")
        return result
    except Exception as e:
        print(f"Erreur générale lors de la récupération des agents avec pointages: {str(e)}")
        return []


async def export_pointages(start_date: date, end_date: date, format: str = "csv") -> tuple:
    """
    Exporte les pointages de tous les agents sur une période donnée au format CSV ou Excel
    Retourne le contenu du fichier et le nom du fichier
    """
    # Récupérer tous les agents avec leurs pointages
    agents_with_pointages = await get_agents_with_pointages(start_date, end_date)
    
    # Préparer les données pour l'export
    data = []
    
    for agent in agents_with_pointages:
        for pointage in agent["pointages"]:
            data.append({
                "ID Agent": agent["agent_id"],
                "Nom": agent["nom"],
                "Email": agent["email"],
                "Date": pointage["date"],
                "Pointage Matin": pointage["matin"] if pointage["matin"] else "",
                "Pointage Après-midi": pointage["apres_midi"] if pointage["apres_midi"] else ""
            })
    
    # Créer un DataFrame pandas
    df = pd.DataFrame(data)
    
    # Générer le fichier
    buffer = io.BytesIO()
    
    if format.lower() == "excel":
        # Export Excel
        df.to_excel(buffer, index=False, engine="openpyxl")
        filename = f"pointages_{start_date}_{end_date}.xlsx"
        content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        # Export CSV par défaut
        df.to_csv(buffer, index=False)
        filename = f"pointages_{start_date}_{end_date}.csv"
        content_type = "text/csv"
    
    buffer.seek(0)
    
    return buffer.getvalue(), filename, content_type
