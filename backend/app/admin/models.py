from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, time
from uuid import UUID

from app.auth.models import User
from app.pointage.models import PointageJour, PointageAgent


class ExportParams(BaseModel):
    start_date: date
    end_date: date
    format: str = "csv"  # "csv" ou "excel"


class DashboardStats(BaseModel):
    total_agents: int
    agents_presents_aujourd_hui: int
    agents_absents_aujourd_hui: int
    pointages_aujourd_hui: int


class AgentPointageFilters(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    search: Optional[str] = None
