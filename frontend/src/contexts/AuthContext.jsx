import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../services/api'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Vérifier si un token existe dans le localStorage
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      
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
          
          // Récupérer les informations de l'utilisateur
          const response = await api.get('/api/auth/me')
          setUser(response.data)
          setIsAuthenticated(true)
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'authentification:', error)
          logout()
        }
      }
      
      setIsLoading(false)
    }
    
    checkAuth()
  }, [])
  
  const login = async (email, password) => {
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
