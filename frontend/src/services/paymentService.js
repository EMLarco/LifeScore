import api from '../api/axiosConfig';

export const createOrder = async (plan = 'monthly') => {
  const response = await api.post('/payment/create-order', { plan });
  return response.data.data;
};

export const capturePayment = async (orderId) => {
  const response = await api.get(`/payment/success?token=${orderId}`);
  return response.data;
};

export const getSubscriptionStatus = async () => {
  const response = await api.get('/payment/subscription/status');
  return response.data.data;
};

export const getPaymentHistory = async () => {
  const response = await api.get('/payment/history');
  return response.data.data;
};

export const getPremiumChallenges = async () => {
  const response = await api.get('/premium-challenges');
  return response.data.data;
};

export const completePremiumChallenge = async (challengeId) => {
  const response = await api.post(`/premium-challenges/${challengeId}/complete`);
  return response.data;
};

export const generateInvoice = async (paymentId, subscriptionId) => {
  const response = await api.post('/invoices/generate', { paymentId, subscriptionId });
  return response.data.data;
};

export const getInvoices = async () => {
  const response = await api.get('/invoices');
  return response.data.data;
};

export const downloadInvoice = async (invoiceNumber) => {
  const response = await api.get(`/invoices/${invoiceNumber}/download`, { responseType: 'blob' });
  return response.data;
};
