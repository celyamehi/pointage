from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time, datetime
from uuid import UUID


class PointageBase(BaseModel):
    agent_id: UUID
    session: str  # 'matin' ou 'apres-midi'


class PointageCreate(PointageBase):
    qrcode: str


class Pointage(PointageBase):
    id: UUID
    date_pointage: date
    heure_pointage: time
    created_at: datetime


class PointageResponse(BaseModel):
    message: str
    pointage: Optional[Pointage] = None


class PointageJour(BaseModel):
    date: date
    matin: Optional[time] = None
    apres_midi: Optional[time] = None


class PointageAgent(BaseModel):
    agent_id: UUID
    nom: str
    email: str
    pointages: List[PointageJour]
