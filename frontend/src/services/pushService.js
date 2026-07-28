import api from '../api/axiosConfig';
import { PUSH } from '../api/endpoints';

export const registerPush = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push no soportado en este navegador');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
    });

    await api.post(PUSH.SUBSCRIBE, {
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
    });

    console.log('Suscripcion push guardada');
  } catch (error) {
    console.error('Error en suscripcion push:', error);
  }
};