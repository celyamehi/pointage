import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://pointage-p5dr.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 secondes timeout pour éviter le loading infini
})

// Variable pour éviter les boucles de refresh
let isRefreshing = false

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si timeout ou erreur réseau, ne pas rediriger vers login
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.log('⚠️ Timeout ou erreur réseau - mode hors-ligne possible')
      return Promise.reject(error)
    }
    
    // Si le serveur répond avec une erreur 401 (non autorisé)
    if (error.response && error.response.status === 401) {
      console.log('⚠️ Erreur 401 - Token probablement expiré')
      
      // Éviter les boucles infinies
      if (!isRefreshing && !error.config._retry) {
        isRefreshing = true
        error.config._retry = true
        
        // Supprimer le token expiré
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
        
        console.log('🔄 Token supprimé - l\'utilisateur devra se reconnecter')
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
