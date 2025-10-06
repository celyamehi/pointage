import qrcode
import os

# Création du QR code
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)
qr.add_data("default")
qr.make(fit=True)

# Création de l'image
img = qr.make_image(fill_color="black", back_color="white")

# Sauvegarde du fichier dans le dossier static
static_dir = "static"
os.makedirs(static_dir, exist_ok=True)

filepath = os.path.join(static_dir, "default-qr.png")
img.save(filepath)

print(f"QR code par défaut créé: {filepath}")
