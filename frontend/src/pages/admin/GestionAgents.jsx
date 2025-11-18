import { useState, useEffect } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const GestionAgents = () => {
  const [agents, setAgents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    role: 'agent'
  })
  
  // Récupérer la liste des agents
  const fetchAgents = async () => {
    setIsLoading(true)
    
    try {
      const response = await api.get('/api/admin/agents')
      setAgents(response.data)
    } catch (error) {
      console.error('Erreur lors de la récupération des agents:', error)
      toast.error('Erreur lors de la récupération des agents')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchAgents()
  }, [])
  
  // Filtrer les agents en fonction du terme de recherche
  const filteredAgents = agents.filter(agent => 
    agent.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Gérer le changement des champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Ouvrir le modal d'ajout d'agent
  const handleOpenAddModal = () => {
    setFormData({
      nom: '',
      email: '',
      password: '',
      role: 'agent'
    })
    setShowAddModal(true)
  }
  
  // Ouvrir le modal de modification d'agent
  const handleOpenEditModal = (agent) => {
    setSelectedAgent(agent)
    setFormData({
      nom: agent.nom,
      email: agent.email,
      password: '',
      role: agent.role
    })
    setShowEditModal(true)
  }
  
  // Ouvrir le modal de suppression d'agent
  const handleOpenDeleteModal = (agent) => {
    setSelectedAgent(agent)
    setShowDeleteModal(true)
  }
  
  // Ajouter un nouvel agent
  const handleAddAgent = async (e) => {
    e.preventDefault()
    
    try {
      await api.post('/api/auth/register', formData)
      
      toast.success('Agent ajouté avec succès')
      setShowAddModal(false)
      fetchAgents()
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'agent:', error)
      
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail)
      } else {
        toast.error('Erreur lors de l\'ajout de l\'agent')
      }
    }
  }
  
  // Modifier un agent
  const handleEditAgent = async (e) => {
    e.preventDefault()
    
    if (!selectedAgent) return
    
    const updateData = {
      nom: formData.nom,
      email: formData.email,
      role: formData.role
    }
    
    // Ajouter le mot de passe uniquement s'il est fourni
    if (formData.password) {
      updateData.password = formData.password
    }
    
    try {
      await api.put(`/api/auth/users/${selectedAgent.id}`, updateData)
      
      toast.success('Agent modifié avec succès')
      setShowEditModal(false)
      fetchAgents()
    } catch (error) {
      console.error('Erreur lors de la modification de l\'agent:', error)
      
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail)
      } else {
        toast.error('Erreur lors de la modification de l\'agent')
      }
    }
  }
  
  // Supprimer un agent
  const handleDeleteAgent = async () => {
    if (!selectedAgent) return
    
    try {
      await api.delete(`/api/auth/users/${selectedAgent.id}`)
      
      toast.success('Agent supprimé avec succès')
      setShowDeleteModal(false)
      fetchAgents()
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'agent:', error)
      
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail)
      } else {
        toast.error('Erreur lors de la suppression de l\'agent')
      }
    }
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestion des Agents</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="w-full md:w-1/2 mb-4 md:mb-0">
            <input
              type="text"
              placeholder="Rechercher un agent..."
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={handleOpenAddModal}
            className="btn btn-primary"
          >
            Ajouter un agent
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun agent trouvé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgents.map((agent) => (
                  <tr key={agent.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {agent.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.role === 'admin' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Administrateur
                        </span>
                      ) : agent.role === 'informaticien' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Informaticien
                        </span>
                      ) : agent.role === 'analyste_informaticienne' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          Analyste informaticienne
                        </span>
                      ) : agent.role === 'superviseur' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Superviseur
                        </span>
                      ) : agent.role === 'agent_administratif' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                          Agent administratif
                        </span>
                      ) : agent.role === 'charge_administration' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Chargé de l'administration
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Agent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenEditModal(agent)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(agent)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal d'ajout d'agent */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ajouter un agent</h3>
              
              <form onSubmit={handleAddAgent}>
                <div className="mb-4">
                  <label htmlFor="nom" className="label">
                    Nom
                  </label>
                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    className="input"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="email" className="label">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="password" className="label">
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="input"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="role" className="label">
                    Rôle
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="input"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="agent">Agent</option>
                    <option value="admin">Administrateur</option>
                    <option value="informaticien">Informaticien</option>
                    <option value="analyste_informaticienne">Analyste informaticienne</option>
                    <option value="superviseur">Superviseur</option>
                    <option value="agent_administratif">Agent administratif</option>
                    <option value="charge_administration">Chargé de l'administration</option>
                  </select>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn btn-secondary mr-2"
                    onClick={() => setShowAddModal(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Ajouter
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de modification d'agent */}
      {showEditModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Modifier l'agent</h3>
              
              <form onSubmit={handleEditAgent}>
                <div className="mb-4">
                  <label htmlFor="edit-nom" className="label">
                    Nom
                  </label>
                  <input
                    id="edit-nom"
                    name="nom"
                    type="text"
                    className="input"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-email" className="label">
                    Email
                  </label>
                  <input
                    id="edit-email"
                    name="email"
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-password" className="label">
                    Nouveau mot de passe (laisser vide pour ne pas modifier)
                  </label>
                  <input
                    id="edit-password"
                    name="password"
                    type="password"
                    className="input"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="edit-role" className="label">
                    Rôle
                  </label>
                  <select
                    id="edit-role"
                    name="role"
                    className="input"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="agent">Agent</option>
                    <option value="admin">Administrateur</option>
                    <option value="informaticien">Informaticien</option>
                    <option value="analyste_informaticienne">Analyste informaticienne</option>
                    <option value="superviseur">Superviseur</option>
                    <option value="agent_administratif">Agent administratif</option>
                    <option value="charge_administration">Chargé de l'administration</option>
                  </select>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="btn btn-secondary mr-2"
                    onClick={() => setShowEditModal(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de suppression d'agent */}
      {showDeleteModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmer la suppression</h3>
              
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir supprimer l'agent <span className="font-semibold">{selectedAgent.nom}</span> ?
                Cette action est irréversible.
              </p>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-secondary mr-2"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteAgent}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionAgents
