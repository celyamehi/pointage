// Service de synchronisation pour les pointages hors-ligne
import api from './api';
import {
  getPendingPointages,
  deletePendingPointage,
  isOnline,
  onConnectionChange,
  countPendingPointages
} from './offlineStorage';

let syncInProgress = false;
let syncListeners = [];

// Ajouter un listener pour les événements de synchronisation
export const addSyncListener = (callback) => {
  syncListeners.push(callback);
  return () => {
    syncListeners = syncListeners.filter(cb => cb !== callback);
  };
};

// Notifier tous les listeners
const notifySyncListeners = (event, data) => {
  syncListeners.forEach(callback => {
    try {
      callback(event, data);
    } catch (error) {
      console.error('Erreur dans sync listener:', error);
    }
  });
};

// Synchroniser un pointage individuel
const syncSinglePointage = async (pointage) => {
  try {
    const response = await api.post('/api/pointage/scan', {
      qr_data: pointage.qr_data,
      offline_timestamp: pointage.timestamp
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Erreur sync pointage:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || error.message 
    };
  }
};

// Synchroniser tous les pointages en attente
export const syncPendingPointages = async () => {
  if (syncInProgress) {
    console.log('Synchronisation déjà en cours...');
    return { synced: 0, failed: 0, pending: await countPendingPointages() };
  }

  if (!isOnline()) {
    console.log('Pas de connexion, synchronisation reportée');
    return { synced: 0, failed: 0, pending: await countPendingPointages() };
  }

  syncInProgress = true;
  notifySyncListeners('sync_start', {});

  let synced = 0;
  let failed = 0;

  try {
    const pendingPointages = await getPendingPointages();
    console.log(`${pendingPointages.length} pointage(s) en attente de synchronisation`);

    for (const pointage of pendingPointages) {
      const result = await syncSinglePointage(pointage);
      
      if (result.success) {
        await deletePendingPointage(pointage.id);
        synced++;
        notifySyncListeners('pointage_synced', { pointage, result: result.data });
      } else {
        failed++;
        notifySyncListeners('pointage_failed', { pointage, error: result.error });
      }
    }

    const pending = await countPendingPointages();
    notifySyncListeners('sync_complete', { synced, failed, pending });
    
    return { synced, failed, pending };
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    notifySyncListeners('sync_error', { error: error.message });
    return { synced, failed, pending: await countPendingPointages() };
  } finally {
    syncInProgress = false;
  }
};

// Démarrer la synchronisation automatique
let autoSyncInterval = null;
let connectionCleanup = null;

export const startAutoSync = (intervalMs = 30000) => {
  // Arrêter l'auto-sync existant
  stopAutoSync();

  // Synchroniser immédiatement si en ligne
  if (isOnline()) {
    syncPendingPointages();
  }

  // Configurer l'intervalle de synchronisation
  autoSyncInterval = setInterval(() => {
    if (isOnline()) {
      syncPendingPointages();
    }
  }, intervalMs);

  // Écouter les changements de connexion
  connectionCleanup = onConnectionChange((online) => {
    if (online) {
      console.log('Connexion rétablie, synchronisation...');
      notifySyncListeners('connection_restored', {});
      syncPendingPointages();
    } else {
      console.log('Connexion perdue');
      notifySyncListeners('connection_lost', {});
    }
  });

  console.log('Auto-sync démarré (intervalle:', intervalMs, 'ms)');
};

export const stopAutoSync = () => {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
  if (connectionCleanup) {
    connectionCleanup();
    connectionCleanup = null;
  }
  console.log('Auto-sync arrêté');
};

// Vérifier le statut de synchronisation
export const getSyncStatus = async () => {
  const pending = await countPendingPointages();
  return {
    isOnline: isOnline(),
    pendingCount: pending,
    syncInProgress
  };
};

export default {
  syncPendingPointages,
  startAutoSync,
  stopAutoSync,
  addSyncListener,
  getSyncStatus
};
