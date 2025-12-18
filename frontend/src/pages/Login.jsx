import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import Logo from '../components/Logo'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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
      const user = await login(email, password, rememberMe)
      
      // Message différent si "Se souvenir de moi" est coché
      if (rememberMe) {
        toast.success('📱 Connexion réussie - Vous resterez connecté même hors-ligne')
      } else {
        toast.success('Connexion réussie')
      }
      
      // Rediriger vers le tableau de bord approprié
      navigate(user.role === 'admin' ? '/admin' : '/agent')
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
      <p className="text-center text-gray-500 mb-8">Connectez-vous à votre espace</p>
      
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Checkbox "Se souvenir de moi" */}
        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-collable-teal border-gray-300 rounded focus:ring-collable-teal focus:ring-2"
            />
            <span className="ml-2 text-sm text-gray-600">
              Se souvenir de moi
            </span>
          </label>
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
      
      {/* Lien téléchargement application mobile */}
      <div className="mt-6 text-center">
        <Link 
          to="/telecharger-app" 
          className="inline-flex items-center text-collable-teal hover:text-collable-dark transition-colors text-sm font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Télécharger l'application mobile Android
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm tracking-widest">Powered by Collable</p>
      </div>
    </div>
  )
}

export default Login
