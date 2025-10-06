import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { toast } from 'react-toastify'

const GestionQRCode = () => {
  const [qrCode, setQrCode] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const qrCodeRef = useRef(null)
  
  // Récupérer le QR code actif
  const fetchActiveQRCode = async () => {
    setIsLoading(true)
    
    try {
      const response = await api.get('/api/qrcode/active')
      setQrCode(response.data)
    } catch (error) {
      console.error('Erreur lors de la récupération du QR code:', error)
      toast.error('Erreur lors de la récupération du QR code')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchActiveQRCode()
  }, [])
  
  // Générer un nouveau QR code
  const handleGenerateQRCode = async () => {
    setIsGenerating(true)
    
    try {
      const response = await api.post('/api/qrcode/generate')
      setQrCode(response.data)
      toast.success('Nouveau QR code généré avec succès')
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error)
      toast.error('Erreur lors de la génération du QR code')
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Imprimer le QR code
  const handlePrintQRCode = () => {
    const printWindow = window.open('', '_blank')
    
    if (!printWindow) {
      toast.error('Veuillez autoriser les popups pour imprimer le QR code')
      return
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code de Pointage - Collable</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              text-align: center;
            }
            .qr-container {
              margin: 20px auto;
              max-width: 500px;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            h1 {
              color: #333;
              margin-bottom: 10px;
            }
            p {
              color: #666;
              margin-bottom: 30px;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #999;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>QR Code de Pointage</h1>
          <p>Scannez ce code pour pointer votre présence</p>
          <div class="qr-container">
            <img src="${qrCode.qrcode_data}" alt="QR Code de pointage" />
          </div>
          <div class="footer">
            <p>Collable - Système de Pointage</p>
            <p>Généré le ${new Date().toLocaleDateString()} à ${new Date().toLocaleTimeString()}</p>
          </div>
          <div class="no-print">
            <button onclick="window.print();" style="padding: 10px 20px; background: #0ea5e9; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px;">
              Imprimer
            </button>
          </div>
          <script>
            // Lancer automatiquement l'impression
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `)
    
    printWindow.document.close()
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">QR Code de Pointage</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-700">QR Code actif</h2>
          
          <div className="flex space-x-2 mt-4 md:mt-0">
            <button
              onClick={handlePrintQRCode}
              className="btn btn-secondary"
              disabled={isLoading || !qrCode}
            >
              <i className="fas fa-print mr-2"></i>
              Imprimer le QR code
            </button>
            
            <button
              onClick={handleGenerateQRCode}
              className="btn btn-primary"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Génération en cours...
                </span>
              ) : (
                <>
                  <i className="fas fa-sync-alt mr-2"></i>
                  Mettre à jour le QR code
                </>
              )}
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : qrCode ? (
          <div className="flex flex-col items-center" ref={qrCodeRef}>
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
              <img 
                src={qrCode.qrcode_data} 
                alt="QR Code de pointage" 
                className="max-w-full h-auto"
                style={{ width: '300px', height: '300px' }}
              />
            </div>
            <p className="text-sm text-gray-500 mb-2">
              QR Code généré le {new Date(qrCode.date_generation || Date.now()).toLocaleDateString()} à {new Date(qrCode.date_generation || Date.now()).toLocaleTimeString()}
            </p>
            <p className="text-sm text-gray-500">
              ID: {qrCode.qrcode_id}
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucun QR code disponible. Veuillez en générer un nouveau.
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Instructions</h2>
        
        <div className="space-y-4 text-gray-600">
          <p>
            <strong>1. Génération du QR Code :</strong> Utilisez le bouton "Mettre à jour le QR code" pour générer un nouveau QR code unique. Cela désactivera automatiquement l'ancien QR code.
          </p>
          
          <p>
            <strong>2. Impression :</strong> Cliquez sur "Imprimer le QR code" pour ouvrir une fenêtre d'impression. Vous pouvez ensuite imprimer le QR code et l'afficher dans un endroit accessible aux agents.
          </p>
          
          <p>
            <strong>3. Utilisation :</strong> Les agents doivent se connecter à leur compte et scanner ce QR code pour pointer leur présence le matin et l'après-midi.
          </p>
          
          <p>
            <strong>4. Sécurité :</strong> Pour des raisons de sécurité, il est recommandé de mettre à jour régulièrement le QR code, surtout en cas de suspicion de fraude.
          </p>
        </div>
      </div>
    </div>
  )
}

export default GestionQRCode
