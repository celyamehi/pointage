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
    # Horaires spécifiques (en minutes depuis minuit)
    heure_debut_matin: int = 8 * 60 + 5  # 8h05 par défaut
    heure_fin_matin: int = 11 * 60 + 55  # 11h55 par défaut
    heure_debut_aprem: int = 13 * 60 + 5  # 13h05 par défaut
    heure_fin_aprem: int = 16 * 60 + 55  # 16h55 par défaut


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
    
    # Jours (peuvent être des demi-journées, ex: 0.5 pour absence partielle)
    jours_travailles: float
    jours_absence: float
    jours_feries_payes: int = 0  # Jours fériés payés (sans travail)
    jours_feries_travailles: int = 0  # Jours fériés travaillés (payés double)
    
    # Calculs financiers
    salaire_base: float
    deduction_absences: float
    deduction_retards: float
    frais_panier_total: float
    frais_transport_total: float
    bonus_jours_feries: float = 0.0  # Bonus pour jours fériés travaillés (double journée)
    salaire_net: float
    primes_total: float = 0.0  # Total des primes
    retenues_9_pourcent: float  # 9% du salaire de base
    retenues_fixes: float  # 4244.80 DA
    retenues_total: float  # Total des retenues
    paie_finale: float  # Salaire net + primes - retenues
    
    # Détails
    taux_horaire: float
    details_absences: Optional[list] = []
    details_retards: Optional[list] = []
    details_primes: Optional[list] = []  # Liste des primes
    details_jours_feries: Optional[list] = []  # Liste des jours fériés travaillés


class PeriodePaie(BaseModel):
    """Période pour le calcul des paies"""
    mois: int  # 1-12
    annee: int
    date_debut: date
    date_fin: date
