import axiosClient from './axiosClient';

export const reportApi = {
  getStats: () => axiosClient.get('/reports/stats'),
  getRevenueChart: () => axiosClient.get('/reports/revenue-chart'),
  getTopSelling: (limit) => axiosClient.get('/reports/top-selling', { params: { limit } }),
};
