# 🚀 Démarrage Rapide - Collable Pointing System

## Méthode 1 : Script automatique (Recommandé)

### Démarrage simple
```bash
python start_app.py
```

Ce script va :
- ✅ Démarrer le backend dans une fenêtre séparée
- ✅ Démarrer le frontend dans une fenêtre séparée
- ✅ Afficher les URLs d'accès

### URLs d'accès
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

---

## Méthode 2 : Démarrage manuel

### Backend (Terminal 1)
```bash
cd backend
.\venv\Scripts\activate
python -m uvicorn main:app --reload
```

### Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

---

## 🔑 Comptes de test

### Administrateur
- **Email** : admin@collable.fr
- **Mot de passe** : admin123

### Agent (si créé)
- **Email** : agent@collable.fr
- **Mot de passe** : [votre mot de passe]

---

## ⚙️ Configuration

### Variables d'environnement Backend
Fichier : `backend/.env`
```
SUPABASE_URL=https://abzdvelerwidssigszrq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SECRET_KEY=your_secret_key_for_jwt_tokens
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Variables d'environnement Frontend
Fichier : `frontend/.env` (optionnel)
```
VITE_API_URL=http://localhost:8000
```

---

## 🐛 Dépannage

### Problème : Backend ne démarre pas
**Solution** :
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Problème : Frontend ne démarre pas
**Solution** :
```bash
cd frontend
npm install
npm run dev
```

### Problème : Erreur de connexion
**Vérifications** :
1. Le backend est bien démarré sur http://localhost:8000
2. Le frontend est bien démarré sur http://localhost:5173
3. Les variables d'environnement sont correctement configurées
4. La base de données Supabase est accessible

### Problème : Les modifications ne sont pas visibles
**Solution** :
1. Arrêtez tous les processus Python et Node
2. Relancez avec `python start_app.py`
3. Videz le cache du navigateur (Ctrl+Shift+R)

---

## 📝 Logs et Débogage

### Voir les logs du backend
Les logs s'affichent dans la fenêtre du backend avec des emojis :
- 🚀 Démarrage
- 🔑 Connexion
- ✅ Succès
- ❌ Erreur
- 🕒 Heure/Date

### Voir les logs du frontend
Les logs s'affichent dans la console du navigateur (F12)

---

## 🛑 Arrêter l'application

### Avec le script automatique
1. Appuyez sur `Ctrl+C` dans la fenêtre du script
2. Fermez les fenêtres du backend et frontend

### Manuellement
```bash
# Windows
taskkill /F /IM python.exe
taskkill /F /IM node.exe
```

---

## 📦 Structure du projet

```
point/
├── backend/           # API FastAPI
│   ├── app/          # Code de l'application
│   ├── static/       # Fichiers statiques (QR codes)
│   ├── venv/         # Environnement virtuel Python
│   ├── main.py       # Point d'entrée
│   └── requirements.txt
├── frontend/         # Application React
│   ├── src/          # Code source
│   ├── public/       # Fichiers publics
│   └── package.json
├── start_app.py      # Script de démarrage
└── README.md         # Documentation
```

---

## 🌐 Déploiement

Consultez le fichier `DEPLOIEMENT.md` pour les instructions de déploiement sur :
- Vercel (Frontend)
- Render/Railway (Backend)

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs
2. Consultez la documentation
3. Vérifiez que toutes les dépendances sont installées
