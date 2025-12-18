import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initDB,
  isOnline as checkOnline,
  onConnectionChange,
  countPendingPointages,
  addPendingPointage,
  saveUserData,
  getUserData,
  clearUserData
} from '../services/offlineStorage';
import {
  syncPendingPointages,
  startAutoSync,
  stopAutoSync,
  addSyncListener
} from '../services/syncService';

const OfflineContext = createContext();

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser la base de données et les listeners
  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        setIsOnline(checkOnline());
        const count = await countPendingPointages();
        setPendingCount(count);
        setIsInitialized(true);
        console.log('OfflineContext initialisé, pointages en attente:', count);
      } catch (error) {
        console.error('Erreur initialisation OfflineContext:', error);
        setIsInitialized(true);
      }
    };

    init();

    // Écouter les changements de connexion
    const cleanup = onConnectionChange((online) => {
      setIsOnline(online);
    });

    // Écouter les événements de synchronisation
    const syncCleanup = addSyncListener((event, data) => {
      switch (event) {
        case 'sync_start':
          setIsSyncing(true);
          break;
        case 'sync_complete':
          setIsSyncing(false);
          setLastSyncResult(data);
          setPendingCount(data.pending);
          break;
        case 'sync_error':
          setIsSyncing(false);
          break;
        case 'pointage_synced':
          // Mettre à jour le compteur
          countPendingPointages().then(setPendingCount);
          break;
        default:
          break;
      }
    });

    // Démarrer la synchronisation automatique
    startAutoSync(30000); // Toutes les 30 secondes

    return () => {
      cleanup();
      syncCleanup();
      stopAutoSync();
    };
  }, []);

  // Ajouter un pointage (en ligne ou hors-ligne)
  const addPointage = useCallback(async (qrData) => {
    const pointageData = {
      qr_data: qrData,
      createdAt: new Date().toISOString()
    };

    await addPendingPointage(pointageData);
    const count = await countPendingPointages();
    setPendingCount(count);

    // Si en ligne, synchroniser immédiatement
    if (checkOnline()) {
      syncPendingPointages();
    }

    return { offline: !checkOnline(), pointageData };
  }, []);

  // Forcer la synchronisation
  const forceSync = useCallback(async () => {
    if (!checkOnline()) {
      return { success: false, message: 'Pas de connexion internet' };
    }

    const result = await syncPendingPointages();
    return { success: true, ...result };
  }, []);

  // Sauvegarder les données utilisateur pour mode hors-ligne
  const saveOfflineUserData = useCallback(async (userData) => {
    await saveUserData(userData);
  }, []);

  // Récupérer les données utilisateur sauvegardées
  const getOfflineUserData = useCallback(async () => {
    return await getUserData();
  }, []);

  // Effacer les données utilisateur
  const clearOfflineUserData = useCallback(async () => {
    await clearUserData();
  }, []);

  const value = {
    // État
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncResult,
    isInitialized,
    
    // Actions
    addPointage,
    forceSync,
    saveOfflineUserData,
    getOfflineUserData,
    clearOfflineUserData
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export default OfflineContext;
