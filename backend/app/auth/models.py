from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr
    nom: str


class UserCreate(UserBase):
    password: str
    role: str = "agent"


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nom: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None


class UserInDB(UserBase):
    id: UUID
    role: str
    password_hash: str
    created_at: datetime
    updated_at: datetime


class User(UserBase):
    id: UUID
    role: str
    created_at: datetime
    updated_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[str] = None
