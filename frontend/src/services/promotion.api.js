import axiosClient from './axiosClient';

export const promotionApi = {
  getAll: () => axiosClient.get('/promotions'),
  check: (code) => axiosClient.get(`/promotions/check/${code}`),
  create: (data) => axiosClient.post('/promotions', data),
  update: (id, data) => axiosClient.put(`/promotions/${id}`, data),
  delete: (id) => axiosClient.delete(`/promotions/${id}`),
};
