#!/usr/bin/env python
"""
Script de démarrage pour le système de pointage Collable
Ce script lance à la fois le backend et le frontend dans des processus séparés
"""

import os
import sys
import subprocess
import webbrowser
import time
import signal
import platform

# Chemins des répertoires
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

# Commandes pour démarrer le backend et le frontend
if platform.system() == 'Windows':
    BACKEND_CMD = ['cmd', '/c', 'cd', BACKEND_DIR, '&&', 'venv\\Scripts\\python', 'main.py']
    FRONTEND_CMD = ['cmd', '/c', 'cd', FRONTEND_DIR, '&&', 'npm', 'run', 'dev']
else:
    BACKEND_CMD = ['bash', '-c', f'cd {BACKEND_DIR} && source venv/bin/activate && python main.py']

# Ports
BACKEND_PORT = 8000
FRONTEND_PORT = 5173

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
    logger.info(" Démarrage du backend...")
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
    
    # Vérifier si l'environnement virtuel existe
    if not os.path.exists(venv_python):
        logger.error(" Environnement virtuel non trouvé. Exécutez d'abord: cd backend && python -m venv venv && .\\venv\\Scripts\\pip install -r requirements.txt")
        sys.exit(1)
    
    # Commande pour démarrer le backend avec uvicorn
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
    logger.info(" Démarrage du frontend...")
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    
    # Vérifier si node_modules existe
    node_modules = os.path.join(frontend_dir, "node_modules")
    if not os.path.exists(node_modules):
        logger.warning("  node_modules non trouvé. Installation des dépendances...")
        install_cmd = ["npm", "install"]
        subprocess.run(install_cmd, cwd=frontend_dir, shell=True, check=True)
    
    # Commande pour démarrer le frontend avec npm
    frontend_cmd = ["npm", "run", "dev"]
    start_backend()
    start_frontend()
    
    # Ouvrir le navigateur
    open_browser()
    
    print("\nAppuyez sur Ctrl+C pour arrêter les serveurs...")
    
    # Maintenir le script en cours d'exécution
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
