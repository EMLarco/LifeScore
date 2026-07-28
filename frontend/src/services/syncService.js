import { openDB } from 'idb';
import api from '../api/axiosConfig';

const dbPromise = openDB('LifeScoreOffline', 1, {
  upgrade(db) {
    db.createObjectStore('pendingHabits', { keyPath: 'id', autoIncrement: true });
  },
});

export const saveHabitOffline = async (habit) => {
  const db = await dbPromise;
  await db.add('pendingHabits', habit);
};

export const syncPendingHabits = async () => {
  try {
    const db = await dbPromise;
    const pending = await db.getAll('pendingHabits');
    if (pending.length === 0) return;

    for (const item of pending) {
      try {
        await api.post('/habits', item);
        await db.delete('pendingHabits', item.id);
        console.log('Habito sincronizado:', item.title);
      } catch (e) {
        console.error('Error sincronizando habito:', e);
      }
    }
  } catch (error) {
    console.error('Error en syncPendingHabits:', error);
  }
};

// También podemos sincronizar al iniciar la app si hay conexión
export const syncOnStartup = async () => {
  if (navigator.onLine) {
    await syncPendingHabits();
  }
};