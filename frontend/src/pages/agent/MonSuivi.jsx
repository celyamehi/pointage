import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { toast } from 'react-toastify'

const MonSuivi = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [suiviData, setSuiviData] = useState(null)
  
  // Dates par défaut : mois en cours jusqu'à aujourd'hui
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  // Utiliser aujourd'hui comme date de fin par défaut (pas la fin du mois)
  
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])
  
  const fetchSuivi = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/pointage/me/suivi', {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      })
      setSuiviData(response.data)
    } catch (error) {
      console.error('Erreur lors de la récupération du suivi:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Erreur lors de la récupération du suivi'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchSuivi()
  }, [])
  
  const handleFilter = (e) => {
    e.preventDefault()
    
    // Validation : la date de début ne peut pas être après la date de fin
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('La date de début doit être avant la date de fin')
      return
    }
    
    // Validation : la date de fin ne peut pas être dans le futur
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedEndDate = new Date(endDate)
    selectedEndDate.setHours(0, 0, 0, 0)
    
    if (selectedEndDate > today) {
      toast.warning('La date de fin a été ajustée à aujourd\'hui')
      setEndDate(today.toISOString().split('T')[0])
      return
    }
    
    fetchSuivi()
  }
  
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2
    }).format(montant)
  }
  
  const getStatutBadge = (statut) => {
    const badges = {
      'Présent': 'bg-green-100 text-green-800',
      'Retard': 'bg-yellow-100 text-yellow-800',
      'Absence partielle': 'bg-orange-100 text-orange-800',
      'Absent': 'bg-red-100 text-red-800'
    }
    return badges[statut] || 'bg-gray-100 text-gray-800'
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mon Suivi Quotidien</h1>
      
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleFilter} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Filtrer'}
          </button>
        </form>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : suiviData ? (
        <>
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <i className="fas fa-calendar-alt text-2xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Période</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(suiviData.periode.debut).toLocaleDateString('fr-FR')} - {new Date(suiviData.periode.fin).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <i className="fas fa-clock text-2xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Retards total</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {suiviData.totaux.retard_total_minutes} min
                  </p>
                  <p className="text-xs text-gray-400">
                    ({suiviData.totaux.retard_total_heures}h)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <i className="fas fa-times-circle text-2xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Absences</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {suiviData.totaux.nombre_absences} jour{suiviData.totaux.nombre_absences > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <i className="fas fa-money-bill-wave text-2xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Montant déduit</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatMontant(suiviData.totaux.montant_total_deduit)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tableau des détails quotidiens */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Détails quotidiens</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retard Matin
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retard Après-midi
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Retard
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant Déduit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suiviData.details_quotidiens.map((jour) => (
                    <tr key={jour.date} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(jour.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatutBadge(jour.statut)}`}>
                          {jour.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {(jour.retard_matin_minutes > 0 || jour.sortie_anticipee_matin_minutes > 0) ? (
                          <div className="flex flex-col items-center">
                            {jour.retard_matin_minutes > 0 && (
                              <span className="text-yellow-600 font-medium">
                                Retard: {jour.retard_matin_minutes} min
                              </span>
                            )}
                            {jour.sortie_anticipee_matin_minutes > 0 && (
                              <span className="text-orange-600 font-medium text-xs">
                                Sortie: {jour.sortie_anticipee_matin_minutes} min
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {(jour.retard_apres_midi_minutes > 0 || jour.sortie_anticipee_apres_midi_minutes > 0) ? (
                          <div className="flex flex-col items-center">
                            {jour.retard_apres_midi_minutes > 0 && (
                              <span className="text-yellow-600 font-medium">
                                Retard: {jour.retard_apres_midi_minutes} min
                              </span>
                            )}
                            {jour.sortie_anticipee_apres_midi_minutes > 0 && (
                              <span className="text-orange-600 font-medium text-xs">
                                Sortie: {jour.sortie_anticipee_apres_midi_minutes} min
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {jour.retard_total_minutes > 0 ? (
                          <div>
                            <span className="font-semibold text-yellow-700">
                              {jour.retard_total_minutes} min
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({jour.retard_total_heures}h)
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {jour.montant_total_deduit > 0 ? (
                          <div>
                            <span className="font-semibold text-red-600">
                              {formatMontant(jour.montant_total_deduit)}
                            </span>
                            {jour.montant_retard > 0 && (
                              <div className="text-xs text-gray-500">
                                Retard: {formatMontant(jour.montant_retard)}
                              </div>
                            )}
                            {jour.montant_absence_matin > 0 && (
                              <div className="text-xs text-gray-500">
                                Absence matin: {formatMontant(jour.montant_absence_matin)}
                              </div>
                            )}
                            {jour.montant_absence_apres_midi > 0 && (
                              <div className="text-xs text-gray-500">
                                Absence après-midi: {formatMontant(jour.montant_absence_apres_midi)}
                              </div>
                            )}
                            {jour.frais_absence_complete > 0 && (
                              <div className="text-xs text-red-500 font-medium">
                                Frais absence journée: {formatMontant(jour.frais_absence_complete)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-green-600 font-medium">Aucune déduction</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">Aucune donnée disponible pour cette période</p>
        </div>
      )}
    </div>
  )
}

export default MonSuivi
