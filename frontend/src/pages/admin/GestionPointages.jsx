import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const GestionPointages = () => {
  const [pointages, setPointages] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [activeTab, setActiveTab] = useState('pointages') // 'pointages' ou 'logs'
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPointage, setSelectedPointage] = useState(null)
  const [newHeures, setNewHeures] = useState('08')
  const [newMinutes, setNewMinutes] = useState('00')
  const [justification, setJustification] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Récupérer les pointages
  const fetchPointages = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/api/admin/historique-pointages', {
        params: { limit: 100 }
      })
      setPointages(response.data.pointages || [])
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la récupération des pointages')
    } finally {
      setIsLoading(false)
    }
  }

  // Récupérer les logs d'audit
  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true)
    try {
      const response = await api.get('/api/admin/audit-logs', {
        params: { limit: 50 }
      })
      setAuditLogs(response.data.logs || [])
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la récupération des logs')
    } finally {
      setIsLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchPointages()
  }, [])

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchAuditLogs()
    }
  }, [activeTab])

  // Ouvrir le modal de modification
  const openEditModal = (pointage) => {
    setSelectedPointage(pointage)
    // Extraire heures et minutes de l'heure existante (format HH:MM:SS)
    const heureParts = pointage.heure_pointage ? pointage.heure_pointage.split(':') : ['08', '00']
    setNewHeures(heureParts[0] || '08')
    setNewMinutes(heureParts[1] || '00')
    setJustification('')
    setShowEditModal(true)
  }

  // Ouvrir le modal de suppression
  const openDeleteModal = (pointage) => {
    setSelectedPointage(pointage)
    setJustification('')
    setShowDeleteModal(true)
  }

  // Modifier un pointage
  const handleModifier = async () => {
    if (!justification.trim()) {
      toast.error('La justification est obligatoire')
      return
    }

    // Construire l'heure au format HH:MM:SS
    const heureFormatee = `${newHeures.padStart(2, '0')}:${newMinutes.padStart(2, '0')}:00`

    setIsSubmitting(true)
    try {
      await api.put(`/api/admin/pointages/${selectedPointage.id}`, {
        heure_pointage: heureFormatee,
        justification: justification
      })
      toast.success('Pointage modifié avec succès')
      setShowEditModal(false)
      fetchPointages()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors de la modification')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Supprimer (annuler) un pointage
  const handleSupprimer = async () => {
    if (!justification.trim()) {
      toast.error('La justification est obligatoire')
      return
    }

    setIsSubmitting(true)
    try {
      await api.delete(`/api/admin/pointages/${selectedPointage.id}`, {
        data: { justification: justification }
      })
      toast.success('Pointage annulé avec succès')
      setShowDeleteModal(false)
      fetchPointages()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Restaurer un pointage annulé
  const handleRestaurer = async (pointage) => {
    const raison = prompt('Justification pour la restauration:')
    if (!raison || !raison.trim()) {
      toast.error('La justification est obligatoire')
      return
    }

    try {
      await api.post(`/api/admin/pointages/${pointage.id}/restaurer`, {
        justification: raison
      })
      toast.success('Pointage restauré avec succès')
      fetchPointages()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors de la restauration')
    }
  }

  // Formater la date
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }

  // Formater l'heure
  const formatHeure = (heureStr) => {
    if (!heureStr) return '-'
    return heureStr.substring(0, 5)
  }

  // Formater le type de pointage
  const formatType = (type) => {
    return type === 'arrivee' ? 'Arrivée' : 'Sortie'
  }

  // Formater la session
  const formatSession = (session) => {
    return session === 'matin' ? 'Matin' : 'Après-midi'
  }

  // Formater la date/heure pour les logs
  const formatDateTime = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleString('fr-FR')
  }

  // Couleur selon l'action
  const getActionColor = (action) => {
    switch (action) {
      case 'modification': return 'bg-blue-100 text-blue-800'
      case 'suppression': return 'bg-red-100 text-red-800'
      case 'restauration': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestion des Pointages</h1>

      {/* Onglets */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pointages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pointages'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Pointages
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📜 Historique des modifications
            </button>
          </nav>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'pointages' ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Liste des pointages</h2>
            <button
              onClick={fetchPointages}
              className="btn btn-secondary text-sm"
            >
              🔄 Actualiser
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : pointages.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Aucun pointage trouvé.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heure</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pointages.map((pointage) => (
                    <tr key={pointage.id} className={pointage.annule ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900">{pointage.agents?.nom || 'N/A'}</div>
                        <div className="text-gray-500 text-xs">{pointage.agents?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(pointage.date_pointage)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatHeure(pointage.heure_pointage)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatSession(pointage.session)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          pointage.type_pointage === 'arrivee' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {formatType(pointage.type_pointage)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {pointage.annule ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            Annulé
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Actif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {pointage.annule ? (
                          <button
                            onClick={() => handleRestaurer(pointage)}
                            className="text-green-600 hover:text-green-900 mr-3"
                            title="Restaurer"
                          >
                            ↩️ Restaurer
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openEditModal(pointage)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              title="Modifier"
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={() => openDeleteModal(pointage)}
                              className="text-red-600 hover:text-red-900"
                              title="Annuler"
                            >
                              🗑️ Annuler
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Onglet Logs d'audit */
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Historique des modifications</h2>
            <button
              onClick={fetchAuditLogs}
              className="btn btn-secondary text-sm"
            >
              🔄 Actualiser
            </button>
          </div>

          {isLoadingLogs ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Aucune modification enregistrée.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent concerné</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Justification</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {log.admin_email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {log.agent_email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getActionColor(log.action)}`}>
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={log.justification}>
                        {log.justification}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {log.donnees_avant && (
                          <div className="text-xs">
                            <span className="text-red-600">Avant:</span> {log.donnees_avant.heure_pointage || '-'}
                          </div>
                        )}
                        {log.donnees_apres && (
                          <div className="text-xs">
                            <span className="text-green-600">Après:</span> {log.donnees_apres.heure_pointage || '-'}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && selectedPointage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              ✏️ Modifier le pointage
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Agent:</strong> {selectedPointage.agents?.nom} ({selectedPointage.agents?.email})
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Date:</strong> {formatDate(selectedPointage.date_pointage)}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Session:</strong> {formatSession(selectedPointage.session)} - {formatType(selectedPointage.type_pointage)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouvelle heure
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={newHeures}
                  onChange={(e) => setNewHeures(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg text-center text-lg"
                >
                  {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="text-2xl font-bold">:</span>
                <select
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg text-center text-lg"
                >
                  {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">Heure actuelle: {selectedPointage.heure_pointage?.substring(0, 5)}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Expliquez la raison de cette modification..."
                className="w-full p-2 border border-gray-300 rounded-lg h-24"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={handleModifier}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Modification...' : 'Modifier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && selectedPointage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 text-center mb-4">
              Annuler ce pointage ?
            </h3>
            
            <div className="mb-4 bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Agent:</strong> {selectedPointage.agents?.nom}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Date:</strong> {formatDate(selectedPointage.date_pointage)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Heure:</strong> {formatHeure(selectedPointage.heure_pointage)}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Type:</strong> {formatSession(selectedPointage.session)} - {formatType(selectedPointage.type_pointage)}
              </p>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Le pointage sera marqué comme annulé mais restera dans l'historique. Vous pourrez le restaurer ultérieurement si nécessaire.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Justification <span className="text-red-500">*</span>
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Expliquez la raison de cette annulation..."
                className="w-full p-2 border border-gray-300 rounded-lg h-24"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={isSubmitting}
              >
                Retour
              </button>
              <button
                onClick={handleSupprimer}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Annulation...' : 'Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionPointages
