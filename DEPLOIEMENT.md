# Guide de Déploiement - Collable Pointing System

## Architecture de Déploiement

Ce projet est composé de deux parties qui doivent être déployées séparément :

### 1. Frontend (React + Vite) - Vercel
### 2. Backend (FastAPI + Python) - Render/Railway/Heroku

---

## Déploiement du Frontend sur Vercel

### Étapes :

1. **Connectez votre dépôt GitHub à Vercel**
   - Allez sur https://vercel.com
   - Cliquez sur "Add New Project"
   - Importez votre dépôt GitHub : `celyamehi/pointage`

2. **Configuration du projet**
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Variables d'environnement**
   Ajoutez cette variable dans les paramètres Vercel :
   ```
   VITE_API_URL=https://votre-backend-url.com
   ```

4. **Déployez**
   - Cliquez sur "Deploy"

---

## Déploiement du Backend

### Option 1: Render.com (Recommandé - Gratuit)

1. **Créez un compte sur Render.com**
   - Allez sur https://render.com

2. **Créez un nouveau Web Service**
   - Connectez votre dépôt GitHub
   - Sélectionnez `celyamehi/pointage`

3. **Configuration**
   - Name: `collable-backend`
   - Region: `Frankfurt (EU Central)`
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Variables d'environnement**
   Ajoutez ces variables :
   ```
   SUPABASE_URL=https://abzdvelerwidssigszrq.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiemR2ZWxlcndpZHNzaWdzenJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTgwMTUsImV4cCI6MjA3NTI3NDAxNX0.0R848NnMMkaQVsnuy35Et-1si7gAqtLn8W68YEv9gI0
   SECRET_KEY=your_secret_key_for_jwt_tokens
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

5. **Déployez**

### Option 2: Railway.app

1. **Créez un compte sur Railway.app**
   - Allez sur https://railway.app

2. **Créez un nouveau projet**
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez `celyamehi/pointage`

3. **Configuration**
   - Root Directory: `backend`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Variables d'environnement**
   Ajoutez les mêmes variables que pour Render

---

## Mise à jour de l'URL du Backend dans le Frontend

Une fois le backend déployé, vous devez mettre à jour l'URL de l'API dans le frontend :

1. **Modifiez le fichier `frontend/src/services/api.js`**
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'https://votre-backend-url.com';
   ```

2. **Ajoutez la variable d'environnement dans Vercel**
   - Allez dans les paramètres de votre projet Vercel
   - Section "Environment Variables"
   - Ajoutez : `VITE_API_URL` = `https://votre-backend-url.com`

3. **Redéployez le frontend**

---

## Configuration CORS du Backend

Assurez-vous que le backend autorise les requêtes depuis votre domaine Vercel.

Dans `backend/main.py`, vérifiez que les origines CORS incluent votre URL Vercel :

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://votre-app.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Vérification

1. **Frontend** : https://votre-app.vercel.app
2. **Backend** : https://votre-backend-url.com/docs (Documentation API)

---

## Dépannage

### Erreur 404 sur Vercel
- Vérifiez que le `outputDirectory` est correct (`frontend/dist`)
- Vérifiez que le build s'est terminé avec succès
- Vérifiez les logs de build dans Vercel

### Erreur CORS
- Ajoutez l'URL de votre frontend Vercel dans les origines CORS du backend
- Redéployez le backend

### Erreur de connexion à l'API
- Vérifiez que `VITE_API_URL` est correctement configuré dans Vercel
- Vérifiez que le backend est en ligne et accessible
