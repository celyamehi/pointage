import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../services/api'
import { saveOfflineUserData, getOfflineUserData, clearOfflineUserData } from '../services/offlineStorage'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Vérifier si un token existe dans le localStorage ou hors-ligne
    const checkAuth = async () => {
      let token = localStorage.getItem('token')
      let offlineData = null
      
      // Si pas de token en ligne, essayer de récupérer les données hors-ligne
      if (!token) {
        offlineData = await getOfflineUserData()
        if (offlineData && offlineData.rememberMe) {
          token = offlineData.token
          console.log('📱 Utilisation des données hors-ligne pour connexion automatique')
        }
      }
      
      if (token) {
        try {
          // Vérifier si le token est valide
          const decoded = jwtDecode(token)
          
          // Vérifier si le token est expiré
          const currentTime = Date.now() / 1000
          if (decoded.exp < currentTime) {
            // Token expiré, déconnexion
            logout()
            return
          }
          
          // Configurer le token dans les en-têtes de l'API
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Essayer de récupérer les informations de l'utilisateur
          try {
            const response = await api.get('/api/auth/me')
            setUser(response.data)
            setIsAuthenticated(true)
            
            // Si on est en ligne et qu'on avait des données hors-ligne, mettre à jour
            if (offlineData) {
              await saveOfflineUserData({
                ...offlineData,
                user: response.data,
                token: token
              })
            }
          } catch (apiError) {
            // Si l'API n'est pas accessible, utiliser les données hors-ligne
            if (offlineData && offlineData.user) {
              setUser(offlineData.user)
              setIsAuthenticated(true)
              console.log('📱 Mode hors-ligne - Utilisation des données locales')
            } else {
              throw apiError
            }
          }
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'authentification:', error)
          logout()
        }
      }
      
      setIsLoading(false)
    }
    
    checkAuth()
  }, [])
  
  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await api.post('/api/auth/token', new URLSearchParams({
        username: email,
        password: password
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      
      const { access_token } = response.data
      
      // Stocker le token dans le localStorage
      localStorage.setItem('token', access_token)
      
      // Configurer le token dans les en-têtes de l'API
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      // Récupérer les informations de l'utilisateur
      const userResponse = await api.get('/api/auth/me')
      setUser(userResponse.data)
      setIsAuthenticated(true)
      
      // Si "Se souvenir de moi" est coché, sauvegarder les données hors-ligne
      if (rememberMe) {
        await saveOfflineUserData({
          email,
          token: access_token,
          user: userResponse.data,
          rememberMe: true
        })
        console.log('📱 Données utilisateur sauvegardées pour mode hors-ligne')
      }
      
      return userResponse.data
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      throw error
    }
  }
  
  const logout = () => {
    // Supprimer le token du localStorage
    localStorage.removeItem('token')
    
    // Supprimer le token des en-têtes de l'API
    delete api.defaults.headers.common['Authorization']
    
    // Effacer les données utilisateur hors-ligne
    clearOfflineUserData()
    
    // Réinitialiser l'état
    setUser(null)
    setIsAuthenticated(false)
  }
  
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
