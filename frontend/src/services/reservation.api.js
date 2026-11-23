import axiosClient from './axiosClient';

export const reservationApi = {
  getAll: (params) => axiosClient.get('/reservations', { params }),
  create: (data) => axiosClient.post('/reservations', data),
  update: (id, data) => axiosClient.patch(`/reservations/${id}`, data),
  delete: (id) => axiosClient.delete(`/reservations/${id}`),
};
