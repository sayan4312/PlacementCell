import apiClient from './apiClient';

const API_URL = '/auth';

const login = async (email: string, password: string, role: string) => {
  const res = await apiClient.post(`${API_URL}/login`, { email, password, role });
  return res.data;
};

const register = async (name: string, email: string, password: string) => {
  const res = await apiClient.post(`${API_URL}/register`, { name, email, password });
  return res.data;
};

const changePassword = async (oldPassword: string, newPassword: string) => {
  const res = await apiClient.post(`${API_URL}/change-password`, { currentPassword: oldPassword, newPassword });
  return res.data;
};

const authService = {
  login,
  register,
  changePassword,
};

export default authService; 