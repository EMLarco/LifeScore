import api from '../api/axiosConfig';

export const getRewards = async () => {
  const response = await api.get('/rewards');
  return response.data.data;
};

export const getUserRewards = async () => {
  const response = await api.get('/rewards/mine');
  return response.data.data;
};

export const redeemReward = async (rewardId) => {
  const response = await api.post(`/rewards/${rewardId}/redeem`);
  return response.data;
};
