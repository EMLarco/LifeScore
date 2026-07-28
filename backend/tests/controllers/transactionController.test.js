const pool = require('../../src/config/database');

describe('Transaction Controller', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { user: { id: 1 }, body: {}, params: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      download: vi.fn(),
    };
    next = vi.fn();
  });

  describe('getTransactions', () => {
    it('should return all transactions for a user', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({
        rows: [
          { id: 1, type: 'subscription', plan: 'monthly', amount: 9.99, status: 'completed' },
          { id: 2, type: 'points', plan: 'p4', amount: 12.99, status: 'completed', metadata: { points: 1000 } },
        ],
      });

      const { getTransactions } = require('../../src/controllers/transactionController');
      await getTransactions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ type: 'subscription' }),
            expect.objectContaining({ type: 'points' }),
          ]),
        })
      );
    });

    it('should call next on error', async () => {
      vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB error'));

      const { getTransactions } = require('../../src/controllers/transactionController');
      await getTransactions(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('sendInvoice', () => {
    it('should return 404 if transaction not found', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [] });

      req.params = { transactionId: '999' };
      const { sendInvoice } = require('../../src/controllers/transactionController');
      await sendInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  describe('downloadInvoice', () => {
    it('should return 404 if transaction not found', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [] });

      req.params = { transactionId: '999' };
      const { downloadInvoice } = require('../../src/controllers/transactionController');
      await downloadInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });
});
