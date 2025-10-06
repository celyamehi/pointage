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
    Récupère les statistiques pour le tableau de bord
    """
    try:
        print("Récupération des statistiques pour le tableau de bord")
        db = await get_db()
        
        # Nombre total d'agents (sans l'admin)
        try:
            agents_result = db.table("agents").select("*").neq("email", "admin@collable.fr").execute()
            print(f"Résultat de la requête agents: {agents_result}")
            total_agents = len(agents_result.data) if agents_result.data else 0
            print(f"Nombre total d'agents (sans admin): {total_agents}")
        except Exception as e:
            print(f"Erreur lors de la récupération du nombre total d'agents: {str(e)}")
            total_agents = 0
        
        # Date du jour (en heure GMT+1)
        now_gmt1 = datetime.now(TIMEZONE)
        today = now_gmt1.date().isoformat()
        print(f"Date du jour (GMT+1): {today} - Heure: {now_gmt1.strftime('%H:%M:%S')}")
        
        # Pointages du jour
        try:
            pointages_result = db.table("pointages").select("*").eq("date_pointage", today).execute()
            print(f"Résultat de la requête pointages: {pointages_result}")
            pointages_aujourd_hui = len(pointages_result.data) if pointages_result.data else 0
            print(f"Nombre de pointages aujourd'hui: {pointages_aujourd_hui}")
            print(f"Détails des pointages: {pointages_result.data}")
        except Exception as e:
            print(f"Erreur lors de la récupération des pointages du jour: {str(e)}")
            pointages_aujourd_hui = 0
        
        # Agents présents aujourd'hui (au moins un pointage) - Exclure l'admin
        try:
            # Récupérer l'ID de l'admin
            admin_result = db.table("agents").select("id").eq("email", "admin@collable.fr").execute()
            admin_id = admin_result.data[0]["id"] if admin_result.data else None
            print(f"ID de l'admin à exclure: {admin_id}")
            
            agents_presents_result = db.table("pointages").select("agent_id").eq("date_pointage", today).execute()
            print(f"Résultat de la requête agents présents: {agents_presents_result}")
            agents_presents = set()
            if agents_presents_result.data:
                for pointage in agents_presents_result.data:
                    # Exclure l'admin
                    if pointage["agent_id"] != admin_id:
                        agents_presents.add(pointage["agent_id"])
            
            agents_presents_aujourd_hui = len(agents_presents)
            print(f"Nombre d'agents présents aujourd'hui (sans admin): {agents_presents_aujourd_hui}")
        except Exception as e:
            print(f"Erreur lors de la récupération des agents présents: {str(e)}")
            agents_presents_aujourd_hui = 0
        
        agents_absents_aujourd_hui = max(0, total_agents - agents_presents_aujourd_hui)
        print(f"Nombre d'agents absents aujourd'hui: {agents_absents_aujourd_hui}")
        
        return {
            "total_agents": total_agents,
            "agents_presents_aujourd_hui": agents_presents_aujourd_hui,
            "agents_absents_aujourd_hui": agents_absents_aujourd_hui,
            "pointages_aujourd_hui": pointages_aujourd_hui
        }
    except Exception as e:
        print(f"Erreur générale lors de la récupération des statistiques: {str(e)}")
        # Retourner des valeurs par défaut en cas d'erreur
        return {
            "total_agents": 0,
            "agents_presents_aujourd_hui": 0,
            "agents_absents_aujourd_hui": 0,
            "pointages_aujourd_hui": 0
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
