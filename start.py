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
    FRONTEND_CMD = ['bash', '-c', f'cd {FRONTEND_DIR} && npm run dev']

# Ports
BACKEND_PORT = 8000
FRONTEND_PORT = 5173

# Processus
processes = []

def start_backend():
    """Démarre le serveur backend"""
    print("Démarrage du backend...")
    if platform.system() == 'Windows':
        process = subprocess.Popen(BACKEND_CMD, creationflags=subprocess.CREATE_NEW_CONSOLE)
    else:
        process = subprocess.Popen(BACKEND_CMD, shell=True)
    processes.append(process)
    print(f"Backend démarré sur http://localhost:{BACKEND_PORT}")

def start_frontend():
    """Démarre le serveur frontend"""
    print("Démarrage du frontend...")
    if platform.system() == 'Windows':
        process = subprocess.Popen(FRONTEND_CMD, creationflags=subprocess.CREATE_NEW_CONSOLE)
    else:
        process = subprocess.Popen(FRONTEND_CMD, shell=True)
    processes.append(process)
    print(f"Frontend démarré sur http://localhost:{FRONTEND_PORT}")

def open_browser():
    """Ouvre le navigateur à l'URL du frontend"""
    print("Ouverture du navigateur...")
    time.sleep(5)  # Attendre que les serveurs soient prêts
    webbrowser.open(f"http://localhost:{FRONTEND_PORT}")

def cleanup(signum=None, frame=None):
    """Arrête tous les processus au moment de quitter"""
    print("\nArrêt des serveurs...")
    for process in processes:
        if platform.system() == 'Windows':
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(process.pid)])
        else:
            process.terminate()
    print("Serveurs arrêtés.")
    sys.exit(0)

def main():
    """Fonction principale"""
    print("=== Démarrage du système de pointage Collable ===")
    
    # Enregistrer le gestionnaire de signal pour un arrêt propre
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    # Démarrer les serveurs
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
