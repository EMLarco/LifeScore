const webpush = require('web-push');
const { publicKey, privateKey } = require('../config/push');
const PushSubscription = require('../models/PushSubscription');

webpush.setVapidDetails(
  'mailto:support@lifescore.com',
  publicKey,
  privateKey
);

const sendNotification = async (subscription, title, body, icon = '/icon-192x192.png') => {
  try {
    const payload = JSON.stringify({
      title,
      body,
      icon,
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: { url: '/' },
    });

    await webpush.sendNotification(subscription, payload);
    console.log(`✅ Notificación push enviada a ${subscription.endpoint}`);
  } catch (error) {
    console.error('❌ Error enviando notificación push:', error.message);
    if (error.statusCode === 410) {
      // La suscripción expiró, la eliminamos
      await PushSubscription.deleteByEndpoint(subscription.endpoint);
      console.log(`🗑️ Suscripción eliminada: ${subscription.endpoint}`);
    }
  }
};

const sendToUser = async (userId, title, body) => {
  const subscriptions = await PushSubscription.getByUserId(userId);
  if (subscriptions.length === 0) {
    console.log(`ℹ️ Usuario ${userId} no tiene suscripciones push`);
    return;
  }
  const promises = subscriptions.map(sub =>
    sendNotification(sub, title, body)
  );
  await Promise.allSettled(promises);
};

module.exports = {
  sendNotification,
  sendToUser,
};