import { useState } from 'react';

export const useLocalStorage = (key, initialValue) => {
  const [stored, setStored] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(stored) : value;
      setStored(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error en useLocalStorage:', error);
    }
  };

  return [stored, setValue];
};