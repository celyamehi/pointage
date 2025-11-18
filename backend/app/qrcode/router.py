from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse, FileResponse

from app.auth.utils import get_current_active_user, get_admin_user
from app.auth.models import User
from app.qrcode.models import QRCodeResponse
from app.qrcode.utils import create_new_qrcode, get_active_qrcode

router = APIRouter()


@router.get("/active", response_model=QRCodeResponse)
async def get_active_qr_code(current_user: User = Depends(get_admin_user)):
    """
    Endpoint pour récupérer le QR code actif (admin uniquement)
    """
    try:
        qrcode_data = await get_active_qrcode()
        return qrcode_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération du QR code: {str(e)}"
        )


@router.get("/history")
async def get_qr_codes_history(current_user: User = Depends(get_admin_user)):
    """
    Endpoint pour récupérer l'historique de tous les QR codes (admin uniquement)
    """
    try:
        from app.qrcode.utils import get_qr_codes_history
        history = await get_qr_codes_history()
        return history
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération de l'historique: {str(e)}"
        )


@router.delete("/cleanup")
async def cleanup_old_qrcodes(current_user: User = Depends(get_admin_user)):
    """
    Endpoint pour supprimer tous les QR codes inactifs (admin uniquement)
    """
    try:
        from app.qrcode.utils import cleanup_inactive_qrcodes
        result = await cleanup_inactive_qrcodes()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du nettoyage: {str(e)}"
        )


@router.post("/generate", response_model=QRCodeResponse)
async def generate_new_qr_code(current_user: User = Depends(get_admin_user)):
    """
    Endpoint pour générer un nouveau QR code (admin uniquement)
    """
    try:
        qrcode_data = await create_new_qrcode()
        return qrcode_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du QR code: {str(e)}"
        )


@router.get("/image/{qrcode_id}")
async def get_qr_code_image(qrcode_id: str, current_user: User = Depends(get_current_active_user)):
    """
    Endpoint pour récupérer l'image d'un QR code spécifique
    """
    try:
        # Cette route retourne directement l'image du QR code
        # Elle est utilisée pour l'impression ou l'affichage direct
        return FileResponse(f"static/qrcodes/qrcode_{qrcode_id}.png", media_type="image/png")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"QR code non trouvé: {str(e)}"
        )
