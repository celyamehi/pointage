import subprocess
import sys
import os
import time
import logging

# Configuration des logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def start_backend():
    """Démarre le serveur backend FastAPI"""
    logger.info("🚀 Démarrage du backend...")
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
    
    # Vérifier si l'environnement virtuel existe
    if not os.path.exists(venv_python):
        logger.error("❌ Environnement virtuel non trouvé.")
        logger.error("Exécutez: cd backend && python -m venv venv && .\\venv\\Scripts\\pip install -r requirements.txt")
        sys.exit(1)
    
    # Commande pour démarrer le backend
    backend_cmd = [
        venv_python,
        "-m",
        "uvicorn",
        "main:app",
        "--reload",
        "--host",
        "0.0.0.0",
        "--port",
        "8000"
    ]
    
    backend_process = subprocess.Popen(
        backend_cmd,
        cwd=backend_dir,
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )
    
    return backend_process

def start_frontend():
    """Démarre le serveur frontend Vite"""
    logger.info("🎨 Démarrage du frontend...")
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    
    # Vérifier si node_modules existe
    node_modules = os.path.join(frontend_dir, "node_modules")
    if not os.path.exists(node_modules):
        logger.warning("⚠️  node_modules non trouvé. Installation des dépendances...")
        install_cmd = ["npm", "install"]
        subprocess.run(install_cmd, cwd=frontend_dir, shell=True, check=True)
    
    # Commande pour démarrer le frontend
    frontend_cmd = ["npm", "run", "dev"]
    
    frontend_process = subprocess.Popen(
        frontend_cmd,
        cwd=frontend_dir,
        shell=True,
        creationflags=subprocess.CREATE_NEW_CONSOLE
    )
    
    return frontend_process

if __name__ == "__main__":
    print("=" * 60)
    print("🏢 Démarrage du système de pointage Collable")
    print("=" * 60)
    
    try:
        # Démarrer le backend
        backend = start_backend()
        logger.info("⏳ Attente du démarrage du backend...")
        time.sleep(3)
        
        # Démarrer le frontend
        frontend = start_frontend()
        logger.info("⏳ Attente du démarrage du frontend...")
        time.sleep(3)
        
        print("\n" + "=" * 60)
        print("✅ Les serveurs sont démarrés dans des fenêtres séparées !")
        print("=" * 60)
        print("📍 Backend: http://localhost:8000")
        print("📍 Frontend: http://localhost:5173")
        print("📍 API Docs: http://localhost:8000/docs")
        print("=" * 60)
        print("\n💡 Conseil: Gardez cette fenêtre ouverte")
        print("⚠️  Fermez les fenêtres du backend et frontend pour arrêter")
        print("\n⌨️  Appuyez sur Ctrl+C pour arrêter ce script\n")
        
        # Garder le script en cours d'exécution
        while True:
            time.sleep(1)
        
    except KeyboardInterrupt:
        print("\n\n🛑 Arrêt du script...")
        print("✅ Script arrêté. Fermez les fenêtres manuellement.")
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
        sys.exit(1)
