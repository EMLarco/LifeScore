import api from '../api/axiosConfig';
import { AUTH } from '../api/endpoints';

export const login = async (email, password) => {
  const response = await api.post(AUTH.LOGIN, { email, password });
  return response.data;
};

export const register = async (name, email, password, gender) => {
  const response = await api.post(AUTH.REGISTER, { name, email, password, gender });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get(AUTH.PROFILE);
  return response.data.user;
};

export const googleLogin = async (code) => {
  const response = await api.post('/auth/google-login', { code });
  if (response.data.token) localStorage.setItem('token', response.data.token);
  return response.data;
};

export const loginWith2FA = async (tempToken, code) => {
  const response = await api.post('/auth/login-2fa', { temp_token: tempToken, code });
  return response.data;
};

export const send2FACode = async (email) => {
  const response = await api.post('/auth/send-2fa-code', { email });
  return response.data;
};

export const verify2FA = async (code) => {
  const response = await api.post('/auth/verify-2fa', { code });
  return response.data;
};

export const enable2FA = async () => {
  const response = await api.post('/auth/enable-2fa');
  return response.data;
};

export const disable2FA = async (code) => {
  const response = await api.post('/auth/disable-2fa', { code });
  return response.data;
};
