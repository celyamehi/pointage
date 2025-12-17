import React from 'react'
import { Link } from 'react-router-dom'

const DownloadApp = () => {
  const appVersion = "1.0.0"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700">
      {/* Header */}
      <div className="p-4">
        <Link to="/" className="inline-flex items-center text-white hover:text-blue-100 transition">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour au site
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Logo et titre */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6">
              <svg className="w-14 h-14 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Pointage Collable</h1>
            <p className="text-blue-100 text-lg">Application mobile Android</p>
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-white text-sm">
              Version {appVersion}
            </span>
          </div>

          {/* Carte de téléchargement */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.523 2H6.477C5.768 2 5.2 2.768 5.2 3.477v17.046c0 .709.568 1.477 1.277 1.477h11.046c.709 0 1.277-.768 1.277-1.477V3.477C18.8 2.768 18.232 2 17.523 2zM12 20.5c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm4-4H8V5h8v11.5z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Télécharger pour Android</h2>
              <p className="text-gray-500">Fichier APK • ~15 MB</p>
            </div>

            <a
              href="https://github.com/celyamehi/pointage/releases/download/v1.0.0/app-debug.apk"
              download="pointage-collable-v1.0.0.apk"
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg transition-all flex items-center justify-center space-x-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Télécharger l'APK</span>
            </a>

            <p className="text-center text-gray-400 text-sm mt-4">
              Compatible Android 7.0 et supérieur
            </p>
          </div>

          {/* Instructions d'installation */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Instructions d'installation
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800">Téléchargez le fichier APK</p>
                  <p className="text-gray-500 text-sm">Cliquez sur le bouton de téléchargement ci-dessus</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800">Autorisez les sources inconnues</p>
                  <p className="text-gray-500 text-sm">
                    Allez dans <strong>Paramètres → Sécurité → Sources inconnues</strong> et activez l'option
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-800">Installez l'application</p>
                  <p className="text-gray-500 text-sm">Ouvrez le fichier APK téléchargé et suivez les instructions</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold mr-3">
                  ✓
                </div>
                <div>
                  <p className="font-medium text-gray-800">C'est prêt !</p>
                  <p className="text-gray-500 text-sm">Connectez-vous avec vos identifiants habituels</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fonctionnalités */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Fonctionnalités</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center text-white">
                <svg className="w-5 h-5 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Scan QR Code
              </div>
              <div className="flex items-center text-white">
                <svg className="w-5 h-5 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Pointage rapide
              </div>
              <div className="flex items-center text-white">
                <svg className="w-5 h-5 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Historique
              </div>
              <div className="flex items-center text-white">
                <svg className="w-5 h-5 mr-2 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Notifications
              </div>
            </div>
          </div>

          {/* Avertissement de sécurité */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-yellow-800">Note de sécurité</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Cette application est distribuée en dehors du Google Play Store. 
                  Assurez-vous de télécharger uniquement depuis ce site officiel.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-blue-100 text-sm">
            <p>© 2024 Groupe Collable - Tous droits réservés</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DownloadApp
