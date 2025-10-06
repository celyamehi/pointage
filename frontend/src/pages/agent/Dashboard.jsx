import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { toast } from 'react-toastify'

const AgentDashboard = () => {
  const { user } = useAuth()
  const [pointagesAujourdhui, setPointagesAujourdhui] = useState({ matin: null, apres_midi: null })
  const [isLoading, setIsLoading] = useState(true)
  
  // Formatage de la date du jour
  const today = new Date()
  const formattedDate = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  
  // Déterminer la session actuelle (matin ou après-midi)
  const currentHour = today.getHours()
  const currentSession = currentHour < 12 ? 'matin' : 'apres-midi'
  
  useEffect(() => {
    const fetchPointages = async () => {
      try {
        const response = await api.get('/api/pointage/me')
        
        // Filtrer pour obtenir uniquement les pointages d'aujourd'hui
        const todayStr = today.toISOString().split('T')[0]
        const todayPointage = response.data.find(p => p.date === todayStr)
        
        if (todayPointage) {
          setPointagesAujourdhui({
            matin: todayPointage.matin,
            apres_midi: todayPointage.apres_midi
          })
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des pointages:', error)
        toast.error('Erreur lors de la récupération des pointages')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPointages()
  }, [])
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Bienvenue, {user?.nom} !</h2>
        <p className="text-gray-600 mb-2">Aujourd'hui : {formattedDate}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Pointages d'aujourd'hui</h2>
        
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-2">Matin</h3>
              {pointagesAujourdhui.matin ? (
                <p className="text-green-600 font-semibold">
                  Pointé à {pointagesAujourdhui.matin}
                </p>
              ) : (
                <p className={`${currentSession === 'matin' ? 'text-orange-500' : 'text-red-500'} font-semibold`}>
                  {currentSession === 'matin' ? 'Non pointé (session en cours)' : 'Non pointé'}
                </p>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-2">Après-midi</h3>
              {pointagesAujourdhui.apres_midi ? (
                <p className="text-green-600 font-semibold">
                  Pointé à {pointagesAujourdhui.apres_midi}
                </p>
              ) : (
                <p className={`${currentSession === 'apres-midi' ? 'text-orange-500' : 'text-gray-500'} font-semibold`}>
                  {currentSession === 'apres-midi' ? 'Non pointé (session en cours)' : 'Non pointé'}
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <Link to="/agent/scan" className="btn btn-primary">
            Scanner le QR Code pour pointer
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/agent/pointages" className="btn btn-secondary">
            Voir mes pointages
          </Link>
          <Link to="/agent/profil" className="btn btn-secondary">
            Mon profil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AgentDashboard
