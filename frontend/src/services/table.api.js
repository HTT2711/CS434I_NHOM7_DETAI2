import axiosClient from './axiosClient';

export const tableApi = {
  getAll: () => axiosClient.get('/tables'),
  getById: (id) => axiosClient.get(`/tables/${id}`),
  getByToken: (token) => axiosClient.get(`/tables/by-token/${token}`),
  create: (data) => axiosClient.post('/tables', data),
  update: (id, data) => axiosClient.put(`/tables/${id}`, data),
  updateStatus: (id, status) => axiosClient.patch(`/tables/${id}/status`, { status }),
  regenerateQr: (id) => axiosClient.post(`/tables/${id}/regenerate-qr`),
  delete: (id) => axiosClient.delete(`/tables/${id}`),
};
