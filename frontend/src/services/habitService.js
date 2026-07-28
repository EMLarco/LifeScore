import api from '../api/axiosConfig';
import { HABITS } from '../api/endpoints';

export const getHabits = async () => {
  const response = await api.get(HABITS.BASE);
  return response.data.data;
};

export const createHabit = async (habit) => {
  const response = await api.post(HABITS.BASE, habit);
  return response.data.data;
};

export const updateHabit = async (id, data) => {
  const response = await api.put(`${HABITS.BASE}/${id}`, data);
  return response.data.data;
};

export const deleteHabit = async (id) => {
  await api.delete(`${HABITS.BASE}/${id}`);
};

export const completeHabit = async (id) => {
  const response = await api.post(HABITS.COMPLETE(id));
  return response.data.data;
};