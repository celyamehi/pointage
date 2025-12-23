import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import api from '../services/api';

// Version actuelle de l'application (à mettre à jour à chaque release)
const APP_VERSION = '2.0.4';

const UpdateChecker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Ne vérifier que sur mobile (APK)
    if (Capacitor.isNativePlatform()) {
      checkForUpdates();
    }
  }, []);

  const checkForUpdates = async () => {
    try {
      const response = await api.get('/api/version/check');
      const serverVersion = response.data.version;
      
      // Comparer les versions
      if (isNewerVersion(serverVersion, APP_VERSION)) {
        setUpdateInfo(response.data);
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.log('Erreur vérification mise à jour:', error);
    }
  };

  // Fonction pour comparer les versions (ex: "2.0.4" > "2.0.3")
  const isNewerVersion = (serverVersion, currentVersion) => {
    const server = serverVersion.split('.').map(Number);
    const current = currentVersion.split('.').map(Number);
    
    for (let i = 0; i < Math.max(server.length, current.length); i++) {
      const s = server[i] || 0;
      const c = current[i] || 0;
      if (s > c) return true;
      if (s < c) return false;
    }
    return false;
  };

  const handleUpdate = () => {
    if (updateInfo?.download_url) {
      window.open(updateInfo.download_url, '_system');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (!updateAvailable || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
        {/* Icône */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-xl font-bold text-center text-gray-800 mb-2">
          Mise à jour disponible !
        </h2>
        
        {/* Version */}
        <p className="text-center text-gray-500 mb-4">
          Version {updateInfo?.version} disponible
        </p>

        {/* Notes de version */}
        {updateInfo?.release_notes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Nouveautés :</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {updateInfo.release_notes.map((note, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Boutons */}
        <div className="flex space-x-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Plus tard
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
          >
            Mettre à jour
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateChecker;
