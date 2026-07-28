const pool = require('../../src/config/database');
const axios = require('axios');

describe('Payment Controller', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { user: { id: 1 }, body: {}, query: {}, params: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      redirect: vi.fn(),
    };
    next = vi.fn();
  });

  describe('createOrder', () => {
    it('should create a PayPal order for monthly plan', async () => {
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      vi.spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { access_token: 'tok_123' } })
        .mockResolvedValueOnce({
          data: {
            id: 'ORDER-123',
            links: [{ rel: 'approve', href: 'https://paypal.com/approve' }],
          },
        });

      req.body = { plan: 'monthly' };
      const { createOrder } = require('../../src/controllers/paymentController');
      await createOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ orderId: 'ORDER-123' }),
        })
      );
    });

    it('should default to monthly plan', async () => {
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      vi.spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { access_token: 'tok_123' } })
        .mockResolvedValueOnce({
          data: {
            id: 'ORDER-456',
            links: [{ rel: 'approve', href: 'https://paypal.com/approve' }],
          },
        });

      req.body = {};
      const { createOrder } = require('../../src/controllers/paymentController');
      await createOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const insertCall = pool.query.mock.calls[0];
      expect(insertCall[1]).toContain('monthly');
    });

    it('should use yearly amount for yearly plan', async () => {
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      vi.spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { access_token: 'tok_123' } })
        .mockResolvedValueOnce({
          data: {
            id: 'ORDER-789',
            links: [{ rel: 'approve', href: 'https://paypal.com/approve' }],
          },
        });

      req.body = { plan: 'yearly' };
      const { createOrder } = require('../../src/controllers/paymentController');
      await createOrder(req, res, next);

      const insertCall = pool.query.mock.calls[0];
      expect(insertCall[1]).toContain('yearly');
    });

    it('should call next on PayPal API error', async () => {
      vi.spyOn(axios, 'post').mockRejectedValue({
        response: { data: { message: 'INVALID_REQUEST' } },
      });

      req.body = { plan: 'monthly' };
      const { createOrder } = require('../../src/controllers/paymentController');
      await createOrder(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('captureOrder', () => {
    it('should redirect to success when order is already COMPLETED', async () => {
      vi.spyOn(axios, 'get')
        .mockResolvedValueOnce({ data: { status: 'COMPLETED' } });
      vi.spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { access_token: 'tok_123' } });
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // find pending sub
        .mockResolvedValueOnce({ rows: [] }) // UPDATE users is_premium
        .mockResolvedValueOnce({ rows: [] }) // UPDATE subscriptions status
        .mockResolvedValueOnce({ rows: [] }) // SELECT from transactions
        .mockResolvedValueOnce({ rows: [{ plan_id: 'monthly', amount: 9.99 }] }) // SELECT plan info
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // createTransaction
        .mockResolvedValueOnce({ rows: [] }); // auditLog INSERT

      req.query = { token: 'ORDER-DONE' };
      const { captureOrder } = require('../../src/controllers/paymentController');
      await captureOrder(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('payment-success?success=true'));
    });

    it('should capture and redirect when order is APPROVED', async () => {
      vi.spyOn(axios, 'get')
        .mockResolvedValueOnce({ data: { status: 'APPROVED' } });
      vi.spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { access_token: 'tok_123' } })
        .mockResolvedValueOnce({ data: { status: 'COMPLETED' } });
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // find pending sub
        .mockResolvedValueOnce({ rows: [] }) // UPDATE users is_premium
        .mockResolvedValueOnce({ rows: [] }) // UPDATE subscriptions status
        .mockResolvedValueOnce({ rows: [] }) // SELECT from transactions
        .mockResolvedValueOnce({ rows: [{ plan_id: 'monthly', amount: 9.99 }] }) // SELECT plan info
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // createTransaction
        .mockResolvedValueOnce({ rows: [] }); // auditLog INSERT

      req.query = { token: 'ORDER-APPROVED' };
      const { captureOrder } = require('../../src/controllers/paymentController');
      await captureOrder(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('payment-success?success=true'));
    });

    it('should handle ORDER_ALREADY_CAPTURED error gracefully', async () => {
      vi.spyOn(axios, 'get')
        .mockResolvedValueOnce({ data: { status: 'APPROVED' } });
      vi.spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { access_token: 'tok_123' } })
        .mockRejectedValueOnce({ response: { data: { name: 'ORDER_ALREADY_CAPTURED' } } });
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ user_id: 1 }] })
        .mockResolvedValueOnce({ rows: [{ user_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ plan_id: 'monthly', amount: 9.99 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      req.query = { token: 'ORDER-DUP' };
      const { captureOrder } = require('../../src/controllers/paymentController');
      await captureOrder(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('payment-success?success=true'));
    });

    it('should redirect to cancel on generic capture failure', async () => {
      vi.spyOn(axios, 'get')
        .mockResolvedValueOnce({ data: { status: 'APPROVED' } });
      vi.spyOn(axios, 'post')
        .mockResolvedValueOnce({ data: { access_token: 'tok_123' } })
        .mockRejectedValueOnce({ response: { data: { message: 'SERVER_ERROR' } } });
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ user_id: 1 }] });

      req.query = { token: 'ORDER-FAIL' };
      const { captureOrder } = require('../../src/controllers/paymentController');
      await captureOrder(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('premium?success=false'));
    });

    it('should redirect for unexpected order status', async () => {
      vi.spyOn(axios, 'get')
        .mockResolvedValueOnce({ data: { status: 'PAYER_ACTION_REQUIRED' } });
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ user_id: 1 }] });

      req.query = { token: 'ORDER-PEND' };
      const { captureOrder } = require('../../src/controllers/paymentController');
      await captureOrder(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('premium?success=false'));
    });

    it('should redirect when no token provided', async () => {
      req.query = {};
      const { captureOrder } = require('../../src/controllers/paymentController');
      await captureOrder(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('premium?success=false'));
    });

    it('should redirect when no pending subscription found', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [] });

      req.query = { token: 'ORDER-UNKNOWN' };
      const { captureOrder } = require('../../src/controllers/paymentController');
      await captureOrder(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('premium?success=false'));
    });
  });

  describe('cancelOrder', () => {
    it('should redirect to frontend cancel page', async () => {
      const { cancelOrder } = require('../../src/controllers/paymentController');
      cancelOrder(req, res);

      expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('premium?canceled=true'));
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return subscription data', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({
        rows: [{ id: 1, status: 'active', plan_id: 'monthly', amount: 9.99 }],
      });

      const { getSubscriptionStatus } = require('../../src/controllers/paymentController');
      await getSubscriptionStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ status: 'active' }),
        })
      );
    });

    it('should return null when no subscription', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [] });

      const { getSubscriptionStatus } = require('../../src/controllers/paymentController');
      await getSubscriptionStatus(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: null })
      );
    });
  });

  describe('handleWebhook', () => {
    it('should handle PAYMENT.CAPTURE.COMPLETED', async () => {
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ user_id: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      req.body = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          supplementary_data: { related_ids: { order_id: 'ORDER-123' } },
        },
      };

      const { handleWebhook } = require('../../src/controllers/paymentController');
      await handleWebhook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle unknown events gracefully', async () => {
      req.body = { event_type: 'UNKNOWN.EVENT', resource: {} };

      const { handleWebhook } = require('../../src/controllers/paymentController');
      await handleWebhook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPaymentHistory', () => {
    it('should return payment history', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({
        rows: [{ id: 1, amount: 9.99, status: 'completed' }],
      });

      const { getPaymentHistory } = require('../../src/controllers/paymentController');
      await getPaymentHistory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([expect.objectContaining({ amount: 9.99 })]),
        })
      );
    });
  });

  describe('getPointsPackages', () => {
    it('should return point packages', async () => {
      const { getPointsPackages } = require('../../src/controllers/paymentController');
      await getPointsPackages(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ id: 'p1', points: 100, price: 1.99 }),
          ]),
        })
      );
    });
  });
});
