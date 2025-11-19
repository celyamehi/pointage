import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../contexts/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const GestionPrimes = () => {
  const { token } = useAuth()
  const [primes, setPrimes] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  
  // Filtres
  const [filterAgent, setFilterAgent] = useState('')
  const [filterMois, setFilterMois] = useState(new Date().getMonth() + 1)
  const [filterAnnee, setFilterAnnee] = useState(new Date().getFullYear())
  
  // Formulaire
  const [formData, setFormData] = useState({
    agent_id: '',
    montant: '',
    motif: '',
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear()
  })

  useEffect(() => {
    fetchAgents()
    fetchPrimes()
  }, [filterAgent, filterMois, filterAnnee])

  const fetchAgents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAgents(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des agents:', err)
    }
  }

  const fetchPrimes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterAgent) params.append('agent_id', filterAgent)
      if (filterMois) params.append('mois', filterMois)
      if (filterAnnee) params.append('annee', filterAnnee)
      
      const response = await axios.get(`${API_URL}/api/primes?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPrimes(response.data)
    } catch (err) {
      setError('Erreur lors de la récupération des primes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    try {
      await axios.post(`${API_URL}/api/primes`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setSuccess('Prime ajoutée avec succès')
      setShowModal(false)
      setFormData({
        agent_id: '',
        montant: '',
        motif: '',
        mois: new Date().getMonth() + 1,
        annee: new Date().getFullYear()
      })
      fetchPrimes()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'ajout de la prime')
    }
  }

  const handleDelete = async (primeId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette prime ?')) return
    
    try {
      await axios.delete(`${API_URL}/api/primes/${primeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccess('Prime supprimée avec succès')
      fetchPrimes()
    } catch (err) {
      setError('Erreur lors de la suppression de la prime')
    }
  }

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2
    }).format(montant)
  }

  const moisNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Primes</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gérez les primes attribuées aux agents
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Filtres et bouton ajouter */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent
            </label>
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mois
            </label>
            <select
              value={filterMois}
              onChange={(e) => setFilterMois(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {moisNames.map((mois, index) => (
                <option key={index + 1} value={index + 1}>
                  {mois}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année
            </label>
            <input
              type="number"
              value={filterAnnee}
              onChange={(e) => setFilterAnnee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              + Ajouter une prime
            </button>
          </div>
        </div>
      </div>

      {/* Liste des primes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Motif
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Période
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : primes.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Aucune prime trouvée
                </td>
              </tr>
            ) : (
              primes.map((prime) => (
                <tr key={prime.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {prime.agent_nom}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-600">
                      {formatMontant(prime.montant)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{prime.motif}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {moisNames[prime.mois - 1]} {prime.annee}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(prime.id)}
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

      {/* Modal d'ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Ajouter une prime
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent *
                  </label>
                  <select
                    required
                    value={formData.agent_id}
                    onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Sélectionner un agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant (DA) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.montant}
                    onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motif *
                  </label>
                  <textarea
                    required
                    rows="3"
                    value={formData.motif}
                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Prime de performance, Prime exceptionnelle..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mois *
                    </label>
                    <select
                      required
                      value={formData.mois}
                      onChange={(e) => setFormData({ ...formData, mois: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {moisNames.map((mois, index) => (
                        <option key={index + 1} value={index + 1}>
                          {mois}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Année *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.annee}
                      onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Ajouter
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionPrimes
