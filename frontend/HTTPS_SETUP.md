# Configuration HTTPS pour le développement mobile

## Pourquoi HTTPS est nécessaire ?

Les navigateurs mobiles (Safari iOS, Chrome Android) **bloquent l'accès à la caméra** si le site n'est pas servi en HTTPS, sauf pour `localhost`.

## Solution 1 : Utiliser mkcert (Recommandé)

### Installation de mkcert

**Windows (PowerShell en admin) :**
```powershell
choco install mkcert
# ou
scoop install mkcert
```

**macOS :**
```bash
brew install mkcert
```

**Linux :**
```bash
sudo apt install mkcert
# ou
sudo pacman -S mkcert
```

### Générer les certificats SSL

```bash
# Installer l'autorité de certification locale
mkcert -install

# Créer les certificats pour votre IP locale
cd frontend
mkcert localhost 127.0.0.1 192.168.1.X ::1

# Cela crée deux fichiers :
# - localhost+3.pem (certificat)
# - localhost+3-key.pem (clé privée)
```

### Modifier vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Permet l'accès depuis le réseau local
    https: {
      key: fs.readFileSync('./localhost+3-key.pem'),
      cert: fs.readFileSync('./localhost+3.pem'),
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

### Accéder depuis votre mobile

1. Trouvez votre IP locale :
   - Windows : `ipconfig` (cherchez IPv4)
   - Mac/Linux : `ifconfig` ou `ip addr`

2. Sur votre mobile, accédez à : `https://192.168.1.X:5173`

3. Acceptez le certificat si demandé (c'est normal en dev)

## Solution 2 : Utiliser ngrok (Alternative)

Si vous ne pouvez pas installer mkcert :

```bash
# Installer ngrok
npm install -g ngrok

# Démarrer le serveur Vite normalement
npm run dev

# Dans un autre terminal, créer un tunnel HTTPS
ngrok http 5173
```

Ngrok vous donnera une URL HTTPS publique (ex: `https://abc123.ngrok.io`) que vous pouvez utiliser sur n'importe quel appareil.

## Solution 3 : Déploiement sur un serveur HTTPS

Pour la production, déployez sur :
- **Netlify** (HTTPS automatique)
- **Vercel** (HTTPS automatique)
- **GitHub Pages** (HTTPS automatique)
- Votre propre serveur avec Let's Encrypt

## Vérification

Une fois HTTPS activé, vérifiez que :
1. Le cadenas 🔒 apparaît dans la barre d'adresse
2. L'URL commence par `https://`
3. Les permissions caméra sont demandées automatiquement

## Dépannage

### Erreur "NET::ERR_CERT_AUTHORITY_INVALID"
- Normal en développement avec mkcert
- Cliquez sur "Avancé" puis "Continuer vers le site"

### La caméra ne s'active toujours pas
1. Vérifiez que vous êtes bien en HTTPS
2. Videz le cache du navigateur
3. Révoquez et réautorisez les permissions caméra
4. Redémarrez le navigateur

### Problème de certificat sur iOS
- Installez le profil de configuration mkcert sur l'iPhone
- Allez dans Réglages → Général → VPN et gestion des appareils
- Faites confiance au certificat mkcert
