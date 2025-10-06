import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NotFound = () => {
  const { isAuthenticated, user } = useAuth()
  
  // Déterminer la page d'accueil en fonction de l'authentification et du rôle
  const homePath = isAuthenticated 
    ? (user?.role === 'admin' ? '/admin' : '/agent')
    : '/login'
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Page non trouvée</h2>
        <p className="text-gray-600 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          to={homePath}
          className="btn btn-primary"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}

export default NotFound
