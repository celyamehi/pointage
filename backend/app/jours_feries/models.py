from pydantic import BaseModel
from typing import Optional
from datetime import date
from uuid import UUID


class JourFerieBase(BaseModel):
    date_ferie: date
    nom: str
    description: Optional[str] = None
    type: str = "custom"
    annee: int
    recurrent: bool = False


class JourFerieCreate(BaseModel):
    date_ferie: date
    nom: str
    description: Optional[str] = None
    recurrent: bool = False


class JourFerieUpdate(BaseModel):
    nom: Optional[str] = None
    description: Optional[str] = None
    recurrent: Optional[bool] = None


class JourFerie(JourFerieBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ExceptionJourFerieCreate(BaseModel):
    jour_ferie_id: UUID
    agent_id: UUID
    motif: Optional[str] = None


class ExceptionJourFerie(BaseModel):
    id: UUID
    jour_ferie_id: UUID
    agent_id: UUID
    motif: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: Optional[str] = None
    # Données jointes
    agent_nom: Optional[str] = None
    agent_email: Optional[str] = None
    jour_ferie_date: Optional[str] = None
    jour_ferie_nom: Optional[str] = None

    class Config:
        from_attributes = True
