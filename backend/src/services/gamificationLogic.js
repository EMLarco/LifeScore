const XP_PER_HABIT = 10;
const XP_BONUS_PER_STREAK_DAY = 2;

const calculateXPGain = (streak) => {
  const baseXP = XP_PER_HABIT;
  const bonusXP = Math.min(streak * XP_BONUS_PER_STREAK_DAY, 30);
  return baseXP + bonusXP;
};

const calculateLevel = (totalXp) => {
  return Math.floor(1 + Math.sqrt(totalXp / 50));
};

const hasLeveledUp = (oldLevel, newLevel) => {
  return newLevel > oldLevel;
};

const ACHIEVEMENTS = [
  { key: 'FIRST_HABIT', name: 'Primer Habito', description: 'Creaste tu primer habito', icon: '🌟' },
  { key: 'STREAK_7', name: 'Semana de Fuego', description: 'Completa habitos 7 dias seguidos', icon: '🔥' },
  { key: 'STREAK_30', name: 'Maratonista', description: 'Completa habitos 30 dias seguidos', icon: '🏃' },
  { key: 'STREAK_60', name: 'Leyenda', description: 'Completa habitos 60 dias seguidos', icon: '⭐' },
  { key: 'LEVEL_5', name: 'Aprendiz', description: 'Alcanza el Nivel 5', icon: '📚' },
  { key: 'LEVEL_10', name: 'Maestro', description: 'Alcanza el Nivel 10', icon: '👑' },
  { key: 'LEVEL_20', name: 'Experto', description: 'Alcanza el Nivel 20', icon: '🏅' },
  { key: 'HABITS_10', name: 'Coleccionista', description: 'Crea 10 habitos diferentes', icon: '📋' },
  { key: 'HABITS_25', name: 'Creador', description: 'Crea 25 habitos diferentes', icon: '🛠️' },
  { key: 'COMPLETE_100', name: 'Dedicado', description: 'Completa 100 habitos en total', icon: '💯' },
  { key: 'COMPLETE_500', name: 'Maquina', description: 'Completa 500 habitos en total', icon: '⚡' },
];

const checkAchievements = (userStats, unlockedKeys) => {
  const unlockedSet = new Set(unlockedKeys);
  const newAchievements = [];

  if (!unlockedSet.has('FIRST_HABIT') && userStats.habits_count >= 1) {
    newAchievements.push('FIRST_HABIT');
  }
  if (!unlockedSet.has('HABITS_10') && userStats.habits_count >= 10) {
    newAchievements.push('HABITS_10');
  }
  if (!unlockedSet.has('STREAK_7') && userStats.max_streak >= 7) {
    newAchievements.push('STREAK_7');
  }
  if (!unlockedSet.has('STREAK_30') && userStats.max_streak >= 30) {
    newAchievements.push('STREAK_30');
  }
  if (!unlockedSet.has('STREAK_60') && userStats.max_streak >= 60) {
    newAchievements.push('STREAK_60');
  }
  if (!unlockedSet.has('LEVEL_5') && userStats.level >= 5) {
    newAchievements.push('LEVEL_5');
  }
  if (!unlockedSet.has('LEVEL_10') && userStats.level >= 10) {
    newAchievements.push('LEVEL_10');
  }
  if (!unlockedSet.has('LEVEL_20') && userStats.level >= 20) {
    newAchievements.push('LEVEL_20');
  }
  if (!unlockedSet.has('HABITS_10') && userStats.habits_count >= 10) {
    newAchievements.push('HABITS_10');
  }
  if (!unlockedSet.has('HABITS_25') && userStats.habits_count >= 25) {
    newAchievements.push('HABITS_25');
  }
  if (!unlockedSet.has('COMPLETE_100') && userStats.total_completed >= 100) {
    newAchievements.push('COMPLETE_100');
  }
  if (!unlockedSet.has('COMPLETE_500') && userStats.total_completed >= 500) {
    newAchievements.push('COMPLETE_500');
  }

  return newAchievements;
};

module.exports = {
  calculateXPGain,
  calculateLevel,
  hasLeveledUp,
  ACHIEVEMENTS,
  checkAchievements,
};