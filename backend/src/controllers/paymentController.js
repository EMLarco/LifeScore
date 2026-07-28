const pool = require('../config/database');
const axios = require('axios');
const { createTransaction } = require('./transactionController');
const { auditLog } = require('../services/auditService');

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const getAccessToken = async () => {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await axios.post(
    `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return response.data.access_token;
};

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { plan = 'monthly' } = req.body;

    const amount = plan === 'yearly' ? 89.99 : 9.99;
    const description = plan === 'yearly' ? 'Suscripcion anual LifeScore Premium' : 'Suscripcion mensual LifeScore Premium';

    console.log(`Creando orden PayPal para usuario ${userId} - Plan: ${plan} - Monto: $${amount}`);

    const accessToken = await getAccessToken();

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          description,
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: `${BACKEND_URL}/api/payment/success`,
        cancel_url: `${FRONTEND_URL}/premium?canceled=true`,
        user_action: 'PAY_NOW',
      },
    };

    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v2/checkout/orders`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Orden creada:', response.data.id);

    await pool.query(
      `INSERT INTO subscriptions (user_id, paypal_subscription_id, status, plan_id, plan_name, amount, currency)
       VALUES ($1, $2, 'pending', $3, $4, $5, 'USD')`,
      [userId, response.data.id, plan, description, amount]
    );

    await auditLog(userId, 'PAYMENT_CREATE', 'subscription', null, { plan, amount, orderId: response.data.id }, req);

    const approvalUrl = response.data.links.find((link) => link.rel === 'approve')?.href;

    res.status(201).json({
      success: true,
      data: {
        orderId: response.data.id,
        approvalUrl,
      },
    });
  } catch (error) {
    console.error('Error creando orden PayPal:', error.response?.data || error.message);
    next(new Error(error.response?.data?.message || 'Error al crear la orden de pago'));
  }
};

const activatePremium = async (userId, orderId) => {
  await pool.query('UPDATE users SET is_premium = true WHERE id = $1', [userId]);
  await pool.query(
    `UPDATE subscriptions SET status = 'active', end_date = NOW() + INTERVAL '1 month', updated_at = NOW()
     WHERE paypal_subscription_id = $1 AND user_id = $2`,
    [orderId, userId]
  );

  const existing = await pool.query(
    'SELECT id FROM transactions WHERE paypal_order_id = $1',
    [orderId]
  );
  if (existing.rows.length === 0) {
    const sub = await pool.query(
      'SELECT plan_id, amount FROM subscriptions WHERE paypal_subscription_id = $1',
      [orderId]
    );
    const plan = sub.rows[0]?.plan_id || 'monthly';
    const amount = sub.rows[0]?.amount || 9.99;
    await createTransaction(userId, orderId, 'subscription', plan, amount);
  }

  console.log(`Premium activado para usuario ${userId}`);
  const subInfo = await pool.query('SELECT plan_id, amount FROM subscriptions WHERE paypal_subscription_id = $1', [orderId]);
  await auditLog(userId, 'PAYMENT_COMPLETE', 'subscription', null, { orderId, plan: subInfo.rows[0]?.plan_id, amount: subInfo.rows[0]?.amount }, null);
};

const captureOrder = async (req, res) => {
  try {
    const orderId = req.query.token;

    if (!orderId) {
      return res.redirect(`${FRONTEND_URL}/premium?success=false`);
    }

    console.log(`Capturando orden: ${orderId}`);

    const subResult = await pool.query(
      'SELECT user_id FROM subscriptions WHERE paypal_subscription_id = $1 AND status = $2',
      [orderId, 'pending']
    );

    if (subResult.rows.length === 0) {
      return res.redirect(`${FRONTEND_URL}/premium?success=false`);
    }

    const userId = subResult.rows[0].user_id;
    const accessToken = await getAccessToken();

    const orderResponse = await axios.get(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const orderStatus = orderResponse.data.status;
    console.log(`Estado de la orden: ${orderStatus}`);

    if (orderStatus === 'COMPLETED') {
      console.log('La orden ya esta completada. Activando premium...');
      await activatePremium(userId, orderId);
      return res.redirect(`${FRONTEND_URL}/payment-success?success=true`);
    }

    if (orderStatus === 'APPROVED') {
      console.log('Capturando orden aprobada...');
      const captureResponse = await axios.post(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (captureResponse.data.status === 'COMPLETED') {
        console.log('Pago capturado exitosamente');
        await activatePremium(userId, orderId);
        return res.redirect(`${FRONTEND_URL}/payment-success?success=true`);
      } else {
        console.error('Captura fallida:', captureResponse.data.status);
        return res.redirect(`${FRONTEND_URL}/premium?success=false`);
      }
    }

    console.error(`Estado inesperado: ${orderStatus}`);
    return res.redirect(`${FRONTEND_URL}/premium?success=false`);
  } catch (error) {
    console.error('Error capturando pago:', error.response?.data || error.message);

    if (error.response?.data?.name === 'ORDER_ALREADY_CAPTURED') {
      const orderId = req.query.token;
      const subResult = await pool.query(
        'SELECT user_id FROM subscriptions WHERE paypal_subscription_id = $1',
        [orderId]
      );
      if (subResult.rows.length > 0) {
        await activatePremium(subResult.rows[0].user_id, orderId);
      }
      return res.redirect(`${FRONTEND_URL}/payment-success?success=true`);
    }

    res.redirect(`${FRONTEND_URL}/premium?success=false`);
  }
};

const cancelOrder = async (req, res) => {
  res.redirect(`${FRONTEND_URL}/premium?canceled=true`);
};

const handleWebhook = async (req, res) => {
  try {
    const { event_type, resource } = req.body;
    console.log('Webhook recibido:', event_type);

    if (event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = resource.supplementary_data?.related_ids?.order_id;
      if (orderId) {
        const sub = await pool.query(
          'SELECT user_id FROM subscriptions WHERE paypal_subscription_id = $1',
          [orderId]
        );
        if (sub.rows.length > 0) {
          await pool.query('UPDATE users SET is_premium = true WHERE id = $1', [sub.rows[0].user_id]);
          await pool.query(
            "UPDATE subscriptions SET status = 'active', end_date = NOW() + INTERVAL '1 month', updated_at = NOW() WHERE paypal_subscription_id = $1",
            [orderId]
          );
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ success: true });
  }
};

const getSubscriptionStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

const POINT_PACKAGES = [
  { id: 'p1', points: 100, price: 1.99, label: '100 Puntos' },
  { id: 'p2', points: 300, price: 4.99, label: '300 Puntos' },
  { id: 'p3', points: 600, price: 8.99, label: '600 Puntos' },
  { id: 'p4', points: 1000, price: 12.99, label: '1000 Puntos' },
  { id: 'p5', points: 2000, price: 19.99, label: '2000 Puntos' },
  { id: 'p6', points: 5000, price: 39.99, label: '5000 Puntos' },
  { id: 'p7', points: 10000, price: 69.99, label: '10000 Puntos' },
  { id: 'p8', points: 25000, price: 129.99, label: '25000 Puntos' },
];

const buyPoints = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { packageId } = req.body;

    const pkg = POINT_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return res.status(400).json({ success: false, message: 'Paquete no valido' });
    }

    const accessToken = await getAccessToken();

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: `${pkg.points} puntos LifeScore`,
          amount: {
            currency_code: 'USD',
            value: pkg.price.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: `${BACKEND_URL}/api/payment/points-success`,
        cancel_url: `${FRONTEND_URL}/points-store?canceled=true`,
        user_action: 'PAY_NOW',
      },
    };

    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v2/checkout/orders`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    await pool.query(
      `INSERT INTO pending_orders (user_id, order_id, type, package_id, points, amount)
       VALUES ($1, $2, 'points', $3, $4, $5)`,
      [userId, response.data.id, pkg.id, pkg.points, pkg.price]
    );

    await auditLog(userId, 'POINTS_PURCHASE_CREATE', 'points', null, { packageId: pkg.id, points: pkg.points, amount: pkg.price }, req);

    const approvalUrl = response.data.links.find((link) => link.rel === 'approve')?.href;

    res.status(201).json({
      success: true,
      data: {
        orderId: response.data.id,
        approvalUrl,
      },
    });
  } catch (error) {
    console.error('Error creando orden de puntos:', error.response?.data || error.message);
    next(new Error(error.response?.data?.message || 'Error al crear la orden de puntos'));
  }
};

const capturePointsOrder = async (req, res) => {
  try {
    const orderId = req.query.token;

    if (!orderId) {
      return res.redirect(`${FRONTEND_URL}/points-store?success=false`);
    }

    console.log(`Capturando orden de puntos: ${orderId}`);

    const pendingResult = await pool.query(
      'SELECT * FROM pending_orders WHERE order_id = $1 AND status = $2',
      [orderId, 'pending']
    );

    if (pendingResult.rows.length === 0) {
      return res.redirect(`${FRONTEND_URL}/points-store?success=false`);
    }

    const order = pendingResult.rows[0];
    const userId = order.user_id;
    const accessToken = await getAccessToken();

    const orderResponse = await axios.get(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const orderStatus = orderResponse.data.status;
    console.log(`Estado de la orden de puntos: ${orderStatus}`);

    if (orderStatus === 'COMPLETED') {
      await pool.query('UPDATE users SET points = points + $1 WHERE id = $2', [order.points, userId]);
      await pool.query("UPDATE pending_orders SET status = 'completed' WHERE order_id = $1", [orderId]);
      await createTransaction(userId, orderId, 'points', order.package_id || 'points', order.amount, { points: order.points });
      await auditLog(userId, 'POINTS_PURCHASE_COMPLETE', 'points', null, { orderId, points: order.points, amount: order.amount }, null);
      console.log(`Puntos agregados: ${order.points} al usuario ${userId}`);
      return res.redirect(`${FRONTEND_URL}/points-success?success=true&points=${order.points}`);
    }

    if (orderStatus === 'APPROVED') {
      const captureResponse = await axios.post(
        `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (captureResponse.data.status === 'COMPLETED') {
        await pool.query('UPDATE users SET points = points + $1 WHERE id = $2', [order.points, userId]);
        await pool.query("UPDATE pending_orders SET status = 'completed' WHERE order_id = $1", [orderId]);
        await createTransaction(userId, orderId, 'points', order.package_id || 'points', order.amount, { points: order.points });
        await auditLog(userId, 'POINTS_PURCHASE_COMPLETE', 'points', null, { orderId, points: order.points, amount: order.amount }, null);
        console.log(`Puntos agregados: ${order.points} al usuario ${userId}`);
        return res.redirect(`${FRONTEND_URL}/points-success?success=true&points=${order.points}`);
      }
    }

    return res.redirect(`${FRONTEND_URL}/points-store?success=false`);
  } catch (error) {
    console.error('Error capturando pago de puntos:', error.response?.data || error.message);

    if (error.response?.data?.name === 'ORDER_ALREADY_CAPTURED') {
      const orderId = req.query.token;
      const pendingResult = await pool.query(
        'SELECT * FROM pending_orders WHERE order_id = $1 AND status = $2',
        [orderId, 'pending']
      );
      if (pendingResult.rows.length > 0) {
        const order = pendingResult.rows[0];
        await pool.query('UPDATE users SET points = points + $1 WHERE id = $2', [order.points, order.user_id]);
        await pool.query("UPDATE pending_orders SET status = 'completed' WHERE order_id = $1", [orderId]);
        const existing = await pool.query('SELECT id FROM transactions WHERE paypal_order_id = $1', [orderId]);
        if (existing.rows.length === 0) {
          await createTransaction(order.user_id, orderId, 'points', order.package_id || 'points', order.amount, { points: order.points });
        }
        return res.redirect(`${FRONTEND_URL}/points-success?success=true&points=${order.points}`);
      }
      return res.redirect(`${FRONTEND_URL}/points-success?success=true`);
    }

    res.redirect(`${FRONTEND_URL}/points-store?success=false`);
  }
};

const getPointsPackages = async (req, res) => {
  res.status(200).json({ success: true, data: POINT_PACKAGES });
};

module.exports = {
  createOrder,
  captureOrder,
  cancelOrder,
  handleWebhook,
  getSubscriptionStatus,
  getPaymentHistory,
  buyPoints,
  capturePointsOrder,
  getPointsPackages,
};
