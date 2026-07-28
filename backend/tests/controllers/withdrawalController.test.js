const pool = require('../../src/config/database');

describe('Withdrawal Controller', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { user: { id: 1 }, body: {}, params: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe('getWithdrawals', () => {
    it('should return all withdrawals for a user', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({
        rows: [
          { id: 1, user_id: 1, points: 5000, amount_usd: 6.75, status: 'pending' },
          { id: 2, user_id: 1, points: 10000, amount_usd: 13.50, status: 'approved' },
        ],
      });

      const { getWithdrawals } = require('../../src/controllers/withdrawalController');
      await getWithdrawals(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ points: 5000 }),
            expect.objectContaining({ points: 10000 }),
          ]),
        })
      );
    });

    it('should call next on error', async () => {
      vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB error'));
      const { getWithdrawals } = require('../../src/controllers/withdrawalController');
      await getWithdrawals(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requestWithdrawal', () => {
    it('should reject if points below minimum', async () => {
      req.body = { points: 1000 };
      const { requestWithdrawal } = require('../../src/controllers/withdrawalController');
      await requestWithdrawal(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('should reject if points above maximum', async () => {
      req.body = { points: 200000 };
      const { requestWithdrawal } = require('../../src/controllers/withdrawalController');
      await requestWithdrawal(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject if points not multiple of 1000', async () => {
      req.body = { points: 5500 };
      const { requestWithdrawal } = require('../../src/controllers/withdrawalController');
      await requestWithdrawal(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining('multiplos') })
      );
    });

    it('should reject if insufficient user points', async () => {
      req.body = { points: 10000 };
      vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [{ points: 5000 }] });
      const { requestWithdrawal } = require('../../src/controllers/withdrawalController');
      await requestWithdrawal(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should create withdrawal with correct net amount', async () => {
      req.body = { points: 10000 };
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ points: 50000 }] })
        .mockResolvedValueOnce({ rows: [] });

      const { requestWithdrawal } = require('../../src/controllers/withdrawalController');
      await requestWithdrawal(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            points: 10000,
            gross_amount: 15.00,
            fee: 1.50,
            net_amount: 13.50,
          }),
        })
      );
    });
  });

  describe('getAllWithdrawals (admin)', () => {
    it('should return all withdrawals with user info', async () => {
      req.query = {};
      vi.spyOn(pool, 'query').mockResolvedValueOnce({
        rows: [
          { id: 1, user_id: 1, points: 5000, amount_usd: 6.75, status: 'pending', name: 'Test', email: 'test@test.com', username: 'test' },
        ],
      });

      const { getAllWithdrawals } = require('../../src/controllers/withdrawalController');
      await getAllWithdrawals(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });
  });

  describe('approveWithdrawal', () => {
    it('should return 404 if not found', async () => {
      req.params = { withdrawalId: '999' };
      vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [] });
      const { approveWithdrawal } = require('../../src/controllers/withdrawalController');
      await approveWithdrawal(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should reject if user has insufficient points', async () => {
      req.params = { withdrawalId: '1' };
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1, points: 10000, status: 'pending' }] })
        .mockResolvedValueOnce({ rows: [{ points: 2000 }] });
      const { approveWithdrawal } = require('../../src/controllers/withdrawalController');
      await approveWithdrawal(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should approve and deduct points', async () => {
      req.params = { withdrawalId: '1' };
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1, points: 10000, status: 'pending' }] })
        .mockResolvedValueOnce({ rows: [{ points: 50000 }] })
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // UPDATE users
        .mockResolvedValueOnce({}) // UPDATE withdrawals
        .mockResolvedValueOnce({}); // COMMIT

      const { approveWithdrawal } = require('../../src/controllers/withdrawalController');
      await approveWithdrawal(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('rejectWithdrawal', () => {
    it('should reject a pending withdrawal', async () => {
      req.params = { withdrawalId: '1' };
      req.body = { reason: 'Not eligible' };
      vi.spyOn(pool, 'query').mockResolvedValueOnce({});
      const { rejectWithdrawal } = require('../../src/controllers/withdrawalController');
      await rejectWithdrawal(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('markAsPaid', () => {
    it('should mark approved withdrawal as paid', async () => {
      req.params = { withdrawalId: '1' };
      req.body = { transactionId: 'TX123' };
      vi.spyOn(pool, 'query').mockResolvedValueOnce({});
      const { markAsPaid } = require('../../src/controllers/withdrawalController');
      await markAsPaid(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
