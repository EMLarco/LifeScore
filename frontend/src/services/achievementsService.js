import api from '../api/axiosConfig';
import { ACHIEVEMENTS } from '../api/endpoints';

export const getAchievements = async (page = 1, limit = 36) => {
  const response = await api.get(ACHIEVEMENTS.BASE, { params: { page, limit } });
  return response.data.data;
};
