import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import api from '../services/api'

function Pointage({ user, onLogout }) {
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const scannerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    }
  }, [])

  const startScanner = () => {
    setScanning(true)
    setResult(null)
    setError('')

    setTimeout(() => {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      })

      scanner.render(onScanSuccess, onScanError)
      scannerRef.current = scanner
    }, 100)
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
      scannerRef.current = null
    }
    setScanning(false)
  }

  const onScanSuccess = async (decodedText) => {
    stopScanner()
    setLoading(true)

    try {
      const response = await api.post('/api/pointage/pointer', {
        qrcode: decodedText
      })

      setResult({
        success: true,
        message: response.data.message,
        data: response.data
      })
    } catch (err) {
      console.error('Erreur de pointage:', err)
      setResult({
        success: false,
        message: err.response?.data?.detail || 'Erreur lors du pointage'
      })
    } finally {
      setLoading(false)
    }
  }

  const onScanError = (error) => {
    // Ignorer les erreurs de scan en cours
  }

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">Bonjour, {user?.nom}</h1>
            <p className="text-blue-100 text-sm">{getCurrentDate()}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 hover:bg-blue-700 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Heure actuelle */}
      <div className="text-center py-8">
        <div className="text-5xl font-bold text-gray-800">{getCurrentTime()}</div>
      </div>

      {/* Zone de scan */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {!scanning && !result && (
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Scanner le QR Code</h2>
              <p className="text-gray-500 mb-6">Scannez le QR code pour enregistrer votre pointage</p>
              <button
                onClick={startScanner}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all text-lg"
              >
                Commencer le scan
              </button>
            </div>
          )}

          {scanning && (
            <div>
              <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
              <button
                onClick={stopScanner}
                className="w-full mt-4 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Annuler
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Enregistrement du pointage...</p>
            </div>
          )}

          {result && !loading && (
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                {result.success ? (
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                {result.success ? 'Pointage réussi !' : 'Erreur'}
              </h3>
              <p className="text-gray-600 mb-6">{result.message}</p>
              {result.success && result.data && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                  <p className="text-sm text-gray-500">Session: <span className="font-medium text-gray-800">{result.data.session}</span></p>
                  <p className="text-sm text-gray-500">Type: <span className="font-medium text-gray-800">{result.data.type_pointage}</span></p>
                  <p className="text-sm text-gray-500">Heure: <span className="font-medium text-gray-800">{result.data.heure}</span></p>
                </div>
              )}
              <button
                onClick={() => setResult(null)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all"
              >
                Nouveau pointage
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-around">
          <button className="flex flex-col items-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span className="text-xs mt-1">Pointage</span>
          </button>
          <button 
            onClick={() => navigate('/mes-pointages')}
            className="flex flex-col items-center text-gray-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs mt-1">Historique</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Pointage
