import qrcode
import base64
import uuid
import os
from io import BytesIO
from typing import Tuple, Dict, Any
from datetime import datetime, timezone, timedelta

from app.db import get_db

# Fuseau horaire GMT+1
TIMEZONE = timezone(timedelta(hours=1))


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
        
        # Désactiver tous les QR codes existants pour des raisons de sécurité
        try:
            old_qrcodes = db.table("qrcodes").select("*").eq("actif", True).execute()
            if old_qrcodes.data:
                print(f"🔒 SÉCURITÉ: Désactivation de {len(old_qrcodes.data)} ancien(s) QR code(s)")
                for old_qr in old_qrcodes.data:
                    print(f"   - QR code {old_qr['id']} (créé le {old_qr['date_generation']}) désactivé")
            
            db.table("qrcodes").update({"actif": False}).eq("actif", True).execute()
            print("✅ Tous les anciens QR codes ont été désactivés avec succès")
        except Exception as e:
            print(f"⚠️ Erreur lors de la désactivation des QR codes existants: {str(e)}")
        
        # Générer un nouveau code unique
        code_unique = str(uuid.uuid4())
        print(f"Code unique généré: {code_unique}")
        
        # Créer le QR code
        image_url, qrcode_data = await generate_qrcode(code_unique)
        
        # Enregistrer dans la base de données avec l'heure GMT+1
        now_gmt1 = datetime.now(TIMEZONE)
        new_qrcode = {
            "code_unique": code_unique,
            "date_generation": now_gmt1.isoformat(),
            "actif": True
        }
        print(f"🕒 Date de génération (GMT+1): {now_gmt1.strftime('%Y-%m-%d %H:%M:%S')}")
        
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
    
    # Vérifier si le QR code existe et est actif
    result = db.table("qrcodes").select("*").eq("code_unique", code_unique).eq("actif", True).execute()
    
    if result.data and len(result.data) > 0:
        qrcode_info = result.data[0]
        print(f"✅ QR code valide: {qrcode_info['id']} (créé le {qrcode_info['date_generation']})")
        return True
    else:
        # Vérifier si le QR code existe mais est désactivé
        old_result = db.table("qrcodes").select("*").eq("code_unique", code_unique).execute()
        if old_result.data and len(old_result.data) > 0:
            old_qr = old_result.data[0]
            print(f"🚫 SÉCURITÉ: Tentative d'utilisation d'un QR code désactivé: {old_qr['id']} (créé le {old_qr['date_generation']}, actif: {old_qr['actif']})")
        else:
            print(f"🚫 SÉCURITÉ: Tentative d'utilisation d'un QR code inexistant: {code_unique[:8]}...")
        return False


async def get_qr_codes_history() -> Dict[str, Any]:
    """
    Récupère l'historique de tous les QR codes générés
    """
    try:
        print("Récupération de l'historique des QR codes")
        db = await get_db()
        
        # Récupérer tous les QR codes par ordre décroissant de création
        result = db.table("qrcodes").select("*").order("date_generation", desc=True).execute()
        
        if not result.data:
            return {
                "total_qrcodes": 0,
                "active_qrcodes": 0,
                "inactive_qrcodes": 0,
                "qrcodes": []
            }
        
        # Compter les QR codes actifs et inactifs
        active_count = sum(1 for qr in result.data if qr.get("actif", False))
        inactive_count = len(result.data) - active_count
        
        print(f"📊 Historique: {len(result.data)} QR codes au total ({active_count} actifs, {inactive_count} inactifs)")
        
        # Formater les données pour l'affichage
        formatted_qrcodes = []
        for qr in result.data:
            formatted_qrcodes.append({
                "id": qr["id"],
                "code_unique": qr["code_unique"],
                "date_generation": qr["date_generation"],
                "actif": qr.get("actif", False),
                "status": "Actif" if qr.get("actif", False) else "Désactivé"
            })
        
        return {
            "total_qrcodes": len(result.data),
            "active_qrcodes": active_count,
            "inactive_qrcodes": inactive_count,
            "qrcodes": formatted_qrcodes
        }
        
    except Exception as e:
        print(f"Erreur lors de la récupération de l'historique des QR codes: {str(e)}")
        return {
            "total_qrcodes": 0,
            "active_qrcodes": 0,
            "inactive_qrcodes": 0,
            "qrcodes": []
        }


async def cleanup_inactive_qrcodes() -> Dict[str, Any]:
    """
    Supprime tous les QR codes inactifs de la base de données
    """
    try:
        print("🧹 Nettoyage des QR codes inactifs")
        db = await get_db()
        
        # Récupérer les QR codes inactifs avant suppression
        inactive_qrcodes = db.table("qrcodes").select("*").eq("actif", False).execute()
        
        if not inactive_qrcodes.data:
            return {
                "deleted_count": 0,
                "message": "Aucun QR code inactif à supprimer"
            }
        
        # Supprimer les QR codes inactifs
        delete_result = db.table("qrcodes").delete().eq("actif", False).execute()
        deleted_count = len(delete_result.data) if delete_result.data else 0
        
        print(f"🗑️ {deleted_count} QR codes inactifs supprimés avec succès")
        
        return {
            "deleted_count": deleted_count,
            "message": f"{deleted_count} QR codes inactifs ont été supprimés"
        }
        
    except Exception as e:
        print(f"Erreur lors du nettoyage des QR codes inactifs: {str(e)}")
        return {
            "deleted_count": 0,
            "message": f"Erreur lors du nettoyage: {str(e)}"
        }
