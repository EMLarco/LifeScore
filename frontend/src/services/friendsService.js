import api from '../api/axiosConfig';
import { FRIENDS } from '../api/endpoints';

export const searchUsers = async (query) => {
  const response = await api.get(FRIENDS.SEARCH, { params: { q: query } });
  return response.data.data;
};

export const getAllUsers = async (page = 1, limit = 10, search = '') => {
  const response = await api.get(FRIENDS.ALL, { params: { page, limit, search } });
  return response.data;
};

export const sendFriendRequest = async (friendId) => {
  const response = await api.post(FRIENDS.BASE, { friend_id: friendId });
  return response.data;
};

export const getPendingRequests = async () => {
  const response = await api.get(FRIENDS.PENDING);
  return response.data.data;
};

export const getFriends = async () => {
  const response = await api.get(FRIENDS.BASE);
  return response.data.data;
};

export const acceptFriendRequest = async (id) => {
  const response = await api.put(FRIENDS.ACCEPT(id));
  return response.data;
};

export const rejectFriendRequest = async (id) => {
  const response = await api.put(FRIENDS.REJECT(id));
  return response.data;
};

export const removeFriend = async (id) => {
  const response = await api.delete(FRIENDS.REMOVE(id));
  return response.data;
};
