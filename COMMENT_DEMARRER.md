# 🚀 Comment démarrer l'application Collable

## ⚡ Méthode la plus simple (Windows)

### Double-cliquez sur :
```
START_ALL.bat
```

Ce fichier va :
- ✅ Démarrer le backend dans une fenêtre
- ✅ Démarrer le frontend dans une autre fenêtre
- ✅ Afficher les URLs d'accès

---

## 🔧 Méthode manuelle

### 1. Démarrer le Backend
Double-cliquez sur `start_backend.bat`
OU dans un terminal :
```bash
cd backend
venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Démarrer le Frontend
Double-cliquez sur `start_frontend.bat`
OU dans un autre terminal :
```bash
cd frontend
npm run dev
```

---

## 🌐 URLs d'accès

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

---

## 🔑 Comptes de test

### Administrateur
- Email : `admin@collable.fr`
- Mot de passe : `admin123`

---

## ❌ Problèmes courants

### Erreur CORS / Network Error
**Cause** : Le backend n'est pas démarré

**Solution** :
1. Vérifiez que le backend est bien démarré sur http://localhost:8000
2. Ouvrez http://localhost:8000 dans votre navigateur
3. Vous devriez voir : `{"message":"Bienvenue sur l'API du système de pointage Collable"}`

### Le backend ne démarre pas
**Solution** :
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Le frontend ne démarre pas
**Solution** :
```bash
cd frontend
npm install
npm run dev
```

---

## 🛑 Arrêter l'application

Fermez simplement les fenêtres du backend et du frontend

OU dans les terminaux, appuyez sur `Ctrl+C`

---

## 📝 Vérification rapide

### Le backend fonctionne ?
Ouvrez : http://localhost:8000
Vous devriez voir un message JSON

### Le frontend fonctionne ?
Ouvrez : http://localhost:5173
Vous devriez voir la page de connexion

### Les deux communiquent ?
Essayez de vous connecter avec les identifiants admin
Si ça fonctionne = tout est OK ! ✅

---

## 💡 Conseils

1. **Toujours démarrer le backend AVANT le frontend**
2. **Gardez les fenêtres ouvertes** pendant que vous utilisez l'application
3. **Vérifiez les logs** dans les fenêtres pour voir les erreurs
4. **Videz le cache** du navigateur si vous ne voyez pas les modifications (Ctrl+Shift+R)

---

## 🆘 Besoin d'aide ?

Si vous avez toujours des problèmes :
1. Vérifiez que le backend est démarré (http://localhost:8000)
2. Vérifiez que le frontend est démarré (http://localhost:5173)
3. Regardez les logs dans les fenêtres du backend et frontend
4. Vérifiez que les ports 8000 et 5173 ne sont pas utilisés par d'autres applications
