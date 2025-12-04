from pydantic import BaseModel
from typing import Optional
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
