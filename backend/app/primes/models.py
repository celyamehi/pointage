from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class PrimeCreate(BaseModel):
    """Modèle pour créer une prime"""
    agent_id: UUID
    montant: float = Field(gt=0, description="Montant de la prime en DA")
    motif: str = Field(min_length=3, max_length=500, description="Raison de la prime")
    mois: int = Field(ge=1, le=12, description="Mois (1-12)")
    annee: int = Field(ge=2020, le=2100, description="Année")


class PrimeUpdate(BaseModel):
    """Modèle pour mettre à jour une prime"""
    montant: Optional[float] = Field(None, gt=0)
    motif: Optional[str] = Field(None, min_length=3, max_length=500)


class Prime(BaseModel):
    """Modèle de prime complet"""
    id: UUID
    agent_id: UUID
    montant: float
    motif: str
    mois: int
    annee: int
    created_at: datetime
    created_by: Optional[UUID] = None
    
    # Informations de l'agent (jointes)
    agent_nom: Optional[str] = None
    agent_email: Optional[str] = None
    agent_role: Optional[str] = None


class PrimesSummary(BaseModel):
    """Résumé des primes pour un agent sur une période"""
    agent_id: UUID
    agent_nom: str
    mois: int
    annee: int
    total_primes: float
    nombre_primes: int
    primes: list[Prime]
