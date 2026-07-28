import { openDB } from 'idb';

// Instancia única de la base de datos
let dbInstance = null;

export const initDB = async () => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB('LifeScoreDB', 1, {
    upgrade(db) {
      // Store para hábitos offline (sincronización)
      if (!db.objectStoreNames.contains('pendingHabits')) {
        db.createObjectStore('pendingHabits', { keyPath: 'id', autoIncrement: true });
      }
      // Store para caché de hábitos (lectura offline)
      if (!db.objectStoreNames.contains('habitsCache')) {
        db.createObjectStore('habitsCache', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
};

/**
 * Guarda un hábito en la cola de pendientes (para sincronizar después)
 */
export const savePendingHabit = async (habit) => {
  const db = await initDB();
  const tx = db.transaction('pendingHabits', 'readwrite');
  const result = await tx.store.add(habit);
  await tx.done;
  return result;
};

/**
 * Obtiene todos los hábitos pendientes
 */
export const getPendingHabits = async () => {
  const db = await initDB();
  const tx = db.transaction('pendingHabits', 'readonly');
  const all = await tx.store.getAll();
  await tx.done;
  return all;
};

/**
 * Elimina un hábito pendiente por su ID
 */
export const deletePendingHabit = async (id) => {
  const db = await initDB();
  const tx = db.transaction('pendingHabits', 'readwrite');
  await tx.store.delete(id);
  await tx.done;
};

/**
 * Guarda los hábitos en caché (para lectura offline)
 */
export const cacheHabits = async (habits) => {
  const db = await initDB();
  const tx = db.transaction('habitsCache', 'readwrite');
  const store = tx.store;
  // Limpiar caché anterior
  await store.clear();
  for (const habit of habits) {
    await store.put(habit);
  }
  await tx.done;
};

/**
 * Obtiene los hábitos desde la caché
 */
export const getCachedHabits = async () => {
  const db = await initDB();
  const tx = db.transaction('habitsCache', 'readonly');
  const all = await tx.store.getAll();
  await tx.done;
  return all;
};