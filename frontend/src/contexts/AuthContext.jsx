import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../services/api'
import { saveOfflineUserData, getOfflineUserData, clearOfflineUserData, isOnline } from '../services/offlineStorage'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  
  useEffect(() => {
    // Vérifier si un token existe dans le localStorage ou hors-ligne
    const checkAuth = async () => {
      let token = localStorage.getItem('token')
      let offlineData = null
      
      // Toujours essayer de récupérer les données hors-ligne d'abord
      try {
        offlineData = await getOfflineUserData()
        console.log('📱 Données hors-ligne récupérées:', offlineData ? 'OUI' : 'NON')
      } catch (e) {
        console.log('📱 Erreur récupération données hors-ligne:', e)
      }
      
      // Si pas de token en localStorage, utiliser celui des données hors-ligne
      if (!token && offlineData && offlineData.token) {
        token = offlineData.token
        // Restaurer le token dans localStorage pour les futures requêtes
        localStorage.setItem('token', token)
        console.log('📱 Token restauré depuis IndexedDB')
      }
      
      if (token) {
        try {
          // Vérifier si le token est valide (format)
          const decoded = jwtDecode(token)
          
          // Vérifier si le token est expiré
          const currentTime = Date.now() / 1000
          if (decoded.exp < currentTime) {
            console.log('⏰ Token expiré')
            // Token expiré - mais si on a "Se souvenir de moi", garder les données locales
            if (offlineData && offlineData.rememberMe && offlineData.user) {
              console.log('📱 Token expiré mais données locales disponibles - mode hors-ligne')
              setUser(offlineData.user)
              setIsAuthenticated(true)
              setIsLoading(false)
              return
            }
            logout()
            return
          }
          
          // Configurer le token dans les en-têtes de l'API
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Vérifier si on est en ligne
          const online = isOnline()
          
          if (online) {
            // Essayer de récupérer les informations de l'utilisateur avec timeout
            try {
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
              
              const response = await api.get('/api/auth/me', {
                signal: controller.signal
              })
              clearTimeout(timeoutId)
              
              setUser(response.data)
              setIsAuthenticated(true)
              
              // Mettre à jour les données hors-ligne
              if (offlineData && offlineData.rememberMe) {
                await saveOfflineUserData({
                  ...offlineData,
                  user: response.data,
                  token: token
                })
              }
            } catch (apiError) {
              console.log('📱 API non accessible, utilisation des données locales')
              // Si l'API n'est pas accessible, utiliser les données hors-ligne
              if (offlineData && offlineData.user) {
                setUser(offlineData.user)
                setIsAuthenticated(true)
              } else {
                // Pas de données hors-ligne, on ne peut pas se connecter
                throw apiError
              }
            }
          } else {
            // Mode hors-ligne - utiliser directement les données locales
            console.log('📱 Mode hors-ligne détecté')
            if (offlineData && offlineData.user) {
              setUser(offlineData.user)
              setIsAuthenticated(true)
              console.log('📱 Connexion hors-ligne réussie avec données locales')
            } else {
              console.log('📱 Pas de données hors-ligne disponibles')
            }
          }
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'authentification:', error)
          setAuthError(error.message || 'Erreur de connexion')
          // En cas d'erreur, essayer quand même les données hors-ligne
          if (offlineData && offlineData.user && offlineData.rememberMe) {
            console.log('📱 Fallback sur données hors-ligne après erreur')
            setUser(offlineData.user)
            setIsAuthenticated(true)
            setAuthError(null)
          } else {
            // Ne pas appeler logout() ici pour éviter la boucle
            setUser(null)
            setIsAuthenticated(false)
            localStorage.removeItem('token')
          }
        }
      } else {
        // Pas de token - vérifier si on a des données hors-ligne avec "Se souvenir de moi"
        if (offlineData && offlineData.user && offlineData.rememberMe) {
          console.log('📱 Pas de token mais données hors-ligne disponibles')
          setUser(offlineData.user)
          setIsAuthenticated(true)
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
      
      // Sauvegarder aussi le rememberMe dans localStorage pour persistance
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberMe')
      }
      
      // Configurer le token dans les en-têtes de l'API
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      
      // Récupérer les informations de l'utilisateur
      const userResponse = await api.get('/api/auth/me')
      setUser(userResponse.data)
      setIsAuthenticated(true)
      
      // Si "Se souvenir de moi" est coché, sauvegarder les données hors-ligne
      if (rememberMe) {
        try {
          await saveOfflineUserData({
            email,
            token: access_token,
            user: userResponse.data,
            rememberMe: true,
            savedAt: new Date().toISOString()
          })
          console.log('📱 Données utilisateur sauvegardées pour mode hors-ligne')
        } catch (saveError) {
          console.error('Erreur sauvegarde hors-ligne:', saveError)
        }
      }
      
      return userResponse.data
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      throw error
    }
  }
  
  const logout = async () => {
    // Supprimer le token du localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('rememberMe')
    
    // Supprimer le token des en-têtes de l'API
    delete api.defaults.headers.common['Authorization']
    
    // Effacer les données utilisateur hors-ligne
    try {
      await clearOfflineUserData()
    } catch (e) {
      console.error('Erreur effacement données hors-ligne:', e)
    }
    
    // Réinitialiser l'état
    setUser(null)
    setIsAuthenticated(false)
  }
  
  const value = {
    user,
    isAuthenticated,
    isLoading,
    authError,
    login,
    logout
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
