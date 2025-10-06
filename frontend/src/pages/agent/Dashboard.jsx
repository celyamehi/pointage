import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { toast } from 'react-toastify'

const AgentDashboard = () => {
  const { user } = useAuth()
  const [pointagesAujourdhui, setPointagesAujourdhui] = useState({ 
    matin_arrivee: null, 
    matin_sortie: null,
    apres_midi_arrivee: null,
    apres_midi_sortie: null
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
            matin_arrivee: todayPointage.matin_arrivee,
            matin_sortie: todayPointage.matin_sortie,
            apres_midi_arrivee: todayPointage.apres_midi_arrivee,
            apres_midi_sortie: todayPointage.apres_midi_sortie
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
            {/* Matin */}
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                <span className="mr-2">🌅</span> Matin (8h-12h30)
              </h3>
              
              {pointagesAujourdhui.matin_arrivee || pointagesAujourdhui.matin_sortie ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Arrivée:</span>
                    {pointagesAujourdhui.matin_arrivee ? (
                      <span className="text-green-600 font-semibold">✓ {pointagesAujourdhui.matin_arrivee}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sortie:</span>
                    {pointagesAujourdhui.matin_sortie ? (
                      <span className="text-blue-600 font-semibold">✓ {pointagesAujourdhui.matin_sortie}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      ✓ Présent
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-red-500 font-semibold mb-2">Aucun pointage</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                    ✗ Absent
                  </span>
                </div>
              )}
            </div>
            
            {/* Après-midi */}
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-orange-500">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                <span className="mr-2">🌇</span> Après-midi (13h-18h)
              </h3>
              
              {pointagesAujourdhui.apres_midi_arrivee || pointagesAujourdhui.apres_midi_sortie ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Arrivée:</span>
                    {pointagesAujourdhui.apres_midi_arrivee ? (
                      <span className="text-green-600 font-semibold">✓ {pointagesAujourdhui.apres_midi_arrivee}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sortie:</span>
                    {pointagesAujourdhui.apres_midi_sortie ? (
                      <span className="text-blue-600 font-semibold">✓ {pointagesAujourdhui.apres_midi_sortie}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      ✓ Présent
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  {currentSession === 'apres-midi' ? (
                    <>
                      <p className="text-orange-500 font-semibold mb-2">Session en cours</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
                        ⏳ En attente
                      </span>
                    </>
                  ) : (
                    <>
                      <p className="text-red-500 font-semibold mb-2">Aucun pointage</p>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                        ✗ Absent
                      </span>
                    </>
                  )}
                </div>
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
