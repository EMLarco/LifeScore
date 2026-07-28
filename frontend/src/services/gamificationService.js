import api from '../api/axiosConfig';
import { GAMIFICATION } from '../api/endpoints';

export const getGamificationStats = async () => {
  const response = await api.get(GAMIFICATION.STATS);
  return response.data.data;
};