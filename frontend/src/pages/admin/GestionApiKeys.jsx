import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'

export default function GestionApiKeys() {
  const [apiKeys, setApiKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyData, setNewKeyData] = useState({ nom: '', description: '' })
  const [createdKey, setCreatedKey] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/keys')
      setApiKeys(response.data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des clés API')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async (e) => {
    e.preventDefault()
    try {
      const response = await api.post('/api/keys', newKeyData)
      setCreatedKey(response.data)
      setNewKeyData({ nom: '', description: '' })
      fetchApiKeys()
      toast.success('Clé API créée avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création de la clé API')
    }
  }

  const handleToggleKey = async (keyId, currentStatus) => {
    try {
      await api.patch(`/api/keys/${keyId}/toggle?actif=${!currentStatus}`)
      fetchApiKeys()
      toast.success(`Clé API ${!currentStatus ? 'activée' : 'désactivée'}`)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la modification de la clé API')
    }
  }

  const handleDeleteKey = async (keyId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette clé API ?')) return
    
    try {
      await api.delete(`/api/keys/${keyId}`)
      fetchApiKeys()
      toast.success('Clé API supprimée')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression de la clé API')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Clé copiée dans le presse-papier')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleString('fr-FR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Clés API</h1>
          <p className="text-gray-600 mt-1">
            Créez et gérez les clés API pour l'accès externe aux données de pointage
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle Clé API
        </button>
      </div>

      {/* Documentation API */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">📚 Documentation API</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Endpoints disponibles :</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><code className="bg-blue-100 px-1 rounded">GET /api/health</code> - Test de connexion (sans auth)</li>
            <li><code className="bg-blue-100 px-1 rounded">GET /api/agents</code> - Liste des agents</li>
            <li><code className="bg-blue-100 px-1 rounded">GET /api/attendance/{'{agent_id}'}?mois=2024-12</code> - Données de présence</li>
          </ul>
          <p className="mt-2"><strong>Authentification :</strong> Ajoutez le header <code className="bg-blue-100 px-1 rounded">X-API-Key: votre_clé</code></p>
        </div>
      </div>

      {/* Liste des clés */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clé (aperçu)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créée le</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière utilisation</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : apiKeys.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  Aucune clé API. Créez-en une pour commencer.
                </td>
              </tr>
            ) : (
              apiKeys.map((key) => (
                <tr key={key.id} className={!key.actif ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{key.nom}</div>
                    {key.description && (
                      <div className="text-sm text-gray-500">{key.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{key.api_key_preview}</code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      key.actif 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {key.actif ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(key.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(key.last_used_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleToggleKey(key.id, key.actif)}
                      className={`${
                        key.actif 
                          ? 'text-yellow-600 hover:text-yellow-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {key.actif ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Créer une nouvelle clé API</h2>
            
            {createdKey ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-2">✅ Clé API créée avec succès !</p>
                  <p className="text-sm text-green-700 mb-3">
                    ⚠️ Copiez cette clé maintenant. Elle ne sera plus visible après fermeture.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border rounded p-2 text-sm break-all">
                      {createdKey.api_key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdKey.api_key)}
                      className={`px-3 py-2 rounded ${
                        copied 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {copied ? '✓' : '📋'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreatedKey(null)
                  }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la clé *
                  </label>
                  <input
                    type="text"
                    required
                    value={newKeyData.nom}
                    onChange={(e) => setNewKeyData({ ...newKeyData, nom: e.target.value })}
                    placeholder="Ex: Application RH"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={newKeyData.description}
                    onChange={(e) => setNewKeyData({ ...newKeyData, description: e.target.value })}
                    placeholder="Ex: Utilisée pour synchroniser les données avec le système RH"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg"
                  >
                    Créer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
