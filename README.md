# Collable - Système de Pointage

Système de pointage pour la société Collable permettant de gérer le pointage des agents matin et après-midi via un système de scan de QR code unique.

## Fonctionnalités

- Gestion des utilisateurs (agents et administrateurs)
- Pointage via scan de QR code
- Tableau de bord administrateur
- Export des données de pointage au format CSV ou Excel
- Interface responsive pour ordinateurs et mobiles

## Architecture technique

- **Backend**: Python avec FastAPI et Supabase (PostgreSQL)
- **Frontend**: HTML, CSS, JavaScript avec framework moderne (React, Vue.js)
- **Authentification**: JWT avec Supabase Auth
- **Base de données**: PostgreSQL via Supabase

## Prérequis

- Python 3.8+
- Node.js 14+
- Compte Supabase (https://supabase.com)

## Installation

### Configuration de Supabase

1. Créez un compte sur [Supabase](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL et la clé anonyme du projet
4. Exécutez les scripts SQL de création des tables (disponibles dans le fichier `backend/app/db.py` ou `backend/init_db.py`)

### Backend (Python)

1. Accédez au répertoire backend :
   ```bash
   cd backend
   ```

2. Créez un environnement virtuel Python :
   ```bash
   python -m venv venv
   ```

3. Activez l'environnement virtuel :
   - Windows :
     ```bash
     venv\Scripts\activate
     ```
   - Linux/Mac :
     ```bash
     source venv/bin/activate
     ```

4. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

5. Configurez les variables d'environnement dans le fichier `.env` :
   ```
   SUPABASE_URL=votre_url_supabase
   SUPABASE_ANON_KEY=votre_clé_anonyme_supabase
   SECRET_KEY=votre_clé_secrète_pour_jwt
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

6. Initialisez la base de données avec un administrateur par défaut :
   ```bash
   python init_db.py
   ```

7. Lancez le serveur de développement :
   ```bash
   python main.py
   ```

   Le serveur sera accessible à l'adresse : http://localhost:8000

### Frontend

1. Accédez au répertoire frontend :
   ```bash
   cd frontend
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Configurez l'URL du backend dans le fichier d'environnement :
   ```
   VITE_API_URL=http://localhost:8000
   ```

4. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

   L'interface sera accessible à l'adresse : http://localhost:5173

## Utilisation

### Connexion

- Administrateur par défaut :
  - Email : admin@collable.fr
  - Mot de passe : admin123 (à changer en production)

### Interface administrateur

- Tableau de bord avec statistiques
- Gestion des agents
- Génération et impression du QR code
- Visualisation des pointages
- Export des données

### Interface agent

- Connexion avec email et mot de passe
- Scan du QR code pour pointer
- Visualisation de ses propres pointages

## Sécurité

- Authentification sécurisée avec JWT
- Mots de passe hashés avec bcrypt
- Contrôle d'accès basé sur les rôles
- Protection contre les fraudes sur les pointages

## Licence

Tous droits réservés - Collable © 2025
