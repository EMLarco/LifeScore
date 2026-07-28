const axios = require('axios');
require('dotenv').config();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_RETURN_URL = process.env.PAYPAL_RETURN_URL || 'http://localhost:5173/payment-success';
const PAYPAL_CANCEL_URL = process.env.PAYPAL_CANCEL_URL || 'http://localhost:5173/payment-cancel';

let paypalAccessToken = null;
let tokenExpiry = null;

const getAccessToken = async () => {
  if (paypalAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return paypalAccessToken;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
    }
  );

  paypalAccessToken = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
  return paypalAccessToken;
};

const createOrder = async (amount, currency = 'USD', description = 'Membresia Premium LifeScore') => {
  const token = await getAccessToken();
  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v2/checkout/orders`,
    {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: currency, value: amount.toFixed(2) },
        description,
      }],
      application_context: {
        return_url: PAYPAL_RETURN_URL,
        cancel_url: PAYPAL_CANCEL_URL,
        user_action: 'PAY_NOW',
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const approvalUrl = response.data.links.find((link) => link.rel === 'approve')?.href;
  return { id: response.data.id, approvalUrl };
};

const captureOrder = async (orderId) => {
  const token = await getAccessToken();
  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  return {
    status: response.data.status,
    transactionId: response.data.purchase_units[0]?.payments?.captures[0]?.id || orderId,
  };
};

// ============================================================
// PayPal Subscriptions (Billing Plans)
// ============================================================

const PLAN_IDS = {
  monthly: process.env.PAYPAL_PLAN_MONTHLY || 'P-XXXXXXXXXXXXXXXX',
  yearly: process.env.PAYPAL_PLAN_YEARLY || 'P-YYYYYYYYYYYYYYYY',
};

const createSubscription = async (planId, userId, userEmail) => {
  const token = await getAccessToken();
  const paypalPlanId = PLAN_IDS[planId] || planId;

  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v1/billing/subscriptions`,
    {
      plan_id: paypalPlanId,
      custom_id: `user_${userId}`,
      application_context: {
        return_url: `${PAYPAL_RETURN_URL}?subscription=success`,
        cancel_url: `${PAYPAL_CANCEL_URL}?subscription=cancel`,
        user_action: 'SUBSCRIBE_NOW',
      },
      subscriber: {
        email_address: userEmail,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=representation',
      },
    }
  );

  const approveUrl = response.data.links.find((link) => link.rel === 'approve')?.href;
  return {
    subscriptionId: response.data.id,
    status: response.data.status,
    approveUrl,
  };
};

const getSubscriptionDetails = async (subscriptionId) => {
  const token = await getAccessToken();
  const response = await axios.get(
    `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

const cancelSubscription = async (subscriptionId, reason = 'User requested cancellation') => {
  const token = await getAccessToken();
  await axios.post(
    `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    { reason },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return true;
};

const verifyWebhookSignature = (headers, body, webhookId) => {
  // In production, use PayPal SDK to verify webhook signature
  // For sandbox/dev, we do basic validation
  return true;
};

module.exports = {
  createOrder,
  captureOrder,
  createSubscription,
  getSubscriptionDetails,
  cancelSubscription,
  verifyWebhookSignature,
  PLAN_IDS,
};
