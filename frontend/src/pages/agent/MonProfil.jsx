import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { toast } from 'react-toastify'

const MonProfil = () => {
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Vérifier que les mots de passe correspondent
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas')
      return
    }
    
    // Vérifier que le nouveau mot de passe est suffisamment long
    if (formData.newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Appel API pour changer le mot de passe
      await api.post('/api/auth/change-password', {
        current_password: formData.currentPassword,
        new_password: formData.newPassword
      })
      
      // Réinitialiser le formulaire
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      toast.success('Mot de passe modifié avec succès')
    } catch (error) {
      console.error('Erreur lors de la modification du mot de passe:', error)
      
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail)
      } else {
        toast.error('Erreur lors de la modification du mot de passe')
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mon Profil</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Informations personnelles</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Nom</p>
            <p className="font-medium">{user?.nom}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 mb-1">Rôle</p>
            <p className="font-medium">
              {user?.role === 'admin' ? 'Administrateur' :
               user?.role === 'informaticien' ? 'Informaticien' :
               user?.role === 'analyste_informaticienne' ? 'Analyste informaticienne' :
               user?.role === 'superviseur' ? 'Superviseur' :
               user?.role === 'agent_administratif' ? 'Agent administratif' :
               user?.role === 'charge_administration' ? 'Chargé de l\'administration' :
               'Agent'}
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500 mb-4">
            Pour modifier vos informations personnelles, veuillez contacter un administrateur.
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Changer mon mot de passe</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="currentPassword" className="label">
              Mot de passe actuel
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              className="input"
              value={formData.currentPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="newPassword" className="label">
              Nouveau mot de passe
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="input"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="label">
              Confirmer le nouveau mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Modification en cours...
              </span>
            ) : (
              'Changer le mot de passe'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default MonProfil
