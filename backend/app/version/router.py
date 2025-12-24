from fastapi import APIRouter

router = APIRouter()

# Version actuelle de l'application
CURRENT_VERSION = "2.0.5"
APK_DOWNLOAD_URL = "https://github.com/celyamehi/pointage/releases/download/v2.0.5/pointage-collable-v2.0.5.apk"

@router.get("/check")
async def check_version():
    """
    Endpoint pour vérifier la version actuelle de l'application
    """
    return {
        "version": CURRENT_VERSION,
        "download_url": APK_DOWNLOAD_URL,
        "release_notes": [
            "Token valide 7 jours",
            "Meilleure gestion hors-ligne",
            "Correction erreurs de synchronisation"
        ]
    }
