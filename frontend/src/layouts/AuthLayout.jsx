import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const AuthLayout = () => {
  const { isAuthenticated, isLoading, user } = useAuth()
  
  // Si l'authentification est en cours de chargement, afficher un indicateur de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-collable-teal to-collable-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-collable-light"></div>
      </div>
    )
  }
  
  // Si l'utilisateur est déjà authentifié, rediriger vers le tableau de bord approprié
  if (isAuthenticated) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/agent'} replace />
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-collable-teal to-collable-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-collable-light rounded-3xl shadow-2xl p-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
