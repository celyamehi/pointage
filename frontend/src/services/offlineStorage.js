// Service de stockage local pour le mode hors-ligne
// Utilise IndexedDB pour stocker les pointages en attente de synchronisation

const DB_NAME = 'pointage_offline_db';
const DB_VERSION = 1;
const STORES = {
  PENDING_POINTAGES: 'pending_pointages',
  USER_DATA: 'user_data',
  CACHED_POINTAGES: 'cached_pointages'
};

let db = null;

// Initialiser la base de données IndexedDB
export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Erreur ouverture IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('IndexedDB initialisée avec succès');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Store pour les pointages en attente de synchronisation
      if (!database.objectStoreNames.contains(STORES.PENDING_POINTAGES)) {
        const pendingStore = database.createObjectStore(STORES.PENDING_POINTAGES, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        pendingStore.createIndex('synced', 'synced', { unique: false });
      }

      // Store pour les données utilisateur (token, infos)
      if (!database.objectStoreNames.contains(STORES.USER_DATA)) {
        database.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
      }

      // Store pour le cache des pointages récupérés
      if (!database.objectStoreNames.contains(STORES.CACHED_POINTAGES)) {
        const cachedStore = database.createObjectStore(STORES.CACHED_POINTAGES, { 
          keyPath: 'id' 
        });
        cachedStore.createIndex('date', 'date', { unique: false });
      }
    };
  });
};

// ==================== GESTION DES POINTAGES EN ATTENTE ====================

// Ajouter un pointage en attente de synchronisation
export const addPendingPointage = async (pointageData) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_POINTAGES], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_POINTAGES);
    
    const pointage = {
      ...pointageData,
      timestamp: new Date().toISOString(),
      synced: false,
      retryCount: 0
    };
    
    const request = store.add(pointage);
    
    request.onsuccess = () => {
      console.log('Pointage ajouté en attente:', request.result);
      resolve(request.result);
    };
    
    request.onerror = () => {
      console.error('Erreur ajout pointage:', request.error);
      reject(request.error);
    };
  });
};

// Récupérer tous les pointages en attente
export const getPendingPointages = async () => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_POINTAGES], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_POINTAGES);
    const request = store.getAll();
    
    request.onsuccess = () => {
      // Filtrer les pointages non synchronisés
      const pending = (request.result || []).filter(p => p.synced === false);
      resolve(pending);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Marquer un pointage comme synchronisé
export const markPointageSynced = async (id) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_POINTAGES], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_POINTAGES);
    
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const pointage = getRequest.result;
      if (pointage) {
        pointage.synced = true;
        pointage.syncedAt = new Date().toISOString();
        const updateRequest = store.put(pointage);
        
        updateRequest.onsuccess = () => resolve(true);
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve(false);
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// Supprimer un pointage synchronisé
export const deletePendingPointage = async (id) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_POINTAGES], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_POINTAGES);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// Compter les pointages en attente
export const countPendingPointages = async () => {
  const pending = await getPendingPointages();
  return pending.length;
};

// ==================== GESTION DES DONNÉES UTILISATEUR ====================

// Sauvegarder les données utilisateur (pour connexion hors-ligne)
export const saveUserData = async (userData) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.USER_DATA], 'readwrite');
    const store = transaction.objectStore(STORES.USER_DATA);
    
    const data = {
      key: 'current_user',
      ...userData,
      savedAt: new Date().toISOString()
    };
    
    const request = store.put(data);
    
    request.onsuccess = () => {
      console.log('Données utilisateur sauvegardées');
      resolve(true);
    };
    
    request.onerror = () => reject(request.error);
  });
};

// Récupérer les données utilisateur sauvegardées
export const getUserData = async () => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.USER_DATA], 'readonly');
    const store = transaction.objectStore(STORES.USER_DATA);
    const request = store.get('current_user');
    
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    
    request.onerror = () => reject(request.error);
  });
};

// Supprimer les données utilisateur (déconnexion)
export const clearUserData = async () => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.USER_DATA], 'readwrite');
    const store = transaction.objectStore(STORES.USER_DATA);
    const request = store.delete('current_user');
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// ==================== GESTION DU CACHE DES POINTAGES ====================

// Sauvegarder les pointages en cache
export const cachePointages = async (pointages) => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CACHED_POINTAGES], 'readwrite');
    const store = transaction.objectStore(STORES.CACHED_POINTAGES);
    
    // Vider le cache existant
    store.clear();
    
    // Ajouter les nouveaux pointages
    pointages.forEach(pointage => {
      store.put(pointage);
    });
    
    transaction.oncomplete = () => {
      console.log('Pointages mis en cache:', pointages.length);
      resolve(true);
    };
    
    transaction.onerror = () => reject(transaction.error);
  });
};

// Récupérer les pointages en cache
export const getCachedPointages = async () => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CACHED_POINTAGES], 'readonly');
    const store = transaction.objectStore(STORES.CACHED_POINTAGES);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    
    request.onerror = () => reject(request.error);
  });
};

// ==================== UTILITAIRES ====================

// Vérifier si on est en ligne
export const isOnline = () => {
  return navigator.onLine;
};

// Écouter les changements de connexion
export const onConnectionChange = (callback) => {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
  
  // Retourner une fonction pour nettoyer les listeners
  return () => {
    window.removeEventListener('online', () => callback(true));
    window.removeEventListener('offline', () => callback(false));
  };
};

// Nettoyer toute la base de données
export const clearAllData = async () => {
  await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.PENDING_POINTAGES, STORES.USER_DATA, STORES.CACHED_POINTAGES], 
      'readwrite'
    );
    
    transaction.objectStore(STORES.PENDING_POINTAGES).clear();
    transaction.objectStore(STORES.USER_DATA).clear();
    transaction.objectStore(STORES.CACHED_POINTAGES).clear();
    
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
};

// Alias pour compatibilité avec AuthContext
export const saveOfflineUserData = saveUserData;
export const getOfflineUserData = getUserData;
export const clearOfflineUserData = clearUserData;

export default {
  initDB,
  addPendingPointage,
  getPendingPointages,
  markPointageSynced,
  deletePendingPointage,
  countPendingPointages,
  saveUserData,
  getUserData,
  clearUserData,
  saveOfflineUserData,
  getOfflineUserData,
  clearOfflineUserData,
  cachePointages,
  getCachedPointages,
  isOnline,
  onConnectionChange,
  clearAllData
};
