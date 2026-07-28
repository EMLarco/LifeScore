const pool = require('../../src/config/database');
const Habit = require('../../src/models/Habit');

describe('Habit Model', () => {
  beforeEach(() => {
    vi.spyOn(pool, 'query').mockReset();
  });

  describe('findByUserId', () => {
    it('deberia devolver habitos del usuario', async () => {
      const mockHabits = [{ id: 1, title: 'Leer', user_id: 1 }];
      pool.query.mockResolvedValueOnce({ rows: mockHabits });

      const result = await Habit.findByUserId(1);
      expect(result).toEqual(mockHabits);
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('habits'), [1]);
    });

    it('deberia devolver array vacio', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await Habit.findByUserId(999);
      expect(result).toEqual([]);
    });
  });

  describe('findByIdAndUser', () => {
    it('deberia devolver el habito si existe', async () => {
      const mockHabit = { id: 1, title: 'Leer', user_id: 1 };
      pool.query.mockResolvedValueOnce({ rows: [mockHabit] });

      const result = await Habit.findByIdAndUser(1, 1);
      expect(result).toEqual(mockHabit);
    });

    it('deberia devolver null si no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await Habit.findByIdAndUser(999, 1);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deberia crear un habito con valores por defecto', async () => {
      const mockReturn = { id: 1, title: 'Ejercicio', icon: '💪', color: '#2ECC71', position: 1 };
      pool.query
        .mockResolvedValueOnce({ rows: [{ next_pos: 1 }] })
        .mockResolvedValueOnce({ rows: [mockReturn] });

      const result = await Habit.create({ user_id: 1, title: 'Ejercicio' });
      expect(result).toEqual(mockReturn);
    });

    it('deberia crear un habito con valores personalizados', async () => {
      const mockReturn = { id: 1, title: 'Meditar', icon: '🧘', color: '#9B59B6', position: 2 };
      pool.query
        .mockResolvedValueOnce({ rows: [{ next_pos: 2 }] })
        .mockResolvedValueOnce({ rows: [mockReturn] });

      const result = await Habit.create({ user_id: 1, title: 'Meditar', icon: '🧘', color: '#9B59B6' });
      expect(result).toEqual(mockReturn);
    });
  });

  describe('update', () => {
    it('deberia actualizar el habito', async () => {
      const mockUpdated = { id: 1, title: 'Nuevo Titulo' };
      pool.query.mockResolvedValueOnce({ rows: [mockUpdated] });

      const result = await Habit.update(1, 1, { title: 'Nuevo Titulo' });
      expect(result).toEqual(mockUpdated);
    });

    it('deberia devolver null si no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await Habit.update(999, 1, { title: 'X' });
      expect(result).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('deberia marcar como inactivo', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const result = await Habit.deleteById(1, 1);
      expect(result).toEqual({ id: 1 });
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SET active = false'), [1, 1]);
    });

    it('deberia devolver null si no existe', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await Habit.deleteById(999, 1);
      expect(result).toBeNull();
    });
  });
});
