import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Pages publiques
import Login from './pages/Login'
import NotFound from './pages/NotFound'

// Pages agent
import AgentDashboard from './pages/agent/Dashboard'
import ScanQRCode from './pages/agent/ScanQRCode'
import MesPointages from './pages/agent/MesPointages'
import MonProfil from './pages/agent/MonProfil'

// Pages admin
import AdminDashboard from './pages/admin/Dashboard'
import GestionAgents from './pages/admin/GestionAgents'
import GestionQRCode from './pages/admin/GestionQRCode'
import Pointages from './pages/admin/Pointages'
import PointagesDetailles from './pages/admin/PointagesDetailles'

// Route protégée pour les utilisateurs authentifiés
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  // Si l'authentification est en cours de chargement, afficher un indicateur de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // Si un rôle spécifique est requis et que l'utilisateur n'a pas ce rôle, rediriger vers le tableau de bord approprié
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/agent'} replace />
  }
  
  // Si tout est OK, afficher le contenu protégé
  return children
}

function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>
      
      {/* Routes agent */}
      <Route path="/agent" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AgentDashboard />} />
        <Route path="scan" element={<ScanQRCode />} />
        <Route path="pointages" element={<MesPointages />} />
        <Route path="profil" element={<MonProfil />} />
      </Route>
      
      {/* Routes admin */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <DashboardLayout isAdmin={true} />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="agents" element={<GestionAgents />} />
        <Route path="qrcode" element={<GestionQRCode />} />
        <Route path="pointages" element={<Pointages />} />
        <Route path="pointages-detailles" element={<PointagesDetailles />} />
      </Route>
      
      {/* Redirection par défaut */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Route 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
