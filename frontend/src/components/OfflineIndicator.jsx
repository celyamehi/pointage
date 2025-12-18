import React from 'react';
import { useOffline } from '../contexts/OfflineContext';
import { toast } from 'react-toastify';

const OfflineIndicator = () => {
  const { isOnline, pendingCount, isSyncing, forceSync, lastSyncResult } = useOffline();

  // Fonction pour synchroniser avec feedback
  const handleSync = async () => {
    console.log('🔄 Bouton Sync cliqué, lancement de la synchronisation...');
    try {
      const result = await forceSync();
      console.log('📊 Résultat sync:', result);
      
      if (result.success) {
        if (result.synced > 0) {
          toast.success(`✅ ${result.synced} pointage(s) synchronisé(s) avec succès !`);
        } else if (result.pending > 0) {
          toast.warning(`⚠️ ${result.pending} pointage(s) en attente. Réessayez plus tard.`);
        }
      } else {
        toast.error(`❌ Erreur: ${result.message}`);
      }
    } catch (error) {
      console.error('Erreur sync:', error);
      toast.error('Erreur lors de la synchronisation');
    }
  };

  // Ne rien afficher si en ligne et pas de pointages en attente
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 rounded-lg shadow-lg p-3 ${
      isOnline ? 'bg-green-500' : 'bg-orange-500'
    } text-white`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Icône de statut */}
          {isSyncing ? (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : isOnline ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
          )}
          
          <div>
            <p className="text-sm font-medium">
              {isSyncing ? 'Synchronisation...' : isOnline ? 'En ligne' : 'Hors ligne'}
            </p>
            {pendingCount > 0 && (
              <p className="text-xs opacity-90">
                {pendingCount} pointage{pendingCount > 1 ? 's' : ''} en attente
              </p>
            )}
          </div>
        </div>

        {/* Bouton de synchronisation manuelle */}
        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            onClick={handleSync}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
          >
            Sync
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
