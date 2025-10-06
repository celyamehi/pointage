import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { toast } from 'react-toastify'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_agents: 0,
    agents_presents_aujourd_hui: 0,
    agents_absents_aujourd_hui: 0,
    pointages_aujourd_hui: 0
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
  
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get('/api/admin/dashboard')
        setStats(response.data)
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error)
        toast.error('Erreur lors de la récupération des statistiques')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDashboardStats()
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total des agents</h3>
            <p className="text-3xl font-bold text-gray-800">{stats.total_agents}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Agents présents aujourd'hui</h3>
            <p className="text-3xl font-bold text-green-600">{stats.agents_presents_aujourd_hui}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Agents absents aujourd'hui</h3>
            <p className="text-3xl font-bold text-red-600">{stats.agents_absents_aujourd_hui}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pointages aujourd'hui</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.pointages_aujourd_hui}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/agents" className="btn btn-secondary">
            Gérer les agents
          </Link>
          <Link to="/admin/qrcode" className="btn btn-secondary">
            QR Code de pointage
          </Link>
          <Link to="/admin/pointages" className="btn btn-secondary">
            Voir les pointages
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
