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
  const agentNavigationBase = [
    { name: 'Tableau de bord', to: '/agent', icon: 'home' },
    { name: 'Scanner QR Code', to: '/agent/scan', icon: 'qrcode' },
    { name: 'Mes Pointages', to: '/agent/pointages', icon: 'calendar' },
    { name: 'Mon Suivi', to: '/agent/suivi', icon: 'chart-line', excludeRoles: ['superviseur', 'charge_administration'] },
    { name: 'Mon Profil', to: '/agent/profil', icon: 'user' },
  ]
  
  // Filtrer la navigation en fonction du rôle de l'utilisateur
  const agentNavigation = agentNavigationBase.filter(item => {
    if (item.excludeRoles && user?.role) {
      return !item.excludeRoles.includes(user.role)
    }
    return true
  })
  
  // Navigation pour les administrateurs
  const adminNavigation = [
    { name: 'Tableau de bord', to: '/admin', icon: 'home' },
    { name: 'Gestion des Agents', to: '/admin/agents', icon: 'users' },
    { name: 'QR Code', to: '/admin/qrcode', icon: 'qrcode' },
    { name: 'Pointages', to: '/admin/pointages-detailles', icon: 'list' },
    { name: 'Calcul des Paies', to: '/admin/paies', icon: 'money-bill-wave' },
    { name: 'Gestion des Primes', to: '/admin/primes', icon: 'gift' },
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
                  <p className="text-xs font-medium text-gray-500">
                    {user?.role === 'admin' ? 'Administrateur' :
                     user?.role === 'informaticien' ? 'Informaticien' :
                     user?.role === 'analyste_informaticienne' ? 'Analyste informaticienne' :
                     user?.role === 'superviseur' ? 'Superviseur' :
                     user?.role === 'agent_administratif' ? 'Agent administratif' :
                     user?.role === 'charge_administration' ? 'Chargé de l\'administration' :
                     'Agent'}
                  </p>
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      {/* Menu mobile en sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-600">Collable</h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-3 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-3 h-6 w-6 flex items-center justify-center">
                  <i className={`fas fa-${item.icon}`}></i>
                </span>
                {item.name}
              </NavLink>
            ))}
          </nav>
          
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <i className="fas fa-user text-primary-600"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.nom}</p>
                <p className="text-xs font-medium text-gray-500">
                  {user?.role === 'admin' ? 'Administrateur' :
                   user?.role === 'informaticien' ? 'Informaticien' :
                   user?.role === 'analyste_informaticienne' ? 'Analyste informaticienne' :
                   user?.role === 'superviseur' ? 'Superviseur' :
                   user?.role === 'agent_administratif' ? 'Agent administratif' :
                   user?.role === 'charge_administration' ? 'Chargé de l\'administration' :
                   'Agent'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                handleLogout()
                setIsMobileMenuOpen(false)
              }}
              className="w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
            >
              <span className="mr-3 h-6 w-6 flex items-center justify-center">
                <i className="fas fa-sign-out-alt"></i>
              </span>
              Déconnexion
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Barre de navigation supérieure */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="md:hidden p-2 rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
              <h1 className="text-xl font-bold text-primary-600">Collable</h1>
              <span className="hidden md:inline-block text-sm text-gray-500">
                {user?.role === 'admin' ? '👑 Administrateur' :
                 user?.role === 'informaticien' ? '💻 Informaticien' :
                 user?.role === 'analyste_informaticienne' ? '📊 Analyste informaticienne' :
                 user?.role === 'superviseur' ? '👨‍💼 Superviseur' :
                 user?.role === 'agent_administratif' ? '📋 Agent administratif' :
                 user?.role === 'charge_administration' ? '🏢 Chargé de l\'administration' :
                 '👤 Agent'}
              </span>
            </div>
            <div className="hidden md:flex items-center">
              <span className="text-sm text-gray-600 mr-4">{user?.nom}</span>
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
