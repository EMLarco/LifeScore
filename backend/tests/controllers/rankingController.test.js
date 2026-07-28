const pool = require('../../src/config/database');

const { getGlobalRanking, getFriendsRanking } = require('../../src/controllers/rankingController');

describe('Ranking Controller', () => {
  let req, res, next;

  beforeEach(() => {
    vi.spyOn(pool, 'query').mockReset();

    req = { query: {}, user: { id: 1 } };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  describe('getGlobalRanking', () => {
    it('deberia devolver el ranking global', async () => {
      const mockData = [
        { id: 1, name: 'Juan', level: 5, points: 500 },
        { id: 2, name: 'Ana', level: 3, points: 300 },
      ];
      pool.query.mockResolvedValueOnce({ rows: mockData });

      await getGlobalRanking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
    });

    it('deberia usar limit por defecto de 20', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      await getGlobalRanking(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [20]);
    });

    it('deberia respetar limit personalizado', async () => {
      req.query.limit = '5';
      pool.query.mockResolvedValueOnce({ rows: [] });

      await getGlobalRanking(req, res, next);

      expect(pool.query).toHaveBeenCalledWith(expect.any(String), [5]);
    });
  });

  describe('getFriendsRanking', () => {
    it('deberia devolver ranking de amigos', async () => {
      const mockData = [{ id: 2, name: 'Amigo', level: 3, points: 200 }];
      pool.query.mockResolvedValueOnce({ rows: mockData });

      await getFriendsRanking(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
    });

    it('deberia llamar next con error si falla', async () => {
      const error = new Error('DB Error');
      pool.query.mockRejectedValueOnce(error);

      await getFriendsRanking(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
