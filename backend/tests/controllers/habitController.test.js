const pool = require('../../src/config/database');
const Habit = require('../../src/models/Habit');
const HabitLog = require('../../src/models/HabitLog');
const User = require('../../src/models/User');
const Achievement = require('../../src/models/Achievement');
const slackService = require('../../src/services/slackService');
const pushNotification = require('../../src/services/pushNotification');

const { getHabits, createHabit, completeHabit } = require('../../src/controllers/habitController');

describe('Habit Controller', () => {
  let req, res, next;

  beforeEach(() => {
    vi.spyOn(pool, 'query').mockReset();
    vi.spyOn(Habit, 'findByUserId').mockReset();
    vi.spyOn(Habit, 'findByIdAndUser').mockReset();
    vi.spyOn(Habit, 'create').mockReset();
    vi.spyOn(HabitLog, 'isCompletedToday').mockReset();
    vi.spyOn(HabitLog, 'createLog').mockReset();
    vi.spyOn(HabitLog, 'getStreak').mockReset();
    vi.spyOn(User, 'findById').mockReset();
    vi.spyOn(User, 'getStats').mockReset();
    vi.spyOn(User, 'updateXpAndLevel').mockReset();
    vi.spyOn(User, 'updateStreakAndPoints').mockReset();
    vi.spyOn(Achievement, 'getUnlockedKeys').mockReset();
    vi.spyOn(Achievement, 'create').mockReset();
    vi.spyOn(slackService, 'sendSlackNotification').mockReset();
    vi.spyOn(pushNotification, 'sendToUser').mockReset();

    pool.query.mockResolvedValue({ rows: [{ total: '0' }] });
    slackService.sendSlackNotification.mockResolvedValue({});
    pushNotification.sendToUser.mockResolvedValue({});

    req = { user: { id: 1, level: 1 }, params: {}, body: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  describe('getHabits', () => {
    it('deberia obtener todos los habitos del usuario', async () => {
      const mockHabits = [{ id: 1, title: 'Leer', user_id: 1 }];
      Habit.findByUserId.mockResolvedValue(mockHabits);

      await getHabits(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockHabits });
    });
  });

  describe('createHabit', () => {
    it('deberia crear un habito exitosamente', async () => {
      req.body = { title: 'Ejercicio', icon: '💪', color: '#2ECC71' };
      const newHabit = { id: 1, title: 'Ejercicio', user_id: 1 };
      Habit.create.mockResolvedValue(newHabit);
      User.getStats.mockResolvedValue({ habits_count: 1, max_streak: 0 });
      Achievement.getUnlockedKeys.mockResolvedValue([]);
      Achievement.create.mockResolvedValue({});

      await createHabit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: newHabit,
      }));
    });
  });

  describe('completeHabit', () => {
    it('deberia completar un habito y devolver XP', async () => {
      req.params = { id: 1 };
      Habit.findByIdAndUser.mockResolvedValue({ id: 1, title: 'Leer', user_id: 1 });
      HabitLog.isCompletedToday.mockResolvedValue(false);
      HabitLog.createLog.mockResolvedValue({});
      HabitLog.getStreak.mockResolvedValue(3);
      User.findById.mockResolvedValue({ id: 1, total_xp: 10, level: 1 });
      User.updateXpAndLevel.mockResolvedValue({});
      User.updateStreakAndPoints.mockResolvedValue({});
      User.getStats.mockResolvedValue({ habits_count: 1, max_streak: 3 });
      Achievement.getUnlockedKeys.mockResolvedValue([]);
      Achievement.create.mockResolvedValue({});

      await completeHabit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
      }));
    });

    it('deberia devolver 404 si el habito no existe', async () => {
      req.params = { id: 999 };
      Habit.findByIdAndUser.mockResolvedValue(null);

      await completeHabit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('deberia devolver 400 si ya se completo hoy', async () => {
      req.params = { id: 1 };
      Habit.findByIdAndUser.mockResolvedValue({ id: 1, title: 'Leer', user_id: 1 });
      HabitLog.isCompletedToday.mockResolvedValue(true);

      await completeHabit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });
});
