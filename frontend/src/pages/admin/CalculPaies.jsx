import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const CalculPaies = () => {
  const [paies, setPaies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
  // Générer les années disponibles (5 ans en arrière et 1 an en avant)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i)
  
  const months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ]
  
  // Récupérer les paies
  const fetchPaies = async () => {
    setIsLoading(true)
    
    try {
      const response = await api.get('/api/paie/calcul-tous', {
        params: {
          mois: selectedMonth,
          annee: selectedYear
        }
      })
      
      setPaies(response.data)
      toast.success('Calcul des paies effectué avec succès')
    } catch (error) {
      console.error('Erreur lors du calcul des paies:', error)
      toast.error('Erreur lors du calcul des paies')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Charger les paies au montage et lors du changement de mois/année
  useEffect(() => {
    fetchPaies()
  }, [selectedMonth, selectedYear])
  
  // Formater les montants en DA
  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2
    }).format(montant)
  }
  
  // Formater les heures de retard en minutes et heures
  const formatRetard = (heures) => {
    const minutes = Math.round(heures * 60)
    return {
      heures: heures,
      minutes: minutes,
      display: minutes > 0 ? `${minutes} min (${heures}h)` : '-'
    }
  }
  
  // Formater le rôle
  const formatRole = (role) => {
    const roles = {
      'admin': 'Administrateur',
      'agent': 'Agent',
      'informaticien': 'Informaticien',
      'analyste_informaticienne': 'Analyste informaticienne',
      'superviseur': 'Superviseur',
      'agent_administratif': 'Agent administratif',
      'charge_administration': 'Chargé de l\'administration'
    }
    return roles[role] || role
  }
  
  // Ouvrir le modal de détails
  const handleShowDetails = (paie) => {
    setSelectedAgent(paie)
    setShowDetailsModal(true)
  }
  
  // Calculer le total des paies finales
  const totalPaies = paies.reduce((sum, paie) => sum + paie.paie_finale, 0)
  
  // Exporter en CSV
  const exportToCSV = () => {
    const headers = [
      'Nom',
      'Email',
      'Rôle',
      'Heures travaillées',
      'Heures absence',
      'Heures retard',
      'Jours travaillés',
      'Jours absence',
      'Salaire base (heures travaillées)',
      'Frais panier',
      'Frais transport',
      'Salaire net',
      'Retenues 9%',
      'Retenues fixes',
      'Retenues total',
      'Paie finale'
    ]
    
    const rows = paies.map(paie => [
      paie.nom,
      paie.email,
      formatRole(paie.role),
      paie.heures_travaillees,
      paie.heures_absence,
      paie.heures_retard,
      paie.jours_travailles,
      paie.jours_absence,
      paie.salaire_base,
      paie.frais_panier_total,
      paie.frais_transport_total,
      paie.salaire_net,
      paie.retenues_9_pourcent,
      paie.retenues_fixes,
      paie.retenues_total,
      paie.paie_finale
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `paies_${selectedMonth}_${selectedYear}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Export CSV réussi')
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Calcul des Paies</h1>
      
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="month" className="label">
              Mois
            </label>
            <select
              id="month"
              className="input"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="year" className="label">
              Année
            </label>
            <select
              id="year"
              className="input"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <button
              onClick={fetchPaies}
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Calcul en cours...' : 'Recalculer'}
            </button>
          </div>
          
          <div>
            <button
              onClick={exportToCSV}
              className="btn btn-secondary"
              disabled={paies.length === 0}
            >
              Exporter CSV
            </button>
          </div>
        </div>
      </div>
      
      {/* Statistiques */}
      {paies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <i className="fas fa-users text-blue-600 text-2xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Nombre d'agents</p>
                <p className="text-2xl font-semibold text-gray-900">{paies.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <i className="fas fa-money-bill-wave text-green-600 text-2xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total des paies</p>
                <p className="text-2xl font-semibold text-gray-900">{formatMontant(totalPaies)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <i className="fas fa-calculator text-yellow-600 text-2xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Paie moyenne</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatMontant(totalPaies / paies.length)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tableau des paies */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Détails des paies - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
          </h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : paies.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucune donnée de paie disponible pour cette période.
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
                    Rôle
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jours travaillés
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absences
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retards (min)
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paie finale
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paies.map((paie) => (
                  <tr key={paie.agent_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{paie.nom}</div>
                      <div className="text-sm text-gray-500">{paie.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatRole(paie.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {paie.jours_travailles}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {paie.jours_absence > 0 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {paie.jours_absence} jour{paie.jours_absence > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {paie.heures_retard > 0 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {formatRetard(paie.heures_retard).minutes} min
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                      {formatMontant(paie.paie_finale)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleShowDetails(paie)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal de détails */}
      {showDetailsModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{selectedAgent.nom}</h3>
                  <p className="text-sm text-gray-500">{selectedAgent.email}</p>
                  <p className="text-sm text-gray-500">{formatRole(selectedAgent.role)}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              
              {/* Informations générales */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Taux horaire</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedAgent.taux_horaire} DA</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Heures travaillées</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedAgent.heures_travaillees}h</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Heures théoriques</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedAgent.heures_theoriques}h</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Jours travaillés</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedAgent.jours_travailles}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Retards total</p>
                  <p className="text-lg font-semibold text-yellow-800">
                    {selectedAgent.heures_retard > 0 ? formatRetard(selectedAgent.heures_retard).display : 'Aucun'}
                  </p>
                </div>
              </div>
              
              {/* Calcul détaillé */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Calcul détaillé</h4>
                
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg mb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-700 font-medium">Salaire de base</span>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedAgent.taux_horaire} DA × {selectedAgent.heures_travaillees}h travaillées
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900">{formatMontant(selectedAgent.salaire_base)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-green-600">
                    <span>Frais de panier ({selectedAgent.jours_travailles} jours)</span>
                    <span className="font-semibold">+ {formatMontant(selectedAgent.frais_panier_total)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-green-600">
                    <span>Frais de transport ({selectedAgent.jours_travailles} jours)</span>
                    <span className="font-semibold">+ {formatMontant(selectedAgent.frais_transport_total)}</span>
                  </div>
                  
                  <div className="border-t-2 border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Salaire net</span>
                      <span className="text-xl font-bold text-gray-900">{formatMontant(selectedAgent.salaire_net)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-3 rounded-lg mt-3">
                    <div className="flex justify-between items-center text-orange-700 mb-2">
                      <span>Retenues 9% du salaire de base</span>
                      <span className="font-semibold">- {formatMontant(selectedAgent.retenues_9_pourcent)}</span>
                    </div>
                    <div className="flex justify-between items-center text-orange-700">
                      <span>Retenues fixes</span>
                      <span className="font-semibold">- {formatMontant(selectedAgent.retenues_fixes)}</span>
                    </div>
                    <div className="flex justify-between items-center text-orange-800 font-semibold mt-2 pt-2 border-t border-orange-200">
                      <span>Total retenues</span>
                      <span>- {formatMontant(selectedAgent.retenues_total)}</span>
                    </div>
                  </div>
                  
                  <div className="border-t-2 border-green-500 pt-3 mt-3 bg-green-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-green-800">Paie finale</span>
                      <span className="text-2xl font-bold text-green-600">{formatMontant(selectedAgent.paie_finale)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Détails des absences */}
              {selectedAgent.details_absences && selectedAgent.details_absences.length > 0 && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Détails des absences</h4>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <ul className="space-y-2">
                      {selectedAgent.details_absences.map((absence, index) => (
                        <li key={index} className="text-sm text-red-700">
                          <i className="fas fa-calendar-times mr-2"></i>
                          {new Date(absence.date).toLocaleDateString('fr-FR')} - Absence complète
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Détails des retards */}
              {selectedAgent.details_retards && selectedAgent.details_retards.length > 0 && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Détails des retards</h4>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <ul className="space-y-2">
                      {selectedAgent.details_retards.map((retard, index) => (
                        <li key={index} className="text-sm text-yellow-700">
                          <i className="fas fa-clock mr-2"></i>
                          {new Date(retard.date).toLocaleDateString('fr-FR')} - {retard.minutes} min ({retard.heures}h)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn btn-secondary"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalculPaies
