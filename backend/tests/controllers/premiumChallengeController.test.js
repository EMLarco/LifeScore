const pool = require('../../src/config/database');

describe('PremiumChallenge Controller', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { user: { id: 1 }, params: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe('getPremiumChallenges', () => {
    it('should return all active premium challenges with completion status', async () => {
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [
          { id: 1, title: 'Reto 1', challenge_type: 'daily', xp_reward: 50, required_level: 5, is_active: true },
          { id: 2, title: 'Reto 2', challenge_type: 'weekly', xp_reward: 100, required_level: 10, is_active: true },
        ]})
        .mockResolvedValueOnce({ rows: [{ challenge_id: 1 }] });

      const { getPremiumChallenges } = require('../../src/controllers/premiumChallengeController');
      await getPremiumChallenges(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ id: 1, is_completed: true }),
            expect.objectContaining({ id: 2, is_completed: false }),
          ]),
        })
      );
    });

    it('should call next on error', async () => {
      vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB error'));

      const { getPremiumChallenges } = require('../../src/controllers/premiumChallengeController');
      await getPremiumChallenges(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('completePremiumChallenge', () => {
    it('should complete a challenge and award XP', async () => {
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ id: 1, xp_reward: 100, badge_key: 'test_badge', required_level: 1 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ level: 5 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      req.params.challengeId = '1';
      const { completePremiumChallenge } = require('../../src/controllers/premiumChallengeController');
      await completePremiumChallenge(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ xp: 100, badge: 'test_badge' }),
        })
      );
    });

    it('should reject if challenge not found', async () => {
      vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [] });

      req.params.challengeId = '999';
      const { completePremiumChallenge } = require('../../src/controllers/premiumChallengeController');
      await completePremiumChallenge(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('should reject if already completed', async () => {
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ id: 1, xp_reward: 50, badge_key: null, required_level: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });

      req.params.challengeId = '1';
      const { completePremiumChallenge } = require('../../src/controllers/premiumChallengeController');
      await completePremiumChallenge(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject if level too low', async () => {
      vi.spyOn(pool, 'query')
        .mockResolvedValueOnce({ rows: [{ id: 1, xp_reward: 50, badge_key: null, required_level: 20 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ level: 5 }] });

      req.params.challengeId = '1';
      const { completePremiumChallenge } = require('../../src/controllers/premiumChallengeController');
      await completePremiumChallenge(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should call next on error', async () => {
      vi.spyOn(pool, 'query').mockRejectedValueOnce(new Error('DB error'));

      req.params.challengeId = '1';
      const { completePremiumChallenge } = require('../../src/controllers/premiumChallengeController');
      await completePremiumChallenge(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
