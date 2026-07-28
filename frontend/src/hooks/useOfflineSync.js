import { useEffect } from 'react';
import { syncPendingHabits } from '../services/syncService';

export const useOfflineSync = () => {
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexión recuperada, sincronizando...');
      syncPendingHabits();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
};