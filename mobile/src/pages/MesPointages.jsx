import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function MesPointages({ user, onLogout }) {
  const navigate = useNavigate()
  const [pointages, setPointages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPointages()
  }, [])

  const fetchPointages = async () => {
    try {
      const response = await api.get('/api/pointage/mes-pointages')
      setPointages(response.data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return '-'
    return timeStr.substring(0, 5)
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">Mes Pointages</h1>
            <p className="text-blue-100 text-sm">{user?.nom}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 hover:bg-blue-700 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Liste des pointages */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : pointages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun pointage enregistré
          </div>
        ) : (
          <div className="space-y-3">
            {pointages.map((jour, index) => (
              <div key={index} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-gray-800">{formatDate(jour.date)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    jour.statut === 'complet' ? 'bg-green-100 text-green-700' :
                    jour.statut === 'incomplet' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {jour.statut}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Matin</p>
                    <div className="flex space-x-2">
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                        {formatTime(jour.matin_arrivee)}
                      </span>
                      <span className="bg-red-50 text-red-700 px-2 py-1 rounded">
                        {formatTime(jour.matin_sortie)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Après-midi</p>
                    <div className="flex space-x-2">
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                        {formatTime(jour.apres_midi_arrivee)}
                      </span>
                      <span className="bg-red-50 text-red-700 px-2 py-1 rounded">
                        {formatTime(jour.apres_midi_sortie)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-around">
          <button 
            onClick={() => navigate('/pointage')}
            className="flex flex-col items-center text-gray-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span className="text-xs mt-1">Pointage</span>
          </button>
          <button className="flex flex-col items-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs mt-1">Historique</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MesPointages
