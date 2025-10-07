import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import Logo from '../components/Logo'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    
    setIsLoading(true)
    
    try {
      const user = await login(email, password)
      
      // Rediriger vers le tableau de bord approprié
      navigate(user.role === 'admin' ? '/admin' : '/agent')
      
      toast.success('Connexion réussie')
    } catch (error) {
      console.error('Erreur de connexion:', error)
      
      if (error.response && error.response.status === 401) {
        toast.error('Email ou mot de passe incorrect')
      } else {
        toast.error('Erreur lors de la connexion. Veuillez réessayer.')
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div>
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Logo className="h-16" />
      </div>
      
      {/* Titre */}
      <h2 className="text-3xl font-bold text-center text-collable-teal mb-2">Bon Retour</h2>
      <p className="text-center text-gray-500 mb-8">Connectez-vous pour à votre espace</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Champ Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
            E-mail *
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-collable-teal focus:border-transparent transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin_secure@collable.com"
            required
          />
        </div>
        
        {/* Champ Mot de passe */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-2">
            Mot de passe *
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-collable-teal focus:border-transparent transition-all pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-collable-teal transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Bouton de connexion */}
        <button
          type="submit"
          className="w-full bg-collable-teal hover:bg-collable-dark text-white font-semibold py-3 px-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connexion en cours...
            </span>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>
      
      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm tracking-widest">OULOULOUUUUUU</p>
      </div>
    </div>
  )
}

export default Login
