import axios from 'axios';

const API_URL = '/api/auth';

// Attach token to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

const login = async (email: string, password: string, role: string) => {
  const res = await axios.post(`${API_URL}/login`, { email, password, role });
  return res.data;
};

const register = async (name: string, email: string, password: string) => {
  const res = await axios.post(`${API_URL}/register`, { name, email, password });
  return res.data;
};

const changePassword = async (oldPassword: string, newPassword: string) => {
  const res = await axios.post(`${API_URL}/change-password`, { currentPassword: oldPassword, newPassword });
  return res.data;
};

const authService = {
  login,
  register,
  changePassword,
};

export default authService; 