import axiosClient from './axiosClient';

export const authApi = {
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  getMe: () => axiosClient.get('/auth/me'),
  register: (userData) => axiosClient.post('/auth/register', userData),
  getUsers: () => axiosClient.get('/auth/users'),
  toggleUserActive: (id) => axiosClient.patch(`/auth/users/${id}/toggle-active`),
  updateUser: (id, data) => axiosClient.put(`/auth/users/${id}`, data),
};
