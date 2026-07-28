const pool = require('../../src/config/database');
const HabitLog = require('../../src/models/HabitLog');

describe('HabitLog Model', () => {
  beforeEach(() => {
    vi.spyOn(pool, 'query').mockReset();
  });

  describe('createLog', () => {
    it('deberia crear un registro de habito', async () => {
      const mockLog = { id: 1, habit_id: 1, user_id: 1 };
      pool.query.mockResolvedValueOnce({ rows: [mockLog] });

      const result = await HabitLog.createLog(1, 1);
      expect(result).toEqual(mockLog);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO habit_logs'), [1, 1]);
    });
  });

  describe('isCompletedToday', () => {
    it('deberia devolver true si ya esta completado hoy', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const result = await HabitLog.isCompletedToday(1, 1);
      expect(result).toBe(true);
    });

    it('deberia devolver false si no esta completado hoy', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await HabitLog.isCompletedToday(1, 1);
      expect(result).toBe(false);
    });
  });

  describe('getStreak', () => {
    it('deberia devolver la racha actual', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ streak: '5' }] });

      const result = await HabitLog.getStreak(1, 1);
      expect(result).toBe(5);
    });

    it('deberia devolver 0 si no hay racha', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ streak: '0' }] });

      const result = await HabitLog.getStreak(1, 1);
      expect(result).toBe(0);
    });

    it('deberia manejar null gracefully', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{}] });

      const result = await HabitLog.getStreak(1, 1);
      expect(result).toBe(0);
    });
  });

  describe('getMonthlyLogs', () => {
    it('deberia devolver logs del mes', async () => {
      const mockLogs = [{ date: '2026-07-01', count: '3' }];
      pool.query.mockResolvedValueOnce({ rows: mockLogs });

      const result = await HabitLog.getMonthlyLogs(1, 2026, 7);
      expect(result).toEqual(mockLogs);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('EXTRACT'), [1, 2026, 7]);
    });
  });
});
