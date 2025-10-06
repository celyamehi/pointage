from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class QRCodeBase(BaseModel):
    code_unique: str


class QRCodeCreate(QRCodeBase):
    pass


class QRCode(QRCodeBase):
    id: UUID
    date_generation: datetime
    actif: bool


class QRCodeResponse(BaseModel):
    qrcode_id: UUID
    qrcode_data: str
    qrcode_image_url: str
