const {
  calculateXPGain,
  calculateLevel,
  hasLeveledUp,
  checkAchievements,
  ACHIEVEMENTS,
} = require('../../src/services/gamificationLogic');

describe('Gamification Logic', () => {
  describe('calculateXPGain', () => {
    it('deberia devolver 10 XP base para racha 0', () => {
      expect(calculateXPGain(0)).toBe(10);
    });

    it('deberia sumar 2 XP por dia de racha', () => {
      expect(calculateXPGain(1)).toBe(12);
      expect(calculateXPGain(3)).toBe(16);
    });

    it('deberia limitar el bonus a 30 XP maximo', () => {
      expect(calculateXPGain(50)).toBe(40);
      expect(calculateXPGain(100)).toBe(40);
    });

    it('deberia manejar racha negativa', () => {
      expect(calculateXPGain(-1)).toBe(8);
    });
  });

  describe('calculateLevel', () => {
    it('deberia devolver nivel 1 para 0 XP', () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it('deberia calcular nivel 2 para 50 XP', () => {
      expect(calculateLevel(50)).toBe(2);
    });

    it('deberia calcular nivel 3 para 200 XP', () => {
      expect(calculateLevel(200)).toBe(3);
    });

    it('deberia calcular nivel 6 para 1250 XP', () => {
      expect(calculateLevel(1250)).toBe(6);
    });
  });

  describe('hasLeveledUp', () => {
    it('deberia devolver true si subio de nivel', () => {
      expect(hasLeveledUp(1, 2)).toBe(true);
    });

    it('deberia devolver false si no subio', () => {
      expect(hasLeveledUp(2, 2)).toBe(false);
    });
  });

  describe('ACHIEVEMENTS', () => {
    it('deberia tener al menos 10 logros', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(10);
    });

    it('cada logro deberia tener key, name, description, icon', () => {
      ACHIEVEMENTS.forEach((a) => {
        expect(a).toHaveProperty('key');
        expect(a).toHaveProperty('name');
        expect(a).toHaveProperty('description');
        expect(a).toHaveProperty('icon');
      });
    });
  });

  describe('checkAchievements', () => {
    it('deberia desbloquear FIRST_HABIT', () => {
      const stats = { habits_count: 1, max_streak: 0, level: 1, total_completed: 0 };
      expect(checkAchievements(stats, [])).toContain('FIRST_HABIT');
    });

    it('deberia desbloquear STREAK_7', () => {
      const stats = { habits_count: 0, max_streak: 7, level: 1, total_completed: 0 };
      expect(checkAchievements(stats, [])).toContain('STREAK_7');
    });

    it('deberia desbloquear LEVEL_5', () => {
      const stats = { habits_count: 0, max_streak: 0, level: 5, total_completed: 0 };
      expect(checkAchievements(stats, [])).toContain('LEVEL_5');
    });

    it('deberia desbloquear COMPLETE_100', () => {
      const stats = { habits_count: 0, max_streak: 0, level: 1, total_completed: 100 };
      expect(checkAchievements(stats, [])).toContain('COMPLETE_100');
    });

    it('deberia desbloquear HABITS_25', () => {
      const stats = { habits_count: 25, max_streak: 0, level: 1, total_completed: 0 };
      expect(checkAchievements(stats, [])).toContain('HABITS_25');
    });

    it('no deberia desbloquear logros ya existentes', () => {
      const stats = { habits_count: 1, max_streak: 7, level: 5, total_completed: 100 };
      const result = checkAchievements(stats, ['FIRST_HABIT', 'STREAK_7', 'LEVEL_5', 'COMPLETE_100']);
      expect(result).not.toContain('FIRST_HABIT');
      expect(result).not.toContain('STREAK_7');
      expect(result).not.toContain('LEVEL_5');
      expect(result).not.toContain('COMPLETE_100');
    });

    it('deberia devolver array vacio si no cumple nada', () => {
      const stats = { habits_count: 0, max_streak: 0, level: 1, total_completed: 0 };
      expect(checkAchievements(stats, [])).toEqual([]);
    });

    it('deberia desbloquear multiples logros a la vez', () => {
      const stats = { habits_count: 30, max_streak: 60, level: 20, total_completed: 500 };
      const result = checkAchievements(stats, []);
      expect(result).toContain('FIRST_HABIT');
      expect(result).toContain('HABITS_10');
      expect(result).toContain('HABITS_25');
      expect(result).toContain('STREAK_7');
      expect(result).toContain('STREAK_30');
      expect(result).toContain('STREAK_60');
      expect(result).toContain('LEVEL_5');
      expect(result).toContain('LEVEL_10');
      expect(result).toContain('LEVEL_20');
      expect(result).toContain('COMPLETE_100');
      expect(result).toContain('COMPLETE_500');
    });
  });
});
