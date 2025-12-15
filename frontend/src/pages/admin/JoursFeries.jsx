import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const JoursFeries = () => {
  const [joursFeries, setJoursFeries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExceptionsModal, setShowExceptionsModal] = useState(false)
  const [showAddExceptionModal, setShowAddExceptionModal] = useState(false)
  const [selectedJourFerie, setSelectedJourFerie] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agents, setAgents] = useState([])
  const [exceptions, setExceptions] = useState([])
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [exceptionMotif, setExceptionMotif] = useState('')

  // Formulaire d'ajout
  const [newJourFerie, setNewJourFerie] = useState({
    date_ferie: '',
    nom: '',
    description: '',
    recurrent: false
  })

  // Années disponibles (année actuelle -1 à +2)
  const currentYear = new Date().getFullYear()
  const availableYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2]

  // Récupérer les jours fériés
  const fetchJoursFeries = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/api/jours-feries/annee/${selectedYear}`)
      setJoursFeries(response.data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la récupération des jours fériés')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJoursFeries()
    fetchAgents()
  }, [selectedYear])

  // Récupérer la liste des agents
  const fetchAgents = async () => {
    try {
      const response = await api.get('/api/admin/agents')
      setAgents(response.data)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // Récupérer les exceptions pour un jour férié
  const fetchExceptions = async (jourFerieId) => {
    try {
      const response = await api.get(`/api/jours-feries/${jourFerieId}/exceptions`)
      setExceptions(response.data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la récupération des exceptions')
    }
  }

  // Ouvrir le modal des exceptions
  const openExceptionsModal = async (jf) => {
    setSelectedJourFerie(jf)
    await fetchExceptions(jf.id)
    setShowExceptionsModal(true)
  }

  // Ajouter une exception
  const handleAddException = async () => {
    if (!selectedAgentId) {
      toast.error('Veuillez sélectionner un agent')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/api/jours-feries/exceptions', {
        jour_ferie_id: selectedJourFerie.id,
        agent_id: selectedAgentId,
        motif: exceptionMotif || null
      })
      toast.success('Exception ajoutée avec succès')
      setShowAddExceptionModal(false)
      setSelectedAgentId('')
      setExceptionMotif('')
      await fetchExceptions(selectedJourFerie.id)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'ajout')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Supprimer une exception
  const handleDeleteException = async (exceptionId) => {
    try {
      await api.delete(`/api/jours-feries/exceptions/${exceptionId}`)
      toast.success('Exception supprimée')
      await fetchExceptions(selectedJourFerie.id)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  // Générer les jours fériés pour une année
  const handleGenererJoursFeries = async () => {
    try {
      const response = await api.post(`/api/jours-feries/generer/${selectedYear}`)
      toast.success(`${response.data.created} jours fériés créés pour ${selectedYear}`)
      fetchJoursFeries()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors de la génération')
    }
  }

  // Ajouter un jour férié personnalisé
  const handleAddJourFerie = async () => {
    if (!newJourFerie.date_ferie || !newJourFerie.nom) {
      toast.error('La date et le nom sont obligatoires')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/api/jours-feries', newJourFerie)
      toast.success('Jour férié ajouté avec succès')
      setShowAddModal(false)
      setNewJourFerie({ date_ferie: '', nom: '', description: '', recurrent: false })
      fetchJoursFeries()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'ajout')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Supprimer un jour férié
  const handleDeleteJourFerie = async () => {
    if (!selectedJourFerie) return

    setIsSubmitting(true)
    try {
      await api.delete(`/api/jours-feries/${selectedJourFerie.id}`)
      toast.success('Jour férié supprimé avec succès')
      setShowDeleteModal(false)
      setSelectedJourFerie(null)
      fetchJoursFeries()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Formater la date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Obtenir le jour de la semaine
  const getDayOfWeek = (dateStr) => {
    const date = new Date(dateStr)
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    return days[date.getDay()]
  }

  // Vérifier si un jour férié est passé
  const isPast = (dateStr) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const jourFerie = new Date(dateStr)
    return jourFerie < today
  }

  // Vérifier si c'est aujourd'hui
  const isToday = (dateStr) => {
    const today = new Date().toISOString().split('T')[0]
    return dateStr === today
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🗓️ Jours Fériés</h1>
          <p className="text-gray-600 text-sm mt-1">Gérez les jours fériés français et personnalisés</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={handleGenererJoursFeries}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>🔄</span> Générer {selectedYear}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <span>➕</span> Ajouter
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total jours fériés</p>
              <p className="text-2xl font-bold text-gray-800">{joursFeries.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">🏛️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Jours légaux</p>
              <p className="text-2xl font-bold text-gray-800">
                {joursFeries.filter(jf => jf.type === 'legal').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">✨</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Jours personnalisés</p>
              <p className="text-2xl font-bold text-gray-800">
                {joursFeries.filter(jf => jf.type === 'custom').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des jours fériés */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Calendrier des jours fériés {selectedYear}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : joursFeries.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📭</span>
            <p className="text-gray-500 mb-4">Aucun jour férié pour {selectedYear}</p>
            <button
              onClick={handleGenererJoursFeries}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Générer les jours fériés français
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jour
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {joursFeries.map((jf) => (
                  <tr 
                    key={jf.id} 
                    className={`${isPast(jf.date_ferie) ? 'bg-gray-50 opacity-60' : ''} ${isToday(jf.date_ferie) ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(jf.date_ferie).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {getDayOfWeek(jf.date_ferie)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{jf.nom}</div>
                      {jf.description && (
                        <div className="text-xs text-gray-500">{jf.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {jf.type === 'legal' ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          🏛️ Légal
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          ✨ Personnalisé
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isToday(jf.date_ferie) ? (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          🎉 Aujourd'hui
                        </span>
                      ) : isPast(jf.date_ferie) ? (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          ✓ Passé
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          ⏳ À venir
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => openExceptionsModal(jf)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        👷 Exceptions
                      </button>
                      {jf.type === 'custom' && (
                        <button
                          onClick={() => {
                            setSelectedJourFerie(jf)
                            setShowDeleteModal(true)
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium ml-2"
                        >
                          🗑️ Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="mt-4 bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Légende</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">🏛️ Légal</span>
            <span className="text-gray-600">Jour férié français officiel</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">✨ Personnalisé</span>
            <span className="text-gray-600">Jour ajouté par l'admin</span>
          </div>
        </div>
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              ➕ Ajouter un jour férié
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newJourFerie.date_ferie}
                  onChange={(e) => setNewJourFerie({ ...newJourFerie, date_ferie: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newJourFerie.nom}
                  onChange={(e) => setNewJourFerie({ ...newJourFerie, nom: e.target.value })}
                  placeholder="Ex: Journée de l'entreprise"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={newJourFerie.description}
                  onChange={(e) => setNewJourFerie({ ...newJourFerie, description: e.target.value })}
                  placeholder="Description du jour férié..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 h-20"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="recurrent"
                  checked={newJourFerie.recurrent}
                  onChange={(e) => setNewJourFerie({ ...newJourFerie, recurrent: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="recurrent" className="ml-2 text-sm text-gray-700">
                  Récurrent (se répète chaque année à la même date)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewJourFerie({ date_ferie: '', nom: '', description: '', recurrent: false })
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={handleAddJourFerie}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal des exceptions */}
      {showExceptionsModal && selectedJourFerie && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                👷 Agents travaillant le {selectedJourFerie.nom}
              </h3>
              <button
                onClick={() => {
                  setShowExceptionsModal(false)
                  setSelectedJourFerie(null)
                  setExceptions([])
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Date:</strong> {new Date(selectedJourFerie.date_ferie).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Les agents listés ci-dessous travailleront ce jour férié et seront comptés comme présents.
              </p>
            </div>

            {/* Liste des exceptions */}
            {exceptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <span className="text-4xl block mb-2">📭</span>
                <p>Aucun agent ne travaille ce jour férié</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {exceptions.map((exc) => (
                  <div key={exc.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{exc.agent_nom}</p>
                      <p className="text-sm text-gray-500">{exc.agent_email}</p>
                      {exc.motif && (
                        <p className="text-xs text-gray-400 mt-1">Motif: {exc.motif}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteException(exc.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      🗑️ Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton ajouter */}
            <button
              onClick={() => setShowAddExceptionModal(true)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <span>➕</span> Ajouter un agent
            </button>
          </div>
        </div>
      )}

      {/* Modal d'ajout d'exception */}
      {showAddExceptionModal && selectedJourFerie && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              ➕ Ajouter un agent qui travaille
            </h3>

            <div className="bg-yellow-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-yellow-800">
                <strong>{selectedJourFerie.nom}</strong> - {new Date(selectedJourFerie.date_ferie).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Sélectionner un agent --</option>
                  {agents
                    .filter(a => !exceptions.find(e => e.agent_id === a.id))
                    .map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.nom} ({agent.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif (optionnel)
                </label>
                <input
                  type="text"
                  value={exceptionMotif}
                  onChange={(e) => setExceptionMotif(e.target.value)}
                  placeholder="Ex: Permanence, urgence..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddExceptionModal(false)
                  setSelectedAgentId('')
                  setExceptionMotif('')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={handleAddException}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && selectedJourFerie && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <span className="text-3xl">🗑️</span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 text-center mb-4">
              Supprimer ce jour férié ?
            </h3>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                <strong>Date:</strong> {formatDate(selectedJourFerie.date_ferie)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Nom:</strong> {selectedJourFerie.nom}
              </p>
              {selectedJourFerie.description && (
                <p className="text-sm text-gray-600">
                  <strong>Description:</strong> {selectedJourFerie.description}
                </p>
              )}
            </div>

            <p className="text-sm text-red-600 text-center mb-4">
              Cette action est irréversible.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedJourFerie(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteJourFerie}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JoursFeries
