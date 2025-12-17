# Application Mobile Pointage Collable

Application mobile Android pour le système de pointage Collable.

## Prérequis

- Node.js 18+
- Android Studio (pour générer l'APK)
- JDK 17+

## Installation

```bash
cd mobile
npm install
```

## Développement

Lancer le serveur de développement :
```bash
npm start
```

## Générer l'APK

### 1. Build du projet web
```bash
npm run build
```

### 2. Initialiser Capacitor (première fois seulement)
```bash
npx cap init "Pointage Collable" "com.collable.pointage" --web-dir dist
```

### 3. Ajouter la plateforme Android (première fois seulement)
```bash
npx cap add android
```

### 4. Synchroniser le projet
```bash
npx cap sync android
```

### 5. Ouvrir dans Android Studio
```bash
npx cap open android
```

### 6. Générer l'APK dans Android Studio
1. Allez dans **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. L'APK sera généré dans `android/app/build/outputs/apk/debug/app-debug.apk`

### 7. Générer un APK signé (pour production)
1. Allez dans **Build → Generate Signed Bundle / APK**
2. Sélectionnez **APK**
3. Créez ou utilisez une clé de signature
4. Sélectionnez **release** comme type de build

## Structure du projet

```
mobile/
├── src/
│   ├── pages/
│   │   ├── Login.jsx       # Page de connexion
│   │   ├── Pointage.jsx    # Page principale avec scan QR
│   │   └── MesPointages.jsx # Historique des pointages
│   ├── services/
│   │   └── api.js          # Configuration Axios
│   ├── App.jsx             # Composant principal
│   ├── main.jsx            # Point d'entrée
│   └── index.css           # Styles Tailwind
├── capacitor.config.json   # Configuration Capacitor
├── package.json
└── vite.config.js
```

## Configuration

L'URL du backend est configurée dans :
- `src/services/api.js`
- `capacitor.config.json`

Par défaut : `https://pointage-p5dr.onrender.com`

## Fonctionnalités

- ✅ Connexion sécurisée
- ✅ Scan QR Code pour pointage
- ✅ Historique des pointages
- ✅ Interface mobile optimisée
- ✅ Support hors-ligne (à venir)

## Déploiement de l'APK

1. Générez l'APK signé
2. Renommez-le en `pointage-collable.apk`
3. Placez-le dans `frontend/public/downloads/`
4. Les utilisateurs pourront le télécharger depuis `/telecharger-app`
