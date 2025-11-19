import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../../services/api'
import { toast } from 'react-toastify'
import './ScanQRCode.css'

const ScanQRCode = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [permissionStatus, setPermissionStatus] = useState('checking')
  
  const html5QrCodeRef = useRef(null)
  const scannerInitialized = useRef(false)
  
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
            
            // Arrêter le scanner
            if (html5QrCodeRef.current) {
              html5QrCodeRef.current.stop().catch(err => console.error('Erreur arrêt scanner:', err))
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
      if (html5QrCodeRef.current && scannerInitialized.current) {
        html5QrCodeRef.current.stop()
          .then(() => {
            html5QrCodeRef.current.clear()
            scannerInitialized.current = false
          })
          .catch(err => console.error('Erreur nettoyage:', err))
      }
    }
  }, [selectedCamera, scanResult, isSubmitting, permissionStatus])
  
  // Fonction pour soumettre le pointage
  const handleSubmitPointage = async (qrcode) => {
    if (!qrcode || isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      // Déterminer la session actuelle (matin ou après-midi)
      const currentHour = new Date().getHours()
      const session = currentHour < 12 ? 'matin' : 'apres-midi'
      
      // Envoyer la requête de pointage
      const response = await api.post('/api/pointage/', {
        agent_id: user.id,
        qrcode: qrcode,
        session: session
      })
      
      // Afficher un message de succès
      toast.success(response.data.message)
      
      // Rediriger vers le tableau de bord après un court délai
      setTimeout(() => {
        navigate('/agent')
      }, 2000)
    } catch (error) {
      console.error('Erreur lors du pointage:', error)
      
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
