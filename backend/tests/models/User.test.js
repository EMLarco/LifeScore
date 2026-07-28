const pool = require('../../src/config/database');
const User = require('../../src/models/User');

describe('User Model', () => {
  beforeEach(() => {
    vi.spyOn(pool, 'query').mockReset();
  });

  describe('findByEmail', () => {
    it('deberia devolver el usuario si existe', async () => {
      const mockUser = { id: 1, email: 'test@test.com', name: 'Test' };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await User.findByEmail('test@test.com');
      expect(result).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['test@test.com']);
    });

    it('deberia devolver null si no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await User.findByEmail('noexist@test.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('deberia devolver el usuario por ID', async () => {
      const mockUser = { id: 1, email: 'test@test.com', name: 'Test' };
      pool.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await User.findById(1);
      expect(result).toEqual(mockUser);
    });

    it('deberia devolver null si no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await User.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deberia crear un nuevo usuario', async () => {
      const mockReturn = { id: 10, name: 'Test', email: 'newuser@test.com', total_xp: 0, level: 1, gender: 'other', points: 0, daily_streak: 0, is_premium: false, username: 'newuser', tag: 'ABC12' };
      pool.query.mockResolvedValueOnce({ rows: [mockReturn] });

      const result = await User.create({ name: 'Test', email: 'newuser@test.com', password_hash: 'hashed', gender: 'other' });
      expect(result).toEqual(mockReturn);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['Test', 'newuser@test.com', 'hashed', 'other'])
      );
    });
  });

  describe('updateXpAndLevel', () => {
    it('deberia ejecutar UPDATE con los valores correctos', async () => {
      pool.query.mockResolvedValueOnce({});
      await User.updateXpAndLevel(1, 100, 3);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE users SET total_xp = $1, level = $2 WHERE id = $3',
        [100, 3, 1]
      );
    });
  });

  describe('updateStreakAndPoints', () => {
    it('deberia ejecutar UPDATE con streak y points', async () => {
      pool.query.mockResolvedValueOnce({});
      await User.updateStreakAndPoints(1, 5, 10);

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE users SET daily_streak = $1, points = points + $2 WHERE id = $3',
        [5, 10, 1]
      );
    });
  });

  describe('getStats', () => {
    it('deberia devolver stats del usuario', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ habits_count: '5', max_streak: '10' }] });

      const result = await User.getStats(1);
      expect(result).toEqual({ habits_count: '5', max_streak: '10' });
    });
  });

  describe('findByUsernameAndTag', () => {
    it('deberia encontrar usuario por username y tag', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const result = await User.findByUsernameAndTag('test', 'ABC12');
      expect(result).toEqual({ id: 1 });
    });

    it('deberia devolver null si no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await User.findByUsernameAndTag('nobody', 'ZZZZZ');
      expect(result).toBeNull();
    });
  });
});
