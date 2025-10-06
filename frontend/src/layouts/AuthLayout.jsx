import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const AuthLayout = () => {
  const { isAuthenticated, isLoading, user } = useAuth()
  
  // Si l'authentification est en cours de chargement, afficher un indicateur de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  // Si l'utilisateur est déjà authentifié, rediriger vers le tableau de bord approprié
  if (isAuthenticated) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/agent'} replace />
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-blue to-pastel-purple flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Collable</h1>
          <p className="text-gray-600">Système de pointage</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
