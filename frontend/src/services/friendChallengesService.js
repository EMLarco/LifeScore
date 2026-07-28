import api from '../api/axiosConfig';
import { FRIEND_CHALLENGES } from '../api/endpoints';

export const getActiveChallenges = async () => {
  const response = await api.get(FRIEND_CHALLENGES.BASE);
  return response.data.data;
};

export const createChallenge = async (data) => {
  const response = await api.post(FRIEND_CHALLENGES.BASE, data);
  return response.data;
};

export const acceptChallenge = async (id) => {
  const response = await api.put(FRIEND_CHALLENGES.ACCEPT(id));
  return response.data;
};

export const completeChallenge = async (id) => {
  const response = await api.put(FRIEND_CHALLENGES.COMPLETE(id));
  return response.data;
};
