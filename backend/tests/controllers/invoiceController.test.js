const pool = require('../../src/config/database');
const fs = require('fs');

describe('Invoice Controller', () => {
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

  describe('getUserInvoices', () => {
    it('should return all invoices for a user', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({
        rows: [
          { id: 1, invoice_number: 'LS-202601-1234', amount: 9.99, currency: 'USD', description: 'Premium', status: 'paid' },
        ],
      });

      const { getUserInvoices } = require('../../src/controllers/invoiceController');
      await getUserInvoices(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ invoice_number: 'LS-202601-1234' }),
          ]),
        })
      );
    });

    it('should call next on error', async () => {
      vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB error'));

      const { getUserInvoices } = require('../../src/controllers/invoiceController');
      await getUserInvoices(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('generateInvoice', () => {
    it('should reject if no paymentId or subscriptionId provided', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [{ name: 'Test User', email: 'test@test.com' }] });

      req.body = {};
      const { generateInvoice } = require('../../src/controllers/invoiceController');
      await generateInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('should reject if user not found', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [] });

      req.body = { paymentId: 1 };
      const { generateInvoice } = require('../../src/controllers/invoiceController');
      await generateInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should reject if payment not found', async () => {
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ name: 'Test User', email: 'test@test.com' }] })
        .mockResolvedValueOnce({ rows: [] });

      req.body = { paymentId: 999 };
      const { generateInvoice } = require('../../src/controllers/invoiceController');
      await generateInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('downloadInvoice', () => {
    it('should reject if invoice not found', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [] });

      req.params.invoiceNumber = 'LS-202601-9999';
      const { downloadInvoice } = require('../../src/controllers/invoiceController');
      await downloadInvoice(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
