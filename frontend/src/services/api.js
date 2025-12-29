import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://pointage-p5dr.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 secondes timeout pour le cold start de Render (serveur gratuit)
})

// Variable pour éviter les boucles de refresh
let isRefreshing = false

// Fonction pour réveiller le serveur Render
export const wakeUpServer = async () => {
  try {
    console.log('🔄 Réveil du serveur Render...')
    await axios.get('https://pointage-p5dr.onrender.com/health', { timeout: 90000 })
    console.log('✅ Serveur Render réveillé')
    return true
  } catch (error) {
    console.log('⚠️ Serveur Render toujours en cours de réveil...')
    return false
  }
}

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Si timeout ou erreur réseau, réessayer une fois avec un délai
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.log('⚠️ Timeout ou erreur réseau - le serveur est peut-être en train de se réveiller...')
      
      // Réessayer une seule fois si pas déjà fait
      if (!originalRequest._networkRetry) {
        originalRequest._networkRetry = true
        console.log('🔄 Attente de 5s puis retry de la requête...')
        
        // Attendre 5 secondes avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 5000))
        return api(originalRequest)
      }
      
      // Si déjà réessayé, ne pas boucler
      console.log('❌ Serveur non disponible après retry - veuillez réessayer dans quelques instants')
      return Promise.reject(error)
    }
    
    // Si le serveur répond avec une erreur 401 (non autorisé)
    if (error.response && error.response.status === 401) {
      console.log('⚠️ Erreur 401 - Token expiré, reconnexion nécessaire')
      
      // Éviter les boucles infinies
      if (!isRefreshing && !originalRequest._retry) {
        isRefreshing = true
        originalRequest._retry = true
        
        // Marquer que le token est expiré
        console.log('🔐 Token expiré - l\'utilisateur doit se reconnecter')
        isRefreshing = false
      }
    }
    
    return Promise.reject(error)
  }
)

// Ajouter le token d'authentification aux requêtes si disponible
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default api
