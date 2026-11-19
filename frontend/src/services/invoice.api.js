import axiosClient from './axiosClient';

export const invoiceApi = {
  create: (data) => axiosClient.post('/invoices', data),
  mergeTables: (data) => axiosClient.post('/invoices/merge-tables', data),
  splitBill: (data) => axiosClient.post('/invoices/split-bill', data),
  getAll: (params) => axiosClient.get('/invoices', { params }),
  getById: (id) => axiosClient.get(`/invoices/${id}`),
  getByOrderId: (orderId) => axiosClient.get(`/invoices/order/${orderId}`),
};
