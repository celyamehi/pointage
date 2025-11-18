from pydantic import BaseModel
from typing import Optional
from datetime import date
from uuid import UUID


class ParametresPaie(BaseModel):
    """Paramètres de calcul de paie pour un rôle"""
    role: str
    taux_horaire: float  # DA par heure
    heures_par_jour: int = 8
    heures_par_mois: int = 174
    jours_travail_mois: int = 22
    frais_panier: float = 500.0  # DA
    frais_transport: float = 200.0  # DA


class CalculPaie(BaseModel):
    """Résultat du calcul de paie pour un agent"""
    agent_id: UUID
    nom: str
    email: str
    role: str
    mois: str  # Format: YYYY-MM
    
    # Heures travaillées
    heures_travaillees: float
    heures_theoriques: float
    heures_absence: float
    heures_retard: float
    
    # Jours
    jours_travailles: int
    jours_absence: int
    
    # Calculs financiers
    salaire_base: float
    deduction_absences: float
    deduction_retards: float
    frais_panier_total: float
    frais_transport_total: float
    salaire_net: float
    retenues_9_pourcent: float  # 9% du salaire de base
    retenues_fixes: float  # 4244.80 DA
    retenues_total: float  # Total des retenues
    paie_finale: float  # Salaire net - retenues
    
    # Détails
    taux_horaire: float
    details_absences: Optional[list] = []
    details_retards: Optional[list] = []


class PeriodePaie(BaseModel):
    """Période pour le calcul des paies"""
    mois: int  # 1-12
    annee: int
    date_debut: date
    date_fin: date
