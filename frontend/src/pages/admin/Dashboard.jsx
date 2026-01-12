import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_agents: 0,
    agents_presents_matin: 0,
    agents_absents_matin: 0,
    agents_presents_aprem: 0,
    agents_absents_aprem: 0,
    arrivees_matin: 0,
    arrivees_aprem: 0,
    pointages_matin: 0,
    pointages_aprem: 0,
    liste_presents_matin: [],
    liste_presents_aprem: []
  })
  const [isLoading, setIsLoading] = useState(true)
  
  // Formatage de la date du jour
  const today = new Date()
  const formattedDate = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  
  // Déterminer la session actuelle (GMT+1)
  const currentHour = today.getHours()
  const isAfternoon = currentHour >= 13
  
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get('/api/admin/dashboard')
        console.log('📊 Données reçues du backend:', response.data)
        setStats(response.data)
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error)
        toast.error('Erreur lors de la récupération des statistiques')
      } finally {
        setIsLoading(false)
      }
    }
    
    // Charger les stats au démarrage
    fetchDashboardStats()
    
    // Rafraîchir automatiquement toutes les 30 secondes
    const interval = setInterval(() => {
      fetchDashboardStats()
    }, 30000) // 30 secondes
    
    // Nettoyer l'intervalle au démontage du composant
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord administrateur</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Aujourd'hui : {formattedDate}</h2>
      </div>
      
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-6 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Statistiques générales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total des agents</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.total_agents}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Arrivées matin</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.arrivees_matin}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Arrivées après-midi</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.arrivees_aprem}</p>
            </div>
          </div>
          
          {/* Statistiques Matin et Après-midi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Matin */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-blue-500">
              <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                  <span className="mr-2">🌅</span> Matin (8h-12h30)
                </h3>
                {isAfternoon && (
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                    Session terminée
                  </span>
                )}
                {!isAfternoon && (
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full flex items-center">
                    <span className="inline-block w-2 h-2 bg-green-600 rounded-full mr-1 animate-pulse"></span>
                    En temps réel
                  </span>
                )}
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Total agents</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total_agents}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Présents</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.agents_presents_matin !== undefined ? stats.agents_presents_matin : '?'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Absents</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.agents_absents_matin !== undefined ? stats.agents_absents_matin : '?'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{stats.pointages_matin}</span> pointages enregistrés
                  </p>
                </div>
              </div>
            </div>
            
            {/* Après-midi */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border-t-4 border-orange-500">
              <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-orange-800 flex items-center">
                  <span className="mr-2">🌇</span> Après-midi (13h-18h)
                </h3>
                {!isAfternoon && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    Pas encore commencé
                  </span>
                )}
                {isAfternoon && (
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full flex items-center">
                    <span className="inline-block w-2 h-2 bg-green-600 rounded-full mr-1 animate-pulse"></span>
                    En temps réel
                  </span>
                )}
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Total agents</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total_agents}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Présents</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.agents_presents_aprem !== undefined ? stats.agents_presents_aprem : '?'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Absents</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.agents_absents_aprem !== undefined ? stats.agents_absents_aprem : '?'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{stats.pointages_aprem}</span> pointages enregistrés
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Liste des agents présents en temps réel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agents présents le matin */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center">
              <span className="mr-2">🌅</span> Agents présents ce matin
            </h3>
            <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
              {stats.liste_presents_matin?.length || 0} agent(s)
            </span>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {stats.liste_presents_matin && stats.liste_presents_matin.length > 0 ? (
              <ul className="space-y-2">
                {stats.liste_presents_matin.map((nom, index) => (
                  <li key={index} className="flex items-center text-gray-700 py-1 border-b border-gray-100 last:border-0">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    {nom}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun agent présent ce matin</p>
            )}
          </div>
        </div>
        
        {/* Agents présents l'après-midi */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center">
              <span className="mr-2">🌇</span> Agents présents cet après-midi
            </h3>
            <span className="text-sm bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
              {stats.liste_presents_aprem?.length || 0} agent(s)
            </span>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {stats.liste_presents_aprem && stats.liste_presents_aprem.length > 0 ? (
              <ul className="space-y-2">
                {stats.liste_presents_aprem.map((nom, index) => (
                  <li key={index} className="flex items-center text-gray-700 py-1 border-b border-gray-100 last:border-0">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    {nom}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun agent présent cet après-midi</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
