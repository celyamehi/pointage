import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { OfflineProvider } from './contexts/OfflineContext'
import OfflineIndicator from './components/OfflineIndicator'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <OfflineProvider>
          <App />
          <OfflineIndicator />
          <ToastContainer position="top-right" autoClose={3000} />
        </OfflineProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
