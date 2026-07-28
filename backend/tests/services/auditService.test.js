const pool = require('../../src/config/database');

describe('Audit Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auditLog', () => {
    it('should insert audit log into database', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [] });

      const { auditLog } = require('../../src/services/auditService');
      await auditLog(1, 'USER_LOGIN', 'user', 1, { email: 'test@test.com' });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        [1, 'USER_LOGIN', 'user', 1, '{"email":"test@test.com"}', null, null]
      );
    });

    it('should include ip and userAgent from req', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [] });

      const mockReq = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'TestAgent/1.0' },
      };

      const { auditLog } = require('../../src/services/auditService');
      await auditLog(1, 'PAYMENT_CREATE', 'subscription', null, { plan: 'monthly' }, mockReq);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        [1, 'PAYMENT_CREATE', 'subscription', null, '{"plan":"monthly"}', '127.0.0.1', 'TestAgent/1.0']
      );
    });

    it('should not throw on database error', async () => {
      vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { auditLog } = require('../../src/services/auditService');
      await expect(auditLog(1, 'TEST', 'user')).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
