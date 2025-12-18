import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://pointage-p5dr.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 secondes timeout pour éviter le loading infini
})

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si timeout ou erreur réseau, ne pas rediriger vers login
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.log('⚠️ Timeout ou erreur réseau - mode hors-ligne possible')
      return Promise.reject(error)
    }
    
    // Si le serveur répond avec une erreur 401 (non autorisé)
    if (error.response && error.response.status === 401) {
      // Vérifier si on a "Se souvenir de moi" activé
      const rememberMe = localStorage.getItem('rememberMe')
      if (!rememberMe) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        console.log('📱 Erreur 401 mais rememberMe actif - pas de redirection')
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
