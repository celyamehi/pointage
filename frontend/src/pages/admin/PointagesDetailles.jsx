import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const PointagesDetailles = () => {
  const [pointages, setPointages] = useState([])
  const [agents, setAgents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  // Filtres
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedSession, setSelectedSession] = useState('') // 'matin' ou 'apres-midi'
  
  // Initialiser les dates par défaut (semaine en cours)
  useEffect(() => {
    const today = new Date()
    const firstDayOfWeek = new Date(today)
    firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1)
    
    const lastDayOfWeek = new Date(firstDayOfWeek)
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6)
    
    setStartDate(formatDateForInput(firstDayOfWeek))
    setEndDate(formatDateForInput(lastDayOfWeek))
    
    // Charger la liste des agents
    fetchAgents()
  }, [])
  
  // Formater une date pour l'input
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0]
  }
  
  // Formater une date pour l'affichage
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }
  
  // Récupérer la liste des agents
  const fetchAgents = async () => {
    try {
      const response = await api.get('/api/admin/agents')
      setAgents(response.data)
    } catch (error) {
      console.error('Erreur lors de la récupération des agents:', error)
    }
  }
  
  // Récupérer les pointages avec filtres
  const fetchPointages = async () => {
    if (!startDate || !endDate) {
      toast.error('Veuillez sélectionner une période')
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await api.get('/api/admin/agents-pointages', {
        params: {
          start_date: startDate,
          end_date: endDate,
          search: selectedAgent ? agents.find(a => a.id === selectedAgent)?.nom : undefined
        }
      })
      
      setPointages(response.data)
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
  }, [startDate, endDate, selectedAgent])
  
  // Filtrer les pointages selon la session sélectionnée
  const getFilteredPointages = () => {
    if (!selectedSession) return pointages
    
    return pointages.map(agent => ({
      ...agent,
      pointages: agent.pointages.filter(p => {
        if (selectedSession === 'matin') {
          return p.matin_arrivee || p.matin_sortie
        } else {
          return p.apres_midi_arrivee || p.apres_midi_sortie
        }
      })
    })).filter(agent => agent.pointages.length > 0)
  }
  
  const filteredPointages = getFilteredPointages()
  
  // Exporter en CSV
  const handleExportCSV = () => {
    if (filteredPointages.length === 0) {
      toast.error('Aucune donnée à exporter')
      return
    }
    
    setIsExporting(true)
    
    try {
      // Créer les en-têtes CSV
      let headers = ['Agent', 'Email', 'Date']
      
      if (!selectedSession || selectedSession === 'matin') {
        headers.push('Matin - Arrivée', 'Matin - Sortie')
      }
      if (!selectedSession || selectedSession === 'apres-midi') {
        headers.push('Après-midi - Arrivée', 'Après-midi - Sortie')
      }
      
      // Créer les lignes de données
      const rows = []
      filteredPointages.forEach(agent => {
        agent.pointages.forEach(pointage => {
          const row = [
            agent.nom,
            agent.email,
            formatDateForDisplay(pointage.date)
          ]
          
          if (!selectedSession || selectedSession === 'matin') {
            row.push(pointage.matin_arrivee || '-')
            row.push(pointage.matin_sortie || '-')
          }
          if (!selectedSession || selectedSession === 'apres-midi') {
            row.push(pointage.apres_midi_arrivee || '-')
            row.push(pointage.apres_midi_sortie || '-')
          }
          
          rows.push(row)
        })
      })
      
      // Convertir en CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')
      
      // Créer le fichier et le télécharger
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `pointages_detailles_${startDate}_${endDate}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Export CSV réussi !')
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      toast.error('Erreur lors de l\'export CSV')
    } finally {
      setIsExporting(false)
    }
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pointages Détaillés</h1>
        
        <button
          onClick={handleExportCSV}
          disabled={isExporting || filteredPointages.length === 0}
          className="btn btn-primary flex items-center space-x-2"
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              <span>Export en cours...</span>
            </>
          ) : (
            <>
              <i className="fas fa-download"></i>
              <span>Exporter CSV</span>
            </>
          )}
        </button>
      </div>
      
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Filtres</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date de début */}
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
            />
          </div>
          
          {/* Date de fin */}
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
            />
          </div>
          
          {/* Agent */}
          <div>
            <label htmlFor="agent" className="label">
              Agent
            </label>
            <select
              id="agent"
              className="input"
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="">Tous les agents</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.nom}
                </option>
              ))}
            </select>
          </div>
          
          {/* Session */}
          <div>
            <label htmlFor="session" className="label">
              Session
            </label>
            <select
              id="session"
              className="input"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="">Toutes les sessions</option>
              <option value="matin">Matin uniquement</option>
              <option value="apres-midi">Après-midi uniquement</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Résultats */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Résultats ({filteredPointages.length} agent(s))
          </h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredPointages.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucun pointage trouvé pour cette période et ces filtres.
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {filteredPointages.map((agent) => (
              <div key={agent.agent_id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* En-tête de l'agent */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">{agent.nom}</h3>
                  <p className="text-sm text-gray-600">{agent.email}</p>
                </div>
                
                {/* Tableau des pointages */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        {(!selectedSession || selectedSession === 'matin') && (
                          <>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="2">
                              Matin (8h-12h30)
                            </th>
                          </>
                        )}
                        {(!selectedSession || selectedSession === 'apres-midi') && (
                          <>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="2">
                              Après-midi (13h-18h)
                            </th>
                          </>
                        )}
                      </tr>
                      <tr>
                        <th></th>
                        {(!selectedSession || selectedSession === 'matin') && (
                          <>
                            <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Arrivée
                            </th>
                            <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Sortie
                            </th>
                          </>
                        )}
                        {(!selectedSession || selectedSession === 'apres-midi') && (
                          <>
                            <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Arrivée
                            </th>
                            <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Sortie
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {agent.pointages.map((pointage, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatDateForDisplay(pointage.date)}
                          </td>
                          {(!selectedSession || selectedSession === 'matin') && (
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
                            </>
                          )}
                          {(!selectedSession || selectedSession === 'apres-midi') && (
                            <>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PointagesDetailles
