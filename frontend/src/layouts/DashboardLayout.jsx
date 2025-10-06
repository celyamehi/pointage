import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const DashboardLayout = ({ isAdmin = false }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  // Navigation pour les agents
  const agentNavigation = [
    { name: 'Tableau de bord', to: '/agent', icon: 'home' },
    { name: 'Scanner QR Code', to: '/agent/scan', icon: 'qrcode' },
    { name: 'Mes Pointages', to: '/agent/pointages', icon: 'calendar' },
    { name: 'Mon Profil', to: '/agent/profil', icon: 'user' },
  ]
  
  // Navigation pour les administrateurs
  const adminNavigation = [
    { name: 'Tableau de bord', to: '/admin', icon: 'home' },
    { name: 'Gestion des Agents', to: '/admin/agents', icon: 'users' },
    { name: 'QR Code', to: '/admin/qrcode', icon: 'qrcode' },
    { name: 'Pointages', to: '/admin/pointages', icon: 'calendar' },
  ]
  
  const navigation = isAdmin ? adminNavigation : agentNavigation
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation latérale pour desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-2xl font-bold text-primary-600">Collable</h1>
          </div>
          <div className="mt-8 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <span className="mr-3 h-6 w-6 flex items-center justify-center">
                    <i className={`fas fa-${item.icon}`}></i>
                  </span>
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.nom}</p>
                  <p className="text-xs font-medium text-gray-500">{user?.role === 'admin' ? 'Administrateur' : 'Agent'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
              >
                <span className="mr-3 h-6 w-6 flex items-center justify-center">
                  <i className="fas fa-sign-out-alt"></i>
                </span>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay pour fermer le menu mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      {/* Contenu principal */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Barre de navigation supérieure - visible sur tous les écrans */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-primary-600">Collable</h1>
              <span className="hidden md:inline-block text-sm text-gray-500">
                {user?.role === 'admin' ? '👑 Administrateur' : '👤 Agent'}
              </span>
            </div>
            <button
              type="button"
              className="bg-white p-3 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <i className={`fas fa-${isMobileMenuOpen ? 'times' : 'bars'} text-2xl`}></i>
            </button>
          </div>
          
          {/* Menu déroulant avec animation */}
          <div
            className={`absolute top-full left-0 right-0 transition-all duration-300 ease-in-out overflow-hidden ${
              isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="bg-white shadow-lg border-t border-gray-100 md:max-w-md md:ml-auto md:mr-4 md:rounded-b-lg">
              <div className="pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center pl-4 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                        isActive
                          ? 'border-primary-500 text-primary-700 bg-primary-50'
                          : 'border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                      }`
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mr-3 w-6 flex items-center justify-center">
                      <i className={`fas fa-${item.icon} text-lg`}></i>
                    </span>
                    {item.name}
                  </NavLink>
                ))}
              </div>
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4 py-2">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <i className="fas fa-user text-primary-600"></i>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user?.nom}</div>
                    <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                    <div className="text-xs font-medium text-gray-400 mt-1">
                      {user?.role === 'admin' ? '👑 Administrateur' : '👤 Agent'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center w-full px-3 py-2 text-base font-medium rounded-md text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <span className="mr-3 w-6 flex items-center justify-center">
                      <i className="fas fa-sign-out-alt text-lg"></i>
                    </span>
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contenu de la page */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
