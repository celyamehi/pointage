import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const MesPointages = () => {
  const [pointages, setPointages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [joursFeries, setJoursFeries] = useState({})
  
  // Initialiser les dates par défaut (semaine en cours)
  useEffect(() => {
    const today = new Date()
    const firstDayOfWeek = new Date(today)
    firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1) // Lundi de la semaine en cours
    
    const lastDayOfWeek = new Date(firstDayOfWeek)
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6) // Dimanche de la semaine en cours
    
    setStartDate(formatDateForInput(firstDayOfWeek))
    setEndDate(formatDateForInput(lastDayOfWeek))
  }, [])
  
  // Formater une date pour l'input de type date (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0]
  }
  
  // Formater une date pour l'affichage (DD/MM/YYYY)
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return ''
    
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }
  
  // Récupérer les pointages et les jours fériés
  useEffect(() => {
    const fetchData = async () => {
      if (!startDate || !endDate) return
      
      setIsLoading(true)
      
      try {
        // Récupérer les pointages
        const response = await api.get('/api/pointage/me', {
          params: {
            start_date: startDate,
            end_date: endDate
          }
        })
        
        setPointages(response.data)
        
        // Récupérer les jours fériés pour la période
        try {
          const year = new Date(startDate).getFullYear()
          const jfResponse = await api.get(`/api/jours-feries/annee/${year}`)
          const jfMap = {}
          jfResponse.data.forEach(jf => {
            jfMap[jf.date_ferie] = jf.nom
          })
          setJoursFeries(jfMap)
        } catch (err) {
          console.log('Pas de jours fériés disponibles')
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des pointages:', error)
        toast.error('Erreur lors de la récupération des pointages')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [startDate, endDate])
  
  // Gérer la soumission du formulaire de filtrage
  const handleSubmit = (e) => {
    e.preventDefault()
    // Les pointages sont déjà récupérés via l'effet useEffect
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mes Pointages</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Filtrer par date</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="startDate" className="label">
              Date de début
            </label>
            <input
              id="startDate"
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          
          <div className="flex-1">
            <label htmlFor="endDate" className="label">
              Date de fin
            </label>
            <input
              id="endDate"
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              required
            />
          </div>
          
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary">
              Filtrer
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Résultats</h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : pointages.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucun pointage trouvé pour cette période.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="2">
                    Matin (8h-12h30)
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="2">
                    Après-midi (13h-18h)
                  </th>
                </tr>
                <tr>
                  <th></th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrivée
                  </th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sortie
                  </th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrivée
                  </th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sortie
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pointages.map((pointage, index) => {
                  const isJourFerie = joursFeries[pointage.date]
                  return (
                    <tr key={index} className={isJourFerie ? 'bg-purple-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>{formatDateForDisplay(pointage.date)}</div>
                        {isJourFerie && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                            🎉 {isJourFerie}
                          </span>
                        )}
                      </td>
                      {isJourFerie && !pointage.matin_arrivee && !pointage.matin_sortie && !pointage.apres_midi_arrivee && !pointage.apres_midi_sortie ? (
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-purple-600 font-medium">
                          Jour férié - Pas de pointage requis
                        </td>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {pointage.matin_arrivee ? (
                              <span className="text-green-600 font-semibold">✓ {pointage.matin_arrivee}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {pointage.matin_sortie ? (
                              <span className="text-blue-600 font-semibold">✓ {pointage.matin_sortie}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {pointage.apres_midi_arrivee ? (
                              <span className="text-green-600 font-semibold">✓ {pointage.apres_midi_arrivee}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {pointage.apres_midi_sortie ? (
                              <span className="text-blue-600 font-semibold">✓ {pointage.apres_midi_sortie}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default MesPointages
