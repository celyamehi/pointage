import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useOffline } from '../../contexts/OfflineContext'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../../services/api'
import { toast } from 'react-toastify'
import './ScanQRCode.css'

const ScanQRCode = () => {
  const { user } = useAuth()
  const { isOnline, addPointage, pendingCount } = useOffline()
  const navigate = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [permissionStatus, setPermissionStatus] = useState('checking')
  const [offlineMode, setOfflineMode] = useState(false)
  
  // État pour la confirmation de sortie rapide (dans les 5 minutes après arrivée)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [pendingQrCode, setPendingQrCode] = useState(null)
  
  const html5QrCodeRef = useRef(null)
  const scannerInitialized = useRef(false)
  const scannerStopping = useRef(false)
  
  // Vérifier les permissions et détecter les caméras disponibles
  useEffect(() => {
    const checkCameraPermissions = async () => {
      try {
        // Vérifier si l'API getUserMedia est disponible
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError('Votre navigateur ne supporte pas l\'accès à la caméra. Utilisez un navigateur récent (Chrome, Safari, Firefox).')
          setPermissionStatus('unsupported')
          return
        }

        // Vérifier si on est en HTTPS (requis sur mobile)
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          setCameraError('L\'accès à la caméra nécessite une connexion HTTPS sécurisée.')
          setPermissionStatus('insecure')
          return
        }

        // Demander les permissions caméra
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          // Arrêter immédiatement le stream de test
          stream.getTracks().forEach(track => track.stop())
          setPermissionStatus('granted')
        } catch (permError) {
          console.error('Erreur de permission caméra:', permError)
          if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
            setCameraError('Permission caméra refusée. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.')
            setPermissionStatus('denied')
          } else if (permError.name === 'NotFoundError' || permError.name === 'DevicesNotFoundError') {
            setCameraError('Aucune caméra détectée sur cet appareil.')
            setPermissionStatus('no-device')
          } else {
            setCameraError(`Erreur d\'accès caméra: ${permError.message}`)
            setPermissionStatus('error')
          }
          return
        }

        // Lister les caméras disponibles
        try {
          const devices = await Html5Qrcode.getCameras()
          if (devices && devices.length > 0) {
            setCameras(devices)
            // Préférer la caméra arrière (environment) si disponible
            const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('arrière'))
            setSelectedCamera(backCamera ? backCamera.id : devices[0].id)
          } else {
            setCameraError('Aucune caméra disponible.')
            setPermissionStatus('no-device')
          }
        } catch (devError) {
          console.error('Erreur lors de la détection des caméras:', devError)
          setCameraError('Impossible de détecter les caméras disponibles.')
          setPermissionStatus('error')
        }
      } catch (error) {
        console.error('Erreur générale:', error)
        setCameraError(`Erreur inattendue: ${error.message}`)
        setPermissionStatus('error')
      }
    }

    checkCameraPermissions()
  }, [])

  // Démarrer le scanner quand une caméra est sélectionnée
  useEffect(() => {
    if (!selectedCamera || scanResult || isSubmitting || permissionStatus !== 'granted' || scannerInitialized.current) {
      return
    }

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader')
        html5QrCodeRef.current = html5QrCode
        scannerInitialized.current = true

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false
        }

        await html5QrCode.start(
          selectedCamera,
          config,
          (decodedText) => {
            console.log(`QR Code détecté: ${decodedText}`)
            setScanResult(decodedText)
            setIsScanning(false)
            handleSubmitPointage(decodedText)
            
            // Arrêter le scanner de manière sécurisée
            if (html5QrCodeRef.current && scannerInitialized.current && !scannerStopping.current) {
              scannerStopping.current = true
              html5QrCodeRef.current.stop()
                .then(() => {
                  scannerInitialized.current = false
                  scannerStopping.current = false
                })
                .catch(err => {
                  console.warn('Scanner déjà arrêté:', err.message)
                  scannerStopping.current = false
                })
            }
          },
          (errorMessage) => {
            // Ignorer les erreurs de scan normales (pas de QR détecté)
          }
        )

        setIsScanning(true)
      } catch (error) {
        console.error('Erreur démarrage scanner:', error)
        setCameraError(`Impossible de démarrer la caméra: ${error.message}`)
        scannerInitialized.current = false
      }
    }

    startScanner()

    // Cleanup
    return () => {
      if (html5QrCodeRef.current && scannerInitialized.current && !scannerStopping.current) {
        scannerStopping.current = true
        html5QrCodeRef.current.stop()
          .then(() => {
            if (html5QrCodeRef.current) {
              html5QrCodeRef.current.clear()
            }
            scannerInitialized.current = false
            scannerStopping.current = false
          })
          .catch(err => {
            console.warn('Erreur nettoyage (scanner peut-être déjà arrêté):', err.message)
            scannerStopping.current = false
          })
      }
    }
  }, [selectedCamera, scanResult, isSubmitting, permissionStatus])
  
  // Fonction pour soumettre le pointage
  const handleSubmitPointage = async (qrcode, forceConfirmation = false) => {
    if (!qrcode || isSubmitting) return
    
    setIsSubmitting(true)
    
    // Mode hors-ligne : stocker le pointage localement
    if (!isOnline) {
      try {
        const result = await addPointage(qrcode)
        setOfflineMode(true)
        toast.info('📱 Pointage enregistré hors-ligne. Il sera synchronisé automatiquement quand la connexion sera rétablie.')
        
        setTimeout(() => {
          navigate('/agent')
        }, 2000)
      } catch (error) {
        console.error('Erreur stockage hors-ligne:', error)
        toast.error('Erreur lors de l\'enregistrement hors-ligne.')
        setScanResult(null)
        setIsScanning(false)
      } finally {
        setIsSubmitting(false)
      }
      return
    }
    
    // Mode en ligne : envoyer au serveur
    try {
      // Déterminer la session actuelle (matin ou après-midi)
      const currentHour = new Date().getHours()
      const session = currentHour < 13 ? 'matin' : 'apres-midi'
      
      // Envoyer la requête de pointage
      const response = await api.post('/api/pointage/', {
        agent_id: user.id,
        qrcode: qrcode,
        session: session,
        force_confirmation: forceConfirmation
      })
      
      // Vérifier si une confirmation est requise
      if (response.data.needs_confirmation) {
        setConfirmationMessage(response.data.confirmation_message)
        setPendingQrCode(qrcode)
        setShowConfirmation(true)
        setIsSubmitting(false)
        return
      }
      
      // Afficher un message de succès
      toast.success(response.data.message)
      
      // Rediriger vers le tableau de bord après un court délai
      setTimeout(() => {
        navigate('/agent')
      }, 2000)
    } catch (error) {
      console.error('Erreur lors du pointage:', error)
      
      // Si erreur réseau, basculer en mode hors-ligne
      if (!error.response || error.code === 'ERR_NETWORK') {
        try {
          await addPointage(qrcode)
          setOfflineMode(true)
          toast.info('📱 Connexion perdue. Pointage enregistré hors-ligne.')
          
          setTimeout(() => {
            navigate('/agent')
          }, 2000)
          return
        } catch (offlineError) {
          console.error('Erreur stockage hors-ligne:', offlineError)
        }
      }
      
      if (error.response && error.response.data && error.response.data.detail) {
        toast.error(error.response.data.detail)
      } else {
        toast.error('Erreur lors du pointage. Veuillez réessayer.')
      }
      
      // Réinitialiser le scanner
      setScanResult(null)
      setIsScanning(false)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Fonction pour confirmer le pointage de sortie rapide
  const handleConfirmExit = async () => {
    setShowConfirmation(false)
    if (pendingQrCode) {
      await handleSubmitPointage(pendingQrCode, true)
    }
    setPendingQrCode(null)
    setConfirmationMessage('')
  }
  
  // Fonction pour annuler le pointage de sortie rapide
  const handleCancelExit = () => {
    setShowConfirmation(false)
    setPendingQrCode(null)
    setConfirmationMessage('')
    setScanResult(null)
    setIsScanning(false)
    toast.info('Pointage annulé')
    // Redémarrer le scanner
    scannerInitialized.current = false
    setPermissionStatus('checking')
    window.location.reload()
  }
  
  // Fonction pour redémarrer le scan
  const handleRestartScan = () => {
    setScanResult(null)
    setIsScanning(false)
    setCameraError(null)
    scannerInitialized.current = false
    setPermissionStatus('checking')
    
    // Recharger la page pour réinitialiser complètement
    window.location.reload()
  }

  // Fonction pour changer de caméra
  const handleCameraChange = async (cameraId) => {
    if (html5QrCodeRef.current && scannerInitialized.current) {
      try {
        await html5QrCodeRef.current.stop()
        scannerInitialized.current = false
      } catch (err) {
        console.error('Erreur arrêt caméra:', err)
      }
    }
    setSelectedCamera(cameraId)
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Scanner le QR Code</h1>
      
      {/* Indicateur de mode hors-ligne */}
      {!isOnline && (
        <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          <div>
            <p className="font-medium">Mode hors-ligne actif</p>
            <p className="text-sm">Vos pointages seront synchronisés automatiquement quand la connexion sera rétablie.</p>
          </div>
        </div>
      )}
      
      {/* Indicateur de pointages en attente */}
      {pendingCount > 0 && (
        <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{pendingCount} pointage{pendingCount > 1 ? 's' : ''} en attente de synchronisation</p>
        </div>
      )}
      
      {/* Modal de confirmation pour sortie rapide */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-4">
              Confirmation requise
            </h3>
            <p className="text-gray-600 text-center mb-6">
              {confirmationMessage}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelExit}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Confirmer la sortie
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600">Enregistrement du pointage en cours...</p>
          </div>
        ) : scanResult ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
              <p className="font-semibold">QR Code scanné avec succès !</p>
            </div>
            <button
              onClick={handleRestartScan}
              className="btn btn-primary"
            >
              Scanner à nouveau
            </button>
          </div>
        ) : permissionStatus === 'checking' ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600">Vérification des permissions caméra...</p>
          </div>
        ) : cameraError ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
              <p className="font-semibold">Erreur d'accès à la caméra</p>
              <p className="mt-2">{cameraError}</p>
              {permissionStatus === 'denied' && (
                <div className="mt-4 text-sm">
                  <p className="font-semibold">Pour autoriser l'accès :</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Sur iPhone/iPad : Réglages → Safari → Caméra → Autoriser</li>
                    <li>Sur Android : Paramètres → Applications → Navigateur → Autorisations → Caméra</li>
                  </ul>
                </div>
              )}
              {permissionStatus === 'insecure' && (
                <p className="mt-4 text-sm">
                  Contactez l'administrateur pour activer HTTPS sur le serveur.
                </p>
              )}
            </div>
            <button
              onClick={handleRestartScan}
              className="btn btn-primary"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Placez le QR Code devant la caméra pour effectuer votre pointage.
            </p>

            {cameras.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner une caméra :
                </label>
                <select
                  value={selectedCamera || ''}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `Caméra ${camera.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex flex-col items-center mb-6">
              <div id="qr-reader" style={{ width: '100%', maxWidth: '500px' }}></div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                {isScanning ? '📷 Caméra active - Scannez le QR Code' : '⏳ Initialisation de la caméra...'}
              </p>
              <p className="text-sm text-gray-500">
                Assurez-vous que le QR Code est bien éclairé et centré dans le cadre.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ScanQRCode
