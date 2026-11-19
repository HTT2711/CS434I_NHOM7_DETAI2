import axiosClient from './axiosClient';

export const reportApi = {
  getStats: (period) => axiosClient.get('/reports/stats', { params: { period } }),
  getRevenueChart: (period) => axiosClient.get('/reports/revenue-chart', { params: { period } }),
  getTopSelling: (limit) => axiosClient.get('/reports/top-selling', { params: { limit } }),
};
