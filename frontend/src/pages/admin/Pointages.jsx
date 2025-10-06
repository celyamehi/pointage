import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const Pointages = () => {
  const [agentsWithPointages, setAgentsWithPointages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exportFormat, setExportFormat] = useState('csv')
  
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
  
  // Récupérer les pointages
  const fetchPointages = async () => {
    if (!startDate || !endDate) return
    
    setIsLoading(true)
    
    try {
      const response = await api.get('/api/admin/agents-pointages', {
        params: {
          start_date: startDate,
          end_date: endDate,
          search: searchTerm || undefined
        }
      })
      
      setAgentsWithPointages(response.data)
    } catch (error) {
      console.error('Erreur lors de la récupération des pointages:', error)
      toast.error('Erreur lors de la récupération des pointages')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    if (startDate && endDate) {
      fetchPointages()
    }
  }, [startDate, endDate])
  
  // Gérer la soumission du formulaire de filtrage
  const handleSubmit = (e) => {
    e.preventDefault()
    fetchPointages()
  }
  
  // Exporter les pointages
  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error('Veuillez sélectionner une période pour l\'export')
      return
    }
    
    setIsExporting(true)
    
    try {
      const response = await api.post('/api/admin/export', {
        start_date: startDate,
        end_date: endDate,
        format: exportFormat
      }, {
        responseType: 'blob'
      })
      
      // Créer un lien de téléchargement pour le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `pointages_${startDate}_${endDate}.${exportFormat}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Export réalisé avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'export des pointages:', error)
      toast.error('Erreur lors de l\'export des pointages')
    } finally {
      setIsExporting(false)
    }
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestion des Pointages</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Filtrer les pointages</h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
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
          
          <div>
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
          
          <div>
            <label htmlFor="searchTerm" className="label">
              Recherche (nom ou email)
            </label>
            <input
              id="searchTerm"
              type="text"
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un agent..."
            />
          </div>
          
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary w-full">
              Filtrer
            </button>
          </div>
        </form>
        
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-md font-semibold text-gray-700 mb-2">Exporter les données</h3>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="exportFormat" className="label">
                Format d'export
              </label>
              <select
                id="exportFormat"
                className="input"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Export en cours...
                  </span>
                ) : (
                  <>
                    <i className="fas fa-download mr-2"></i>
                    Exporter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Résultats</h2>
          <p className="text-sm text-gray-500">
            Période du {formatDateForDisplay(startDate)} au {formatDateForDisplay(endDate)}
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : agentsWithPointages.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucun pointage trouvé pour cette période.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matin
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Après-midi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agentsWithPointages.flatMap(agent => 
                  agent.pointages.map((pointage, index) => (
                    <tr key={`${agent.agent_id}-${pointage.date}`}>
                      {index === 0 && (
                        <>
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                            rowSpan={agent.pointages.length}
                          >
                            {agent.nom}
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                            rowSpan={agent.pointages.length}
                          >
                            {agent.email}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateForDisplay(pointage.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {pointage.matin ? (
                          <span className="text-green-600">{pointage.matin}</span>
                        ) : (
                          <span className="text-red-500">Non pointé</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {pointage.apres_midi ? (
                          <span className="text-green-600">{pointage.apres_midi}</span>
                        ) : (
                          <span className="text-red-500">Non pointé</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Pointages
