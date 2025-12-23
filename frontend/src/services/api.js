import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://pointage-p5dr.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes timeout pour le cold start de Render
})

// Variable pour éviter les boucles de refresh
let isRefreshing = false

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Si timeout ou erreur réseau, réessayer une fois
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.log('⚠️ Timeout ou erreur réseau - tentative de retry...')
      
      // Réessayer une fois si pas déjà fait
      if (!originalRequest._networkRetry) {
        originalRequest._networkRetry = true
        console.log('🔄 Retry de la requête après timeout...')
        return api(originalRequest)
      }
      
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
