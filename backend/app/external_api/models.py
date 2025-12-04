from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ApiKeyCreate(BaseModel):
    """Modèle pour créer une nouvelle clé API"""
    nom: str
    description: Optional[str] = None


class ApiKeyResponse(BaseModel):
    """Modèle de réponse pour une clé API"""
    id: str
    nom: str
    api_key: str
    description: Optional[str] = None
    actif: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None


class ApiKeyListResponse(BaseModel):
    """Modèle de réponse pour la liste des clés API (avec la clé complète)"""
    id: str
    nom: str
    api_key: str  # Clé complète, toujours visible et copiable
    description: Optional[str] = None
    actif: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None


class AgentExterne(BaseModel):
    """Modèle d'agent pour l'API externe"""
    id: str
    nom: str
    email: str
    role: str


class JourPresence(BaseModel):
    """Détail d'une journée de présence"""
    date: str
    est_present: bool
    est_absent: bool
    retard_matin_minutes: int = 0
    retard_apres_midi_minutes: int = 0
    retard_total_minutes: int = 0
    heures_travaillees: Optional[float] = None


class AttendanceResponse(BaseModel):
    """Réponse pour les données de présence d'un agent"""
    agent_id: str
    agent_nom: str
    agent_email: str
    periode: str
    resume: dict
    details: List[JourPresence]


class HealthResponse(BaseModel):
    """Réponse pour le health check"""
    status: str
    timestamp: str
    version: str
