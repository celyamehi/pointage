import qrcode
import base64
import uuid
import os
from io import BytesIO
from typing import Tuple, Dict, Any
from datetime import datetime

from app.db import get_db


async def generate_qrcode(data: str) -> Tuple[str, str]:
    """
    Génère un QR code à partir des données fournies
    Retourne l'URL de l'image et les données encodées en base64
    """
    try:
        print(f"Génération d'un QR code avec les données: {data}")
        
        # Création du QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        # Création de l'image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Conversion en base64 pour l'affichage
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Sauvegarde du fichier dans le dossier static
        static_dir = "static/qrcodes"
        os.makedirs(static_dir, exist_ok=True)
        
        filename = f"qrcode_{uuid.uuid4()}.png"
        filepath = os.path.join(static_dir, filename)
        
        # Vérifier que le chemin est valide
        print(f"Sauvegarde du QR code dans: {filepath}")
        
        # Sauvegarder l'image
        img.save(filepath)
        
        # URL relative pour accéder à l'image
        image_url = f"/static/qrcodes/{filename}"
        
        print(f"QR code généré avec succès: {image_url}")
        return image_url, f"data:image/png;base64,{img_str}"
    except Exception as e:
        print(f"Erreur lors de la génération du QR code: {str(e)}")
        # Retourner une image par défaut en cas d'erreur
        return "/static/default-qr.png", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="


async def create_new_qrcode() -> Dict[str, Any]:
    """
    Crée un nouveau QR code unique et l'enregistre dans la base de données
    """
    try:
        print("Création d'un nouveau QR code")
        db = await get_db()
        
        # Désactiver tous les QR codes existants
        try:
            db.table("qrcodes").update({"actif": False}).eq("actif", True).execute()
            print("QR codes existants désactivés")
        except Exception as e:
            print(f"Erreur lors de la désactivation des QR codes existants: {str(e)}")
        
        # Générer un nouveau code unique
        code_unique = str(uuid.uuid4())
        print(f"Code unique généré: {code_unique}")
        
        # Créer le QR code
        image_url, qrcode_data = await generate_qrcode(code_unique)
        
        # Enregistrer dans la base de données
        new_qrcode = {
            "code_unique": code_unique,
            "date_generation": datetime.now().isoformat(),
            "actif": True
        }
        
        print(f"Insertion du QR code dans la base de données: {new_qrcode}")
        result = db.table("qrcodes").insert(new_qrcode).execute()
        
        if not result.data or len(result.data) == 0:
            print("Aucune donnée retournée lors de l'insertion du QR code")
            raise Exception("Erreur lors de la création du QR code")
        
        qrcode_id = result.data[0]["id"]
        print(f"QR code créé avec l'ID: {qrcode_id}")
        
        return {
            "qrcode_id": qrcode_id,
            "qrcode_data": qrcode_data,
            "qrcode_image_url": image_url
        }
    except Exception as e:
        print(f"Erreur lors de la création du QR code: {str(e)}")
        # Générer un QR code par défaut en cas d'erreur
        default_code = "error-" + str(uuid.uuid4())
        image_url, qrcode_data = await generate_qrcode(default_code)
        
        # Générer un UUID valide pour éviter les erreurs de validation
        error_id = uuid.uuid4()
        
        return {
            "qrcode_id": error_id,
            "qrcode_data": qrcode_data,
            "qrcode_image_url": image_url
        }


async def get_active_qrcode() -> Dict[str, Any]:
    """
    Récupère le QR code actif, ou en crée un nouveau s'il n'existe pas
    """
    try:
        print("Récupération du QR code actif")
        db = await get_db()
        
        # Récupérer le QR code actif
        result = db.table("qrcodes").select("*").eq("actif", True).execute()
        
        if not result.data or len(result.data) == 0:
            print("Aucun QR code actif trouvé, création d'un nouveau")
            # Aucun QR code actif, en créer un nouveau
            return await create_new_qrcode()
        
        qrcode_db = result.data[0]
        code_unique = qrcode_db["code_unique"]
        print(f"QR code actif trouvé avec le code: {code_unique}")
        
        # Générer l'image du QR code
        image_url, qrcode_data = await generate_qrcode(code_unique)
        
        return {
            "qrcode_id": qrcode_db["id"],
            "qrcode_data": qrcode_data,
            "qrcode_image_url": image_url
        }
    except Exception as e:
        print(f"Erreur lors de la récupération du QR code actif: {str(e)}")
        # Générer un QR code par défaut en cas d'erreur
        default_code = "error-" + str(uuid.uuid4())
        image_url, qrcode_data = await generate_qrcode(default_code)
        
        # Générer un UUID valide pour éviter les erreurs de validation
        error_id = uuid.uuid4()
        
        return {
            "qrcode_id": error_id,
            "qrcode_data": qrcode_data,
            "qrcode_image_url": image_url
        }


async def validate_qrcode(code_unique: str) -> bool:
    """
    Vérifie si un QR code est valide et actif
    """
    db = await get_db()
    
    result = db.table("qrcodes").select("*").eq("code_unique", code_unique).eq("actif", True).execute()
    
    return result.data and len(result.data) > 0
