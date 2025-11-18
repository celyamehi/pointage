import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Html5QrcodeScanner } from 'html5-qrcode'
import api from '../../services/api'
import { toast } from 'react-toastify'
import './ScanQRCode.css'

const ScanQRCode = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [cameraError, setCameraError] = useState(false)
  
  useEffect(() => {
    // Variable pour stocker l'instance du scanner
    let html5QrcodeScanner = null;
    
    if (!scanResult && !isSubmitting) {
      try {
        // Configuration du scanner (caméra uniquement, pas d'upload)
        html5QrcodeScanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: 250,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            aspectRatio: 1.0,
            supportedScanTypes: [0] // 0 = caméra uniquement, pas d'upload de fichier
          },
          /* verbose= */ false);
        
        // Fonction appelée en cas de succès
        const onScanSuccess = (decodedText) => {
          console.log(`QR Code détecté: ${decodedText}`);
          setScanResult(decodedText);
          setIsScanning(false);
          
          // Soumettre le pointage
          handleSubmitPointage(decodedText);
          
          // Arrêter le scanner
          try {
            html5QrcodeScanner.clear();
          } catch (error) {
            console.error("Erreur lors de l'arrêt du scanner:", error);
          }
        };
        
        // Fonction appelée en cas d'erreur
        const onScanFailure = (error) => {
          // Ignorer les erreurs normales de scan
        };
        
        // Démarrer le scanner
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        setIsScanning(true);
        
      } catch (error) {
        console.error("Erreur lors de l'initialisation du scanner:", error);
        setCameraError(true);
      }
    }
    
    // Nettoyer le scanner lors du démontage du composant
    return () => {
      if (html5QrcodeScanner) {
        try {
          html5QrcodeScanner.clear();
        } catch (error) {
          // Ignorer les erreurs lors du nettoyage
        }
      }
    };
  }, [scanResult, isSubmitting]);
  
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
    setCameraError(false)
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
        ) : cameraError ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
              <p className="font-semibold">Erreur d'accès à la caméra</p>
              <p className="mt-2">Impossible d'accéder à votre caméra. Vérifiez que votre appareil dispose d'une caméra et qu'elle fonctionne correctement.</p>
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
            
            <div className="flex flex-col items-center mb-6">
              <div id="qr-reader" style={{ width: '100%', maxWidth: '500px' }}></div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Assurez-vous que la caméra est activée et que le QR Code est bien visible.
              </p>
              <p className="text-sm text-gray-500">
                Si la caméra ne s'active pas, vérifiez que vous avez autorisé l'accès dans les paramètres de votre navigateur.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ScanQRCode
